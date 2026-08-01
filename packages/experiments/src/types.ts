/**
 * The wire contract for the `x-experiments` header, shared between this frontend
 * and the backend. These types mirror the backend's `ExperimentOverrideData` and the
 * `experiments` field of `ICommonData` verbatim — if the backend shape changes, this
 * file is the single place that must change with it.
 *
 * Backend reference: `packages/lib/uni/interface.ts` (ExperimentOverrideData, ICommonData).
 */

/**
 * A single experiment's correlation record: the group the user landed in and the
 * full parameter map for that group. `groupName` is optional (the backend treats a
 * missing group as `null`); `value` is always present.
 */
export interface ExperimentOverride {
  groupName?: string | null
  value: Record<string, unknown>
}

/**
 * The full set of active experiments, keyed by experiment name. This is exactly the
 * JSON payload carried in the `x-experiments` header in both directions.
 */
export type ExperimentsMap = Record<string, ExperimentOverride>

/** Where a conflicting write originated. */
export type ExperimentCollisionSource = 'set' | 'absorb'

/**
 * Emitted when a write targets an experiment that already has a *different* value.
 * This is the PRD's "duplicate experiment write" alarm condition — two callers
 * disagreeing about a user's bucket for the same experiment.
 */
export interface ExperimentCollision {
  name: string
  existing: ExperimentOverride
  incoming: ExperimentOverride
  source: ExperimentCollisionSource
}

/** Telemetry sink for collisions. Injected at the boundary — the package never imports analytics directly. */
export type ExperimentCollisionReporter = (collision: ExperimentCollision) => void
