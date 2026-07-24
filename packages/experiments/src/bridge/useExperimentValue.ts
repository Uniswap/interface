import {
  type ExperimentProperties,
  useExperiment as useStatsigExperiment,
  useExperimentValue as useGatingExperimentValue,
} from '@universe/gating'
import { useEffect } from 'react'
import { useExperimentsClient } from '../react/useExperimentsClient'

/**
 * Drop-in replacement for `@universe/gating`'s `useExperimentValue`, with one addition:
 * `propagate`. When `propagate` is true, the experiment's group + full parameter map are
 * contributed to the active set, so the backend buckets this user identically on every
 * subsequent request (the FE→BE / Flow 1 case). The returned value is exactly what gating
 * returns — switching the import changes nothing until you opt into `propagate`.
 *
 * Reach for this only for coordinated FE+BE experiments. FE-only experiments should keep
 * importing `useExperimentValue` from `@universe/gating`.
 */
export function useExperimentValue<
  Exp extends keyof ExperimentProperties,
  Param extends ExperimentProperties[Exp],
  ValType,
>({
  experiment,
  param,
  defaultValue,
  customTypeGuard,
  propagate = false,
}: {
  experiment: Exp
  param: Param
  defaultValue: ValType
  customTypeGuard?: (x: unknown) => x is ValType
  /** When true, contribute this experiment's bucket to the `x-experiments` header. */
  propagate?: boolean
}): ValType {
  const value = useGatingExperimentValue({ experiment, param, defaultValue, customTypeGuard })

  // The header payload needs the group name and the *full* parameter map, not just `param`.
  // Statsig dedupes exposure logging, so this second read does not double-count exposure.
  const { groupName, value: groupValue } = useStatsigExperiment(experiment)
  const client = useExperimentsClient()

  useEffect(() => {
    // Skip until Statsig has resolved the user's bucket. Writing the placeholder empty
    // `groupName` would be locked in by the store's first-write-wins, and the real group
    // would never reach the `x-experiments` header once Statsig later buckets the user.
    if (!propagate || groupName == null) {
      return
    }
    client.set(experiment, { groupName, value: groupValue })
  }, [propagate, experiment, groupName, groupValue, client])

  return value
}
