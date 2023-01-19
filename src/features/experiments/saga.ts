import { Experiment } from '@amplitude/experiment-react-native-client'
import { getUniqueId } from 'react-native-device-info'
import { CallEffect, PutEffect } from 'redux-saga/effects'
import { config } from 'src/config'
import { ExperimentsMap, FeatureFlagsMap, mergeRemoteConfig } from 'src/features/experiments/slice'
import { initAnalytics } from 'src/features/telemetry'
import { logger } from 'src/utils/logger'
import { call, put } from 'typed-redux-saga'

const experimentClient = Experiment.initialize(config.amplitudeExperimentsDeploymentKey)

async function initializeExperiments(): Promise<void> {
  try {
    const uniqueID = await getUniqueId()
    const user = {
      device_id: uniqueID,
    }

    await experimentClient.fetch(user)
  } catch (err) {
    logger.error('experiments/saga', 'initializeExperiments', `${err}`)
  }
}

export async function retrieveRemoteExperiments(): Promise<{
  experiments: ExperimentsMap
  featureFlags: FeatureFlagsMap
}> {
  const fetchedAmplitudeExperiments = experimentClient.all()

  const fetchedFeatureFlags: FeatureFlagsMap = {}
  const fetchedExperiments: ExperimentsMap = {}
  Object.entries(fetchedAmplitudeExperiments).map(([experimentKey, experimentVariant]) => {
    if (!experimentVariant.value) return
    if (['on'].includes(experimentVariant.value)) {
      fetchedFeatureFlags[experimentKey] = experimentVariant.value === 'on'
    } else {
      fetchedExperiments[experimentKey] = experimentVariant.value
    }
  })

  return { experiments: fetchedExperiments, featureFlags: fetchedFeatureFlags }
}

function* retrieveAndSyncRemoteExperiments(): Generator<
  | CallEffect<unknown>
  | PutEffect<{
      payload: {
        featureFlags: FeatureFlagsMap
        experiments: ExperimentsMap
      }
      type: string
    }>,
  void,
  unknown
> {
  const remoteExperiments = yield* call(retrieveRemoteExperiments)
  // sync remote config with reducer
  yield* put(mergeRemoteConfig(remoteExperiments))
}

export function* amplitudeSaga(): Generator<CallEffect<void>, void, unknown> {
  yield* call(initAnalytics)
  yield* call(initializeExperiments)
  yield* call(retrieveAndSyncRemoteExperiments)
}
