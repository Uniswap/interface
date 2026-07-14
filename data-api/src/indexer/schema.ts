/**
 * SQLite storage + schema for the HookSwap Phase-2 event indexer.
 *
 * Storage engine is `better-sqlite3` (synchronous, single-file, no external DB). The DB file path
 * comes from env `INDEXER_DB_PATH` (default `./indexer.db`, relative to the service working dir).
 *
 * DESIGN NOTES / honesty rules:
 *   - Every stored value originates from a REAL on-chain event (Swap/Sync log) or a real on-chain
 *     read (pool token metadata from onchain.getV2Pairs). Nothing here fabricates prices/volumes.
 *   - Big integers (amounts, reserves) are stored as TEXT decimal strings — NEVER JS numbers — so
 *     uint112/uint256 values are preserved exactly (JS `number` loses precision above 2^53).
 *   - `pool_meta` (token0/token1 addresses + decimals) is added beyond the raw-event tables so the
 *     metrics layer can compute native-denominated / decimal-adjusted prices purely from stored data
 *     (no live RPC read at query time). It is populated from onchain.getV2Pairs — real on-chain reads.
 *
 * ⚠ better-sqlite3 ships no bundled TypeScript types and `@types/better-sqlite3` is NOT installed in
 * this (disk-constrained) checkout, so the `import` below is the single expected TS2307 for this
 * module (mirrors the pre-existing `@connectrpc/connect-node` gap in server.ts). We describe the tiny
 * slice of the better-sqlite3 API we actually use via the `SqliteDatabase` interface, so all query
 * code in this module and in ingest/metrics stays fully type-checked regardless of whether the
 * runtime types resolve. `npm install better-sqlite3 @types/better-sqlite3` makes the import resolve.
 */

// eslint-disable-next-line import/no-unresolved
import DatabaseConstructor from 'better-sqlite3'

// ---------- minimal structural typing of the better-sqlite3 API we use ----------

interface RunResult {
  changes: number
  lastInsertRowid: number | bigint
}
interface Statement {
  run(...params: unknown[]): RunResult
  get(...params: unknown[]): unknown
  all(...params: unknown[]): unknown[]
}
export interface SqliteDatabase {
  prepare(sql: string): Statement
  exec(sql: string): void
  pragma(source: string): unknown
  transaction<F extends (...args: never[]) => unknown>(fn: F): F
  close(): void
}
interface DatabaseCtor {
  new (filename: string): SqliteDatabase
}

// Whether the imported symbol is typed (types installed) or `any` (types absent), this cast compiles.
const Database = DatabaseConstructor as unknown as DatabaseCtor

// ---------- row shapes (what callers read back) ----------

export interface SwapEventRow {
  chainId: number
  pool: string
  blockNumber: number
  logIndex: number
  txHash: string
  sender: string
  recipient: string
  /**
   * tx-origin EOA (`tx.from`), lowercased — the real trader wallet. Captured per-tx by the ingest
   * loop (see ingest.ts). Empty string when unresolved (RPC gap, or a row indexed before origin
   * capture existed). NEVER fabricated; the leaderboard falls back to `recipient` when this is ''.
   */
  origin: string
  /** uint256 token amounts, decimal strings. */
  amount0In: string
  amount1In: string
  amount0Out: string
  amount1Out: string
  /** unix seconds (block timestamp). */
  timestamp: number
}

export interface SyncEventRow {
  chainId: number
  pool: string
  blockNumber: number
  logIndex: number
  /** uint112 reserves, decimal strings. */
  reserve0: string
  reserve1: string
  /** unix seconds (block timestamp). */
  timestamp: number
}

export interface PoolMetaRow {
  chainId: number
  pool: string
  token0: string
  token1: string
  decimals0: number
  decimals1: number
  symbol0: string
  symbol1: string
}

export interface CursorRow {
  chainId: number
  pool: string
  /** last block fully scanned for this pool (inclusive). Next pass starts at lastBlock + 1. */
  lastBlock: number
}

// ---------- schema DDL ----------

