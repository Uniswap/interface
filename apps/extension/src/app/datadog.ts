import { datadogRum } from '@datadog/browser-rum'
import { getDatadogEnvironment } from 'src/app/version'
import { config } from 'uniswap/src/config'
import { Experiments } from 'uniswap/src/features/gating/experiments'
import { FeatureFlags, WALLET_FEATURE_FLAG_NAMES, getFeatureFlagName } from 'uniswap/src/features/gating/flags'
import { Statsig } from 'uniswap/src/features/gating/sdk/statsig'
import { getUniqueId } from 'utilities/src/device/getUniqueId'
import { logger } from 'utilities/src/logger/logger'

export async function initializeDatadog(appName: string): Promise<void> {
  const datadogEnabled = Statsig.checkGate(getFeatureFlagName(FeatureFlags.Datadog))
  logger.setWalletDatadogEnabled(datadogEnabled)

  if (__DEV__ || !datadogEnabled) {
    return
  }

  datadogRum.init({
    applicationId: config.datadogProjectId,
    clientToken: config.datadogClientToken,
    service: `extension-${getDatadogEnvironment()}`,
    env: getDatadogEnvironment(),
    version: process.env.VERSION,
    sessionSampleRate: 100,
    sessionReplaySampleRate: 0,
    trackResources: true,
    trackLongTasks: true,
    trackUserInteractions: true,
    enablePrivacyForActionName: true,
    beforeSend: (event) => {
      // otherwise DataDog will ignore error events
      event.view.url = event.view.url.replace(/^chrome-extension:\/\/[a-z]{32}\//i, '')
      if (event.error && event.type === 'error') {
        Object.defineProperty(event.error, 'stack', {
          value: event.error.stack?.replace(/chrome-extension:\/\/[a-z]{32}/gi, ''),
          writable: false,
          configurable: true,
        })
      }
      return true
    },
  })

  try {
    const userId = await getUniqueId()
    datadogRum.setUser({
      id: userId,
    })
  } catch (e) {
    logger.error(e, {
      tags: { file: 'datadog.ts', function: 'initializeDatadog' },
    })
  }

  datadogRum.setGlobalContextProperty('app', appName)

  for (const [_, flagKey] of WALLET_FEATURE_FLAG_NAMES.entries()) {
    datadogRum.addFeatureFlagEvaluation(
      // Datadog has a limited set of accepted symbols in feature flags
      // https://docs.datadoghq.com/real_user_monitoring/guide/setup-feature-flag-data-collection/?tab=reactnative#feature-flag-naming
      flagKey.replaceAll('-', '_'),
      Statsig.checkGateWithExposureLoggingDisabled(flagKey),
    )
  }

  for (const experiment of Object.values(Experiments)) {
    datadogRum.addFeatureFlagEvaluation(
      // Datadog has a limited set of accepted symbols in feature flags
      // https://docs.datadoghq.com/real_user_monitoring/guide/setup-feature-flag-data-collection/?tab=reactnative#feature-flag-naming
      `experiment_${experiment.replaceAll('-', '_')}`,
      Statsig.getExperimentWithExposureLoggingDisabled(experiment).getGroupName(),
    )
  }
}
