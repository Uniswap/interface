import { Experiment } from '@amplitude/experiment-react-native-client'
import { getUniqueId } from 'react-native-device-info'
import { config } from 'src/config'
import { mergeRemoteConfig } from 'src/features/experiments/slice'
import { Experiment as ExperimentType, FeatureFlag } from 'src/features/experiments/types'
import { initAnalytics, logException } from 'src/features/telemetry'
import { LogContext } from 'src/features/telemetry/constants'
import { call, put } from 'typed-redux-saga'

async function initializeExperiments() {
  try {
    if (__DEV__) {
      // avoid polluting analytics dashboards with dev data so we use the non analytics initialization
      // consider re-enabling if validating data prior to launches is useful
      await Experiment.initialize(config.amplitudeExperimentsDeploymentKey)
    } else {
      await Experiment.initializeWithAmplitudeAnalytics(config.amplitudeExperimentsDeploymentKey)
    }

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

  const fetchedFeatureFlags: FeatureFlag[] = []
  const fetchedExperiments: ExperimentType[] = []
  Object.keys(fetchedAmplitudeExperiments).map((experimentKey) => {
    const variant = fetchedAmplitudeExperiments[experimentKey].value
    if (['on'].includes(variant)) {
      fetchedFeatureFlags.push({ name: experimentKey, enabled: variant === 'on' })
    } else {
      fetchedExperiments.push({ name: experimentKey, variant: variant })
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