const DDL = `
CREATE TABLE IF NOT EXISTS swap_events (
  chainId      INTEGER NOT NULL,
  pool         TEXT    NOT NULL,
  blockNumber  INTEGER NOT NULL,
  logIndex     INTEGER NOT NULL,
  txHash       TEXT    NOT NULL,
  sender       TEXT    NOT NULL DEFAULT '',
  recipient    TEXT    NOT NULL DEFAULT '',
  origin       TEXT    NOT NULL DEFAULT '',
  amount0In    TEXT    NOT NULL,
  amount1In    TEXT    NOT NULL,
  amount0Out   TEXT    NOT NULL,
  amount1Out   TEXT    NOT NULL,
  timestamp    INTEGER NOT NULL,
  PRIMARY KEY (chainId, pool, blockNumber, logIndex)
);
CREATE INDEX IF NOT EXISTS idx_swap_pool_block ON swap_events (chainId, pool, blockNumber);
CREATE INDEX IF NOT EXISTS idx_swap_pool_ts    ON swap_events (chainId, pool, timestamp);
-- Wallet-scoped activity feed (ListTransactions) filters by the swap's on-chain participant
-- (Swap.to = recipient, Swap.sender = the caller/router). These indexes make that lookup cheap.
CREATE INDEX IF NOT EXISTS idx_swap_recipient  ON swap_events (chainId, recipient);
CREATE INDEX IF NOT EXISTS idx_swap_sender     ON swap_events (chainId, sender);
-- Trading-leaderboard attribution: aggregate swaps per trader EOA (tx.from) within a time window.
CREATE INDEX IF NOT EXISTS idx_swap_origin      ON swap_events (chainId, origin, timestamp);

CREATE TABLE IF NOT EXISTS sync_events (
  chainId      INTEGER NOT NULL,
  pool         TEXT    NOT NULL,
  blockNumber  INTEGER NOT NULL,
  logIndex     INTEGER NOT NULL,
  reserve0     TEXT    NOT NULL,
  reserve1     TEXT    NOT NULL,
  timestamp    INTEGER NOT NULL,
  PRIMARY KEY (chainId, pool, blockNumber, logIndex)
);
CREATE INDEX IF NOT EXISTS idx_sync_pool_block ON sync_events (chainId, pool, blockNumber);
CREATE INDEX IF NOT EXISTS idx_sync_pool_ts    ON sync_events (chainId, pool, timestamp);

CREATE TABLE IF NOT EXISTS pool_meta (
  chainId      INTEGER NOT NULL,
  pool         TEXT    NOT NULL,
  token0       TEXT    NOT NULL,
  token1       TEXT    NOT NULL,
  decimals0    INTEGER NOT NULL,
  decimals1    INTEGER NOT NULL,
  symbol0      TEXT    NOT NULL DEFAULT '',
  symbol1      TEXT    NOT NULL DEFAULT '',
  PRIMARY KEY (chainId, pool)
);

CREATE TABLE IF NOT EXISTS ingest_cursor (
  chainId      INTEGER NOT NULL,
  pool         TEXT    NOT NULL,
  lastBlock    INTEGER NOT NULL,
  PRIMARY KEY (chainId, pool)
);
`

// ---------- connection singleton ----------

let dbSingleton: SqliteDatabase | undefined

/** Resolve the DB file path from env (default ./indexer.db in the service working dir). */
export function resolveDbPath(): string {
  return process.env.INDEXER_DB_PATH || './indexer.db'
}

/**
 * Open (once) and initialize the indexer DB: WAL journal for concurrent read while the ingest loop
 * writes, NORMAL sync (durable enough for a rebuildable cache), and the schema DDL (idempotent).
 */
export function getDb(): SqliteDatabase {
  if (dbSingleton) {
    return dbSingleton
  }
  const db = new Database(resolveDbPath())
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')
  // Idempotent `origin` migration — MUST run BEFORE `db.exec(DDL)`: on an existing pre-`origin` DB the
  // DDL's `CREATE TABLE IF NOT EXISTS swap_events` is a no-op (so the table still lacks `origin`), and the
  // DDL also builds `idx_swap_origin` which references `origin` — that index would fail unless the column
  // is added first. ALTER throws "no such table" on a brand-new DB (table not created yet → DDL below makes
  // it WITH origin) and "duplicate column name" once origin already exists — both are harmless, swallow.
  try {
    db.exec(`ALTER TABLE swap_events ADD COLUMN origin TEXT NOT NULL DEFAULT ''`)
  } catch {
    // fresh DB (DDL below creates swap_events with origin) or column already present — nothing to do.
  }
  db.exec(DDL)
  dbSingleton = db
  return db
}

/** Close the singleton DB (tests / shutdown). */
export function closeDb(): void {
  if (dbSingleton) {
    dbSingleton.close()
    dbSingleton = undefined
  }
}

// ---------- write helpers (all idempotent via INSERT OR IGNORE / UPSERT) ----------

/** Insert a batch of swap events idempotently. Returns the count actually inserted (new rows). */
export function insertSwapEvents(db: SqliteDatabase, rows: SwapEventRow[]): number {
  if (rows.length === 0) {
    return 0
  }
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO swap_events
       (chainId, pool, blockNumber, logIndex, txHash, sender, recipient, origin, amount0In, amount1In, amount0Out, amount1Out, timestamp)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  )
  const insertAll = db.transaction((batch: SwapEventRow[]) => {
    let inserted = 0
    for (const r of batch) {
      const res = stmt.run(
        r.chainId, r.pool, r.blockNumber, r.logIndex, r.txHash, r.sender, r.recipient, r.origin,
        r.amount0In, r.amount1In, r.amount0Out, r.amount1Out, r.timestamp,
      )
      inserted += res.changes
    }
    return inserted
  })
  return insertAll(rows) as number
}

