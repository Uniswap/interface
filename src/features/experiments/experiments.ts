import { Experiment } from '@amplitude/experiment-react-native-client'
import { getUniqueId } from 'react-native-device-info'
import { config } from 'src/config'
import { logException } from 'src/features/telemetry'
import { LogContext } from 'src/features/telemetry/constants'

// Should be called after Amplitude Analytics is initialized
export async function initExperiments() {
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
