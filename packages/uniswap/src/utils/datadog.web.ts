import { datadogLogs } from '@datadog/browser-logs'
import { datadogRum, RumEvent, RumEventDomainContext, RumFetchResourceEventDomainContext } from '@datadog/browser-rum'
import { config } from 'uniswap/src/config'
import {
  DatadogIgnoredErrorsConfigKey,
  DatadogIgnoredErrorsValType,
  DatadogSessionSampleRateKey,
  DatadogSessionSampleRateValType,
  DynamicConfigs,
} from 'uniswap/src/features/gating/configs'
import { Experiments } from 'uniswap/src/features/gating/experiments'
import { WALLET_FEATURE_FLAG_NAMES, WEB_FEATURE_FLAG_NAMES } from 'uniswap/src/features/gating/flags'
import { getDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import { getStatsigClient } from 'uniswap/src/features/gating/sdk/statsig'
import { getUniqueId } from 'utilities/src/device/uniqueId'
import { datadogEnabledBuild, localDevDatadogEnabled } from 'utilities/src/environment/constants'
import { isBetaEnv } from 'utilities/src/environment/env'
import { getDatadogEnvironment } from 'utilities/src/logger/datadog/env'
import { logger } from 'utilities/src/logger/logger'
import { isExtensionApp, isWebApp } from 'utilities/src/platform'

// In case Statsig is not available
const EXTENSION_DEFAULT_DATADOG_SESSION_SAMPLE_RATE = 10 // percent
const INTERFACE_DEFAULT_DATADOG_SESSION_SAMPLE_RATE = 10 // percent

function beforeSend(event: RumEvent, context: RumEventDomainContext): boolean {
  // otherwise DataDog will ignore error events
  event.view.url = event.view.url.replace(/^chrome-extension:\/\/[a-z]{32}\//i, '')
  if (event.error && event.type === 'error') {
    if (event.error.source === 'console') {
      return false
    }
    const ignoredErrors = getDynamicConfigValue<
      DynamicConfigs.DatadogIgnoredErrors,
      DatadogIgnoredErrorsConfigKey,
      DatadogIgnoredErrorsValType
    >({
      config: DynamicConfigs.DatadogIgnoredErrors,
      key: DatadogIgnoredErrorsConfigKey.Errors,
      defaultValue: [],
    })

    const ignoredError = ignoredErrors.find(({ messageContains }) => event.error.message.includes(messageContains))
    if (ignoredError && Math.random() > ignoredError.sampleRate) {
      return false
    }

    Object.defineProperty(event.error, 'stack', {
      value: event.error.stack?.replace(/chrome-extension:\/\/[a-z]{32}/gi, ''),
      writable: false,
      configurable: true,
    })
  }
  if (event.type === 'resource' && event.resource.url.includes('graphql')) {
    const requestBody = (context as RumFetchResourceEventDomainContext).requestInit?.body
    if (requestBody) {
      const body = JSON.parse(requestBody as string)
      event.context = {
        ...event.context,
        operationName: body.operationName,
      }
    }
  }

  return true
}

export async function initializeDatadog(appName: string): Promise<void> {
  if (!datadogEnabledBuild) {
    return
  }

  const sessionSampleRate = getDynamicConfigValue<
    DynamicConfigs.DatadogSessionSampleRate,
    DatadogSessionSampleRateKey,
    DatadogSessionSampleRateValType
  >({
    config: DynamicConfigs.DatadogSessionSampleRate,
    key: DatadogSessionSampleRateKey.Rate,
    defaultValue: isExtensionApp
      ? EXTENSION_DEFAULT_DATADOG_SESSION_SAMPLE_RATE
      : INTERFACE_DEFAULT_DATADOG_SESSION_SAMPLE_RATE,
  })

  const sharedDatadogConfig = {
    clientToken: config.datadogClientToken,
    service: isWebApp ? `web-${getDatadogEnvironment()}` : `extension-${getDatadogEnvironment()}`,
    env: getDatadogEnvironment(),
    version: isExtensionApp ? process.env.VERSION : process.env.REACT_APP_VERSION_TAG,
    trackingConsent: undefined,
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const shouldUseFullSampleRate = localDevDatadogEnabled || (isWebApp && isBetaEnv())

  datadogRum.init({
    ...sharedDatadogConfig,
    applicationId: config.datadogProjectId,
    sessionSampleRate: shouldUseFullSampleRate ? 100 : sessionSampleRate,
    sessionReplaySampleRate: 0,
    trackResources: true,
    trackLongTasks: true,
    trackUserInteractions: true,
    enablePrivacyForActionName: true,
    beforeSend,
  })

  // According to the Datadog RUM documentation:
  // https://docs.datadoghq.com/real_user_monitoring/browser/setup/client?tab=rum#access-internal-context
  // datadogRum.init() seems to be synchronous and internal context is immediately available.
  // Local testing confirms this behavior, explaining why no "onInitialization" callback is needed.
  const internalContext = datadogRum.getInternalContext()
  const sessionIsSampled = internalContext?.session_id !== undefined

  // we do not want to log anything if session is not sampled
  if (sessionIsSampled) {
    datadogLogs.init({
      ...sharedDatadogConfig,
      site: 'datadoghq.com',
      forwardErrorsToLogs: false,
    })
    logger.setDatadogEnabled(true)
  }

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
  datadogRum.setGlobalContextProperty('buildType', process.env.REACT_APP_WEB_BUILD_TYPE)

  for (const [_, flagKey] of [...WEB_FEATURE_FLAG_NAMES.entries(), ...WALLET_FEATURE_FLAG_NAMES.entries()]) {
    datadogRum.addFeatureFlagEvaluation(
      // Datadog has a limited set of accepted symbols in feature flags
      // https://docs.datadoghq.com/real_user_monitoring/guide/setup-feature-flag-data-collection/?tab=reactnative#feature-flag-naming
      flagKey.replaceAll('-', '_'),
      getStatsigClient().checkGate(flagKey),
    )
  }

  for (const experiment of Object.values(Experiments)) {
    datadogRum.addFeatureFlagEvaluation(
      // Datadog has a limited set of accepted symbols in feature flags
      // https://docs.datadoghq.com/real_user_monitoring/guide/setup-feature-flag-data-collection/?tab=reactnative#feature-flag-naming
      `experiment_${experiment.replaceAll('-', '_')}`,
      getStatsigClient().getExperiment(experiment).groupName,
    )
  }
}
