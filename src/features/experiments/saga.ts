import { Experiment } from '@amplitude/experiment-react-native-client'
import { getUniqueId } from 'react-native-device-info'
import { config } from 'src/config'
import { ExperimentsMap, FeatureFlagsMap, mergeRemoteConfig } from 'src/features/experiments/slice'
import { initAnalytics, logException } from 'src/features/telemetry'
import { LogContext } from 'src/features/telemetry/constants'
import { call, put } from 'typed-redux-saga'

async function initializeExperiments() {
  try {
    await Experiment.initialize(config.amplitudeExperimentsDeploymentKey)

    const uniqueID = await getUniqueId()
    const user = {
      device_id: uniqueID,
    }

    await Experiment.fetch(user)
  } catch (err) {
    logException(LogContext.Experiments, err)
  }
}

export async function retrieveRemoteExperiments() {
  const fetchedAmplitudeExperiments = await Experiment.all()

  const fetchedFeatureFlags: FeatureFlagsMap = {}
  const fetchedExperiments: ExperimentsMap = {}
  Object.keys(fetchedAmplitudeExperiments).map((experimentKey) => {
    const variant = fetchedAmplitudeExperiments[experimentKey].value
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
