# HookSwap data-api — Phase-2 Indexer Deploy Runbook

Rollout for the Phase-2 historical/pricing indexer that extends the existing `data-api/` service.
The indexer is **flag-gated OFF by default** (`INDEXER_ENABLED` unset/`false`) so shipping the code
does NOT change live behavior until the flag is flipped. Everything below is verified against the
live VPS on 2026-07-10 unless marked "confirm".

## Live topology (verified)
- **Host:** `ssh -i ~/.ssh/hookos_deploy ubuntu@15.204.8.186` (`vps-90c4a158`).
- **Service:** `hookswap-data-api.service` (systemd), `active`.
  - `WorkingDirectory=/home/ubuntu/hookswap-data-api`
  - `EnvironmentFile=/home/ubuntu/hookswap-data-api/.env`
  - `ExecStart=/usr/bin/node dist/server.js`  → **system node** (`node -v` = 22.22.3)
  - Listens on `:4092`; nginx `data.hookswap.org` → `http://127.0.0.1:4092`.
- **Deploy dir is a STANDALONE copy, NOT a git checkout** — it has `node_modules/` + `dist/`, built
  with `npm run build` (= `tsc -p tsconfig.json`). The monorepo git checkout is `~/HookSwap-build`
  (branch `hookswap-rebrand`); source is synced from there.

## Native-dep pre-flight (verified 2026-07-10)
`better-sqlite3` **builds cleanly on this VPS** — a throwaway `npm install better-sqlite3` pulled a
**prebuilt binary** (`build/Release/better_sqlite3.node`), `SQLITE_OK` on a smoke query. Toolchain
present anyway (`make`/`gcc`/`g++`/`python3`). Disk: `/` 194G, **32G free** (84% used) — ample for a
SQLite cache. No `apt-get` needed. (Prebuild covers node 22.x, matching `/usr/bin/node` 22.22.3.)

## New env vars (add to the service `.env`)
```
INDEXER_ENABLED=true
INDEXER_DB_PATH=/home/ubuntu/hookswap-data-api/indexer.db
# INDEXER_BACKFILL_BLOCKS=<confirm against built ingest.ts; default ~200000>
```
- `INDEXER_DB_PATH` is read by `data-api/src/indexer/schema.ts` (`resolveDbPath()`), default
  `./indexer.db`. Set an ABSOLUTE path in the WorkingDirectory so the DB survives rebuilds (see below).
- ⚠ **systemd `EnvironmentFile` gotcha (bit us before):** NO inline `# comments` on a value line —
  systemd does not strip them, so `KEY=val  # note` yields a malformed value. Keep comments on their
  own lines.

## Deploy steps (run on the VPS)
```bash
# 1. Pull latest indexer source into the standalone service dir (source only, preserve node_modules/.env/db)
cd ~/HookSwap-build && git pull --ff-only origin hookswap-rebrand
rsync -a ~/HookSwap-build/data-api/src/ ~/hookswap-data-api/src/
# also sync package.json (new better-sqlite3 dep) + tsconfig if they changed
rsync -a ~/HookSwap-build/data-api/package.json ~/HookSwap-build/data-api/tsconfig.json ~/hookswap-data-api/

# 2. Install the new native dep (compiles/pulls prebuilt better-sqlite3 — proven to work)
cd ~/hookswap-data-api && npm install

# 3. Clean rebuild (no cache) + set the env, then restart
rm -rf dist && npm run build            # tsc -> dist/
#   -> edit ~/hookswap-data-api/.env to add INDEXER_ENABLED / INDEXER_DB_PATH (see above)
sudo systemctl restart hookswap-data-api.service
systemctl is-active hookswap-data-api.service
```

## Validate (after restart)
```bash
# a. Service came up + indexer flag acknowledged
sudo journalctl -u hookswap-data-api.service -n 40 --no-pager   # expect "listening on :4092" + an indexer on/off log line
# b. Ingestion is running (backfill/tail progress) — watch for per-pool swap/sync counts
sudo journalctl -u hookswap-data-api.service -f
# c. Data landed in SQLite
sqlite3 ~/hookswap-data-api/indexer.db "select chainId,pool,count(*) from sync_events group by 1,2; select count(*) from swap_events;"
#    (best signal on XLayer 196 / Robinhood 4663 — the seeded pools)
# d. Health + an enriched RPC still 200 (current-state must not regress)
curl -s http://127.0.0.1:4092/health -w " %{http_code}\n"
curl -s -X POST http://127.0.0.1:4092/data.v1.DataApiService/ListTopPools \
  -H 'Content-Type: application/json' -d '{"chainIds":[196]}' | head -c 400
```
Expected honest state until a **stablecoin pool** is seeded: native-denominated price / token-unit
volume populate; USD/`tvl`/`apr` stay unset (`—` in UI) — that's correct, not a bug.

## Rollback (instant, no redeploy)
```bash
#   set INDEXER_ENABLED=false in ~/hookswap-data-api/.env
sudo systemctl restart hookswap-data-api.service
```
Reverts to pure current-state (`listTokens`/`listTopPools` reserves-only) — the indexer loop simply
doesn't start. The `indexer.db` file is left in place (harmless; delete to reclaim disk).

## Durability note (verified by design)
The rebuild only touches `src/` (rsynced) and `dist/` (`rm -rf dist && npm run build`). The SQLite DB
at `INDEXER_DB_PATH` lives in the WorkingDirectory root (NOT under `dist/`), so **it survives rebuilds**
— ingestion resumes from the persisted `ingest_cursor` rather than re-backfilling. To force a clean
re-index, stop the service, `rm ~/hookswap-data-api/indexer.db*` (incl. `-wal`/`-shm`), restart.

## Frontend
The Terminal hook repoints (chart/stats off Uniswap GQL → `data.hookswap.org`) ship with the SPA, NOT
this service. After those land, rebuild+redeploy the frontend per the pinned-toolchain recipe
(node 22.22.2 + bun 1.3.11, `nx build web -c production --skip-nx-cache`, **no `VERCEL=1`**, rsync to
`/var/www/hookswap.org` with a `.bak` backup) — see the `deploy-on-vps` memory / CLAUDE.md.
