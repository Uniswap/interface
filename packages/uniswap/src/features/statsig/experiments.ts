import { isInterface } from 'uniswap/src/utils/platform'
import { logger } from 'utilities/src/logger/logger'

export enum BooleanExperimentValues {
  Enabled = 'enabled',
  Disabled = 'disabled',
}

export const DEFAULT_EXPERIMENT_ENABLED_VALUE = BooleanExperimentValues.Enabled

// Experiment definition structure
export interface Experiment {
  name: string
  key: string
  values: string[]
}

/**
 * Experiment parameter names
 *
 * These should match parameter names on Statsig within an experiment
 */
export enum Experiments {}

export const WEB_EXPERIMENTS = new Map<Experiments, Experiment>([])

export const WALLET_EXPERIMENTS = new Map<Experiments, Experiment>([])

export function getExperimentDefinition(experiment: Experiments): Experiment {
  const names = isInterface ? WEB_EXPERIMENTS : WALLET_EXPERIMENTS
  const experimentDef = names.get(experiment)
  if (!experimentDef) {
    const err = new Error(
      `Experiment ${Experiments[experiment]} does not have a mapping for this application`
    )
    logger.error(err, {
      tags: {
        file: 'experiments.ts',
        function: 'getExperiment',
      },
    })
    throw err
  }

  return experimentDef
}
