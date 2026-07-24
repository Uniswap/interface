import type {
  ExperimentCollisionReporter,
  ExperimentCollisionSource,
  ExperimentOverride,
  ExperimentsMap,
} from './types'

/**
 * The active-experiments store: an in-memory, subscribable map of the experiments
 * currently riding along on requests. Framework-agnostic by design — React bindings
 * sit on top of `subscribe`/`getSnapshot` via `useSyncExternalStore`.
 */
export interface ExperimentsStore {
  /** Stable snapshot — identity changes only when the contents change (required by useSyncExternalStore). */
  getSnapshot: () => ExperimentsMap
  subscribe: (listener: () => void) => () => void
  get: (name: string) => ExperimentOverride | undefined
  /** Contribute a single experiment (FE→BE). See write semantics below. */
  set: (name: string, override: ExperimentOverride) => void
  /** Merge a batch absorbed from a response header (BE→FE). Same write semantics. */
  merge: (incoming: ExperimentsMap) => void
  clear: () => void
}

export interface ExperimentsStoreConfig {
  onCollision?: ExperimentCollisionReporter
}

function sameOverride(a: ExperimentOverride, b: ExperimentOverride): boolean {
  return (a.groupName ?? null) === (b.groupName ?? null) && JSON.stringify(a.value) === JSON.stringify(b.value)
}

/**
 * Write semantics (consistent across `set` and `merge`):
 * - new name              → added.
 * - same name, same value → no-op (idempotent; safe to call every render).
 * - same name, diff value → **first write wins**, and `onCollision` fires.
 *
 * First-write-wins is deliberate: once a user is bucketed for the duration of a flow,
 * the bucket must not change underneath them (the PRD's ID-consistency requirement).
 * A conflicting write is a bug to surface, not a value to silently adopt.
 */
export function createExperimentsStore(config: ExperimentsStoreConfig = {}): ExperimentsStore {
  const { onCollision } = config
  let snapshot: ExperimentsMap = {}
  const listeners = new Set<() => void>()

  function emit(): void {
    for (const listener of listeners) {
      listener()
    }
  }

  /** Returns true if the snapshot changed. */
  function apply(entry: { name: string; incoming: ExperimentOverride; source: ExperimentCollisionSource }): boolean {
    const { name, incoming, source } = entry
    const existing = snapshot[name]
    if (existing) {
      if (!sameOverride(existing, incoming)) {
        onCollision?.({ name, existing, incoming, source })
      }
      return false
    }
    snapshot = { ...snapshot, [name]: incoming }
    return true
  }

  return {
    getSnapshot: () => snapshot,

    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    get: (name) => snapshot[name],

    set(name, override) {
      if (apply({ name, incoming: override, source: 'set' })) {
        emit()
      }
    },

    merge(incoming) {
      let changed = false
      for (const [name, override] of Object.entries(incoming)) {
        if (apply({ name, incoming: override, source: 'absorb' })) {
          changed = true
        }
      }
      if (changed) {
        emit()
      }
    },

    clear() {
      if (Object.keys(snapshot).length === 0) {
        return
      }
      snapshot = {}
      emit()
    },
  }
}
