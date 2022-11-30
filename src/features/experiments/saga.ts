import { Experiment } from '@amplitude/experiment-react-native-client'
import { getUniqueId } from 'react-native-device-info'
import { config } from 'src/config'
import { ExperimentsMap, FeatureFlagsMap, mergeRemoteConfig } from 'src/features/experiments/slice'
import { initAnalytics } from 'src/features/telemetry'
import { logger } from 'src/utils/logger'
import { call, put } from 'typed-redux-saga'

const experimentClient = Experiment.initialize(config.amplitudeExperimentsDeploymentKey)

async function initializeExperiments() {
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

export async function retrieveRemoteExperiments() {
  const fetchedAmplitudeExperiments = await experimentClient.all()

  const fetchedFeatureFlags: FeatureFlagsMap = {}
  const fetchedExperiments: ExperimentsMap = {}
  Object.keys(fetchedAmplitudeExperiments).map((experimentKey) => {
    const variant = fetchedAmplitudeExperiments[experimentKey].value!
    if (['on'].includes(variant)) {
      fetchedFeatureFlags[experimentKey] = variant === 'on'
    } else {
      fetchedExperiments[experimentKey] = variant
    }
  })

  return { experiments: fetchedExperiments, featureFlags: fetchedFeatureFlags }
}

function* retrieveAndSyncRemoteExperiments() {
  const remoteExperiments = yield* call(retrieveRemoteExperiments)
  // sync remote config with reducer
  yield* put(mergeRemoteConfig(remoteExperiments))
}

export function* amplitudeSaga() {
  yield* call(initAnalytics)
  yield* call(initializeExperiments)
  yield* call(retrieveAndSyncRemoteExperiments)
}