/** Insert a batch of sync (reserve snapshot) events idempotently. Returns count inserted. */
export function insertSyncEvents(db: SqliteDatabase, rows: SyncEventRow[]): number {
  if (rows.length === 0) {
    return 0
  }
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO sync_events
       (chainId, pool, blockNumber, logIndex, reserve0, reserve1, timestamp)
     VALUES (?,?,?,?,?,?,?)`,
  )
  const insertAll = db.transaction((batch: SyncEventRow[]) => {
    let inserted = 0
    for (const r of batch) {
      const res = stmt.run(r.chainId, r.pool, r.blockNumber, r.logIndex, r.reserve0, r.reserve1, r.timestamp)
      inserted += res.changes
    }
    return inserted
  })
  return insertAll(rows) as number
}

/** Upsert pool token metadata (real on-chain values from getV2Pairs). */
export function upsertPoolMeta(db: SqliteDatabase, row: PoolMetaRow): void {
  db.prepare(
    `INSERT INTO pool_meta (chainId, pool, token0, token1, decimals0, decimals1, symbol0, symbol1)
     VALUES (?,?,?,?,?,?,?,?)
     ON CONFLICT(chainId, pool) DO UPDATE SET
       token0=excluded.token0, token1=excluded.token1,
       decimals0=excluded.decimals0, decimals1=excluded.decimals1,
       symbol0=excluded.symbol0, symbol1=excluded.symbol1`,
  ).run(row.chainId, row.pool, row.token0, row.token1, row.decimals0, row.decimals1, row.symbol0, row.symbol1)
}

/** Read a pool's stored metadata, or undefined if never ingested. */
export function getPoolMeta(db: SqliteDatabase, chainId: number, pool: string): PoolMetaRow | undefined {
  const row = db
    .prepare(`SELECT chainId, pool, token0, token1, decimals0, decimals1, symbol0, symbol1 FROM pool_meta WHERE chainId=? AND pool=?`)
    .get(chainId, pool) as PoolMetaRow | undefined
  return row
}

/** Read the ingest cursor (last fully-scanned block) for a pool, or undefined if never scanned. */
export function getCursor(db: SqliteDatabase, chainId: number, pool: string): number | undefined {
  const row = db
    .prepare(`SELECT lastBlock FROM ingest_cursor WHERE chainId=? AND pool=?`)
    .get(chainId, pool) as { lastBlock: number } | undefined
  return row?.lastBlock
}

/** Persist the ingest cursor (last fully-scanned block) for a pool. */
export function setCursor(db: SqliteDatabase, chainId: number, pool: string, lastBlock: number): void {
  db.prepare(
    `INSERT INTO ingest_cursor (chainId, pool, lastBlock) VALUES (?,?,?)
     ON CONFLICT(chainId, pool) DO UPDATE SET lastBlock=excluded.lastBlock`,
  ).run(chainId, pool, lastBlock)
}

// ---------- transaction/activity reads (ListTransactions / GetTransaction) ----------

const SWAP_EVENT_COLUMNS = `chainId, pool, blockNumber, logIndex, txHash, sender, recipient, origin,
       amount0In, amount1In, amount0Out, amount1Out, timestamp`

/**
 * Read a wallet's swap events on one chain — every indexed Swap where the wallet is the on-chain
 * participant: the swap's recipient (Swap.to) OR its sender (msg.sender to the pair; usually the
 * router, but the wallet itself when it calls the pair directly). Matching is case-insensitive
 * (stored sender/recipient are checksummed, callers pass lowercased addresses).
 *
 * Ordered most-recent-first (timestamp, then block, then log) and hard-capped by `limit` to bound
 * memory — a single wallet's swap history on these chains is small. Returns [] when nothing matches
 * or the address list is empty. NOTE: the v2 Swap event does NOT carry the tx-origin EOA, so a swap
 * whose output is fully intermediated by the router (swept to the router, not the wallet) is not
 * attributable to the wallet from Swap logs alone — that is an honest coverage gap, never faked.
 */
export function getWalletSwapEvents(
  db: SqliteDatabase,
  chainId: number,
  walletsLower: string[],
  limit: number,
): SwapEventRow[] {
  if (walletsLower.length === 0) {
    return []
  }
  const placeholders = walletsLower.map(() => '?').join(',')
  return db
    .prepare(
      `SELECT ${SWAP_EVENT_COLUMNS}
         FROM swap_events
        WHERE chainId=?
          AND ( LOWER(recipient) IN (${placeholders}) OR LOWER(sender) IN (${placeholders}) )
        ORDER BY timestamp DESC, blockNumber DESC, logIndex DESC
        LIMIT ?`,
    )
    .all(chainId, ...walletsLower, ...walletsLower, limit) as SwapEventRow[]
}

/**
 * Read every swap event of a single transaction on one chain (a multi-hop swap emits one Swap per
 * hop), ordered by log index ascending. `txHashLower` must be lowercased; stored txHash is the
 * lowercased hex from the log. Returns [] when the tx has no indexed swap.
 */
export function getSwapEventsByTx(db: SqliteDatabase, chainId: number, txHashLower: string): SwapEventRow[] {
  return db
    .prepare(
      `SELECT ${SWAP_EVENT_COLUMNS}
         FROM swap_events
        WHERE chainId=? AND LOWER(txHash)=?
        ORDER BY blockNumber ASC, logIndex ASC`,
    )
    .all(chainId, txHashLower) as SwapEventRow[]
}
