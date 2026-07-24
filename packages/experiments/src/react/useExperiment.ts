import { useSyncExternalStore } from 'react'
import type { ExperimentDefinition } from '../experiment'
import type { ExperimentOverride } from '../types'
import { useExperimentsClient } from './useExperimentsClient'

/** A correlation record with a typed value, returned when reading a typed definition. */
export interface TypedExperimentOverride<TValue extends Record<string, unknown>> {
  groupName?: string | null
  value: TValue
}

/**
 * Read an active experiment (its group + value) from the shared set, subscribing to changes.
 * Returns `undefined` until the experiment is present — e.g. a backend-originated experiment
 * is `undefined` until the response carrying it has been absorbed.
 *
 * Pass a string for an untyped read, or a definition from {@link experiment} for a typed value.
 */
export function useExperiment<TValue extends Record<string, unknown>>(
  definition: ExperimentDefinition<TValue>,
): TypedExperimentOverride<TValue> | undefined
export function useExperiment(name: string): ExperimentOverride | undefined
export function useExperiment(
  target: string | ExperimentDefinition<Record<string, unknown>>,
): ExperimentOverride | undefined {
  const name = typeof target === 'string' ? target : target.name
  const client = useExperimentsClient()
  const snapshot = useSyncExternalStore(client.subscribe, client.getSnapshot, client.getSnapshot)
  return snapshot[name]
}
