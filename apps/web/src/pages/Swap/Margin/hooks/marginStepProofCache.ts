import { normalizeTokenAddressForCache } from '@universe/chains'
import { logger } from 'utilities/src/logger/logger'

// Per-plan cache of already-broadcast SEND_TX proofs, keyed alongside the swapper-scoped active-plan
// pointer (marginPlanPointer.ts). The primary dup guard: the executor persists a step's
// txHash the instant sendTransaction resolves — BEFORE the PATCH — so a crash/reload/second run
// between broadcast and PATCH replays the same hash idempotently instead of re-prompting a second
// on-chain tx (the double depositV3 bug).
//
// Storage: localStorage is the cross-tab/persistent store, PLUS a module-level in-memory backup that
// is written and read on every op. localStorage can throw (Safari private mode / quota); the
// in-memory map guarantees the dup guard still works within the SAME session — the
// storage-unavailable + PATCH-retry-exhausted / re-entrant-loop case. The storage-unavailable + full
// tab CRASH sub-case remains unhandled; closing it needs a backend deposit idempotency key. All ops
// are best-effort and never throw: a lost proof must never brick a live plan or strand the exec lock.
//
// KNOWN LIMITATION — the pre-broadcast window is NOT covered cross-tab. A proof only exists once
// sendTransaction has resolved, and the single-flight execution lock (marginPlanExecutionStore) is
// module scope, i.e. per TAB. So two tabs that both resume the same AWAITING_ACTION step before either
// has broadcast will both read no proof and both prompt the wallet; approving both broadcasts the step
// twice. Closing it needs either the same backend idempotency key as the crash sub-case, or a
// cross-tab lease (localStorage + expiry) — a lease has to expire, or a crashed tab strands a live
// plan, which is the worse failure. Deliberately left open rather than half-closed.

export interface StoredStepProof {
  txHash: string
  // Calldata identity the proof was broadcast against. A bridge reset re-materializes the step with
  // FRESH depositV3 params (new depositId/quoteTimestamp/fillDeadline), so `data` changes — the
  // executor compares this to detect a reset and re-prompt the fresh deposit rather than replaying
  // the now-dead hash.
  to: string
  data: string
}

// stepIndex → proof for one plan.
type StepProofMap = Record<string, StoredStepProof>

// Session-scoped backup for when localStorage is unavailable (write and read pass through it).
const memoryProofs = new Map<string, StepProofMap>()

// Keys whose localStorage write has FAILED this session. The merge below normally lets storage win, on
// the reasoning that a cross-tab write is newer — but that makes the backup unable to express a
// DELETION: if clearStepProof's setItem throws, memory drops the proof while the stale stored copy
// survives and wins, resurrecting it. The executor then re-decides 'reprompt' every iteration, each
// pass reporting progress, so the stall counter never trips, the wallet is never prompted for the
// re-materialized deposit, and the loop spins at GET speed. Once a key's write has failed, its stored
// copy is known-stale and memory is authoritative for the rest of the session.
const memoryAuthoritative = new Set<string>()

function storageKey({ swapper, planId }: { swapper: string; planId: string }): string {
  return `margin.stepProof.${normalizeTokenAddressForCache(swapper)}.${planId}`
}

function readMap(params: { swapper: string; planId: string }): StepProofMap {
  const key = storageKey(params)
  const mem = memoryProofs.get(key) ?? {}
  let stored: StepProofMap = {}
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      stored = JSON.parse(raw) as StepProofMap
    }
  } catch {
    // localStorage unavailable — fall back to the in-memory backup only.
  }
  // localStorage wins on conflict (a cross-tab write is newer); the memory backup fills any gap a
  // failed setItem left behind — unless this key's write already failed, in which case stored is
  // known-stale and merging it would undo a deletion.
  return memoryAuthoritative.has(key) ? { ...mem } : { ...mem, ...stored }
}

function writeMap(params: { swapper: string; planId: string }, map: StepProofMap): void {
  const key = storageKey(params)
  // Memory first, unconditionally — so a throwing setItem never loses the proof this session.
  memoryProofs.set(key, map)
  try {
    localStorage.setItem(key, JSON.stringify(map))
    // A successful write makes stored ≡ memory, so the stale-stored assumption no longer holds. Keeping
    // the flag would blind this tab to every later cross-tab proof for the key — tab B broadcasts and
    // records step 2, tab A reads memory only, finds nothing, and re-broadcasts.
    memoryAuthoritative.delete(key)
  } catch (error) {
    memoryAuthoritative.add(key)
    logger.warn('marginStepProofCache', 'writeMap', 'Failed to persist step proof to localStorage', error)
  }
}

export function writeStepProof({
  swapper,
  planId,
  stepIndex,
  txHash,
  to,
  data,
}: {
  swapper: string
  planId: string
  stepIndex: number
  txHash: string
  to: string
  data: string
}): void {
  const map = readMap({ swapper, planId })
  map[stepIndex] = { txHash, to, data }
  writeMap({ swapper, planId }, map)
}

export function readStepProof({
  swapper,
  planId,
  stepIndex,
}: {
  swapper: string
  planId: string
  stepIndex: number
}): StoredStepProof | undefined {
  return readMap({ swapper, planId })[stepIndex]
}

// Drop a single step's proof: a server reset re-materialized it with fresh calldata, so the cached
// hash is dead and must not be replayed.
export function clearStepProof({
  swapper,
  planId,
  stepIndex,
}: {
  swapper: string
  planId: string
  stepIndex: number
}): void {
  const map = readMap({ swapper, planId })
  if (!(String(stepIndex) in map)) {
    return
  }
  delete map[stepIndex]
  writeMap({ swapper, planId }, map)
}

// Whether any of the GIVEN steps of this plan holds a cached proof. For the no-failing-step case: a
// plan that broadcast, never PATCHed, and died with nothing stamped names no step to look under, and
// its cached hash is then the only local evidence a tx may still land — which the index-keyed reader
// cannot answer. The caller passes the step indices that matter (a funds question excludes approvals,
// which broadcast and write a proof while moving nothing), because this module knows nothing of types.
export function planHasProofForSteps({
  swapper,
  planId,
  stepIndexes,
}: {
  swapper: string
  planId: string
  stepIndexes: readonly number[]
}): boolean {
  const map = readMap({ swapper, planId })
  return stepIndexes.some((stepIndex) => Object.hasOwn(map, stepIndex))
}

export function clearPlanProofs({ swapper, planId }: { swapper: string; planId: string }): void {
  const key = storageKey({ swapper, planId })
  memoryProofs.delete(key)
  try {
    localStorage.removeItem(key)
    memoryAuthoritative.delete(key)
  } catch (error) {
    // Symmetric with writeMap: storage that rejects this but still serves reads would let readMap
    // resurrect every proof for the plan. Bounded — this only runs for dead plans, where a resurrected
    // proof keeps hasUnlandedLocalProof set and withholds the pending card's Cancel — but the rule is
    // the same one, so it belongs on both clear paths rather than only the per-step one.
    memoryAuthoritative.add(key)
    logger.warn('marginStepProofCache', 'clearPlanProofs', 'Failed to clear step proofs from localStorage', error)
  }
}

// Test-only: the in-memory backup is module-level and survives across tests (localStorage.clear does
// not touch it) — reset it in beforeEach for isolation.
export function __resetMemoryProofsForTest(): void {
  memoryProofs.clear()
  // The authoritative set too, or one test forcing a setItem failure leaves that key memory-only for
  // the rest of the run and a later case seeding localStorage silently reads nothing — order-dependent.
  memoryAuthoritative.clear()
}
