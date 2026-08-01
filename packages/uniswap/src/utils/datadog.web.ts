import { datadogLogs } from '@datadog/browser-logs'
import { datadogRum, RumEvent, RumEventDomainContext, RumFetchResourceEventDomainContext } from '@datadog/browser-rum'
import {
  isExtensionApp,
  isWebApp,
  isBetaEnv,
  isDevEnv,
  isDatadogEnabled,
  localDevDatadogEnabled,
} from '@universe/environment'
import {
  DatadogIgnoredErrorsConfigKey,
  DatadogIgnoredErrorsValType,
  DatadogSessionSampleRateKey,
  DatadogSessionSampleRateValType,
  DynamicConfigs,
  Experiments,
  getDynamicConfigValue,
  getStatsigClient,
  WALLET_FEATURE_FLAG_NAMES,
  WEB_FEATURE_FLAG_NAMES,
} from '@universe/gating'
import { config } from 'uniswap/src/config'
import { TradingApiHeaders } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { getUniqueId } from 'utilities/src/device/uniqueId'
import { getDatadogEnvironment } from 'utilities/src/logger/datadog/env'
import { logger } from 'utilities/src/logger/logger'

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

    const ignoredError = ignoredErrors.find(({ messageContains }: { messageContains: string }) =>
      event.error.message.includes(messageContains),
    )
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

  if (event.type === 'resource' && event.resource.url.includes('gateway.uniswap.org')) {
    const requestHeaders = (context as RumFetchResourceEventDomainContext).requestInit?.headers
    if (requestHeaders) {
      const headersRecord =
        requestHeaders instanceof Headers
          ? Object.fromEntries(requestHeaders.entries())
          : Array.isArray(requestHeaders)
            ? Object.fromEntries(requestHeaders)
            : requestHeaders
      const tradingApiHeaderValues = new Set<string>(Object.values(TradingApiHeaders))
      const featureFlagHeaders: Record<string, string> = {}
      for (const [key, value] of Object.entries(headersRecord)) {
        if (tradingApiHeaderValues.has(key)) {
          featureFlagHeaders[key] = String(value)
        }
      }
      if (Object.keys(featureFlagHeaders).length > 0) {
        event.context = {
          ...event.context,
          tradingApiHeaders: featureFlagHeaders,
        }
      }
    }
  }

  return true
}

export async function initializeDatadog(appName: string): Promise<void> {
  if (!isDatadogEnabled()) {
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
    version: config.appVersion,
    trackingConsent: undefined,
  }

  // Dev + beta builds (extension and web) sample at 100% so internal testers produce
  // full-fidelity RUM + logs for debugging. Prod keeps the configurable rate (default 10%).
  // oxlint-disable-next-line typescript/no-unnecessary-condition
  const shouldUseFullSampleRate = localDevDatadogEnabled || isBetaEnv() || isDevEnv()

  datadogRum.init({
    ...sharedDatadogConfig,
    applicationId: config.datadogProjectId,
    sessionSampleRate: shouldUseFullSampleRate ? 100 : sessionSampleRate,
    sessionReplaySampleRate: 0,
    traceSampleRate: 100,
    trackResources: true,
    trackLongTasks: true,
    trackUserInteractions: true,
    enablePrivacyForActionName: true,
    beforeSend,
    allowedTracingUrls: [
      { match: /gateway\.uniswap\.org/, propagatorTypes: ['datadog', 'tracecontext'] },
      { match: /api\.uniswap\.org/, propagatorTypes: ['datadog', 'tracecontext'] },
    ],
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

  for (const [_, flagKey] of [...WEB_FEATURE_FLAG_NAMES.entries(), ...WALLET_FEATURE_FLAG_NAMES.entries()]) {
    datadogRum.addFeatureFlagEvaluation(
      // Datadog has a limited set of accepted symbols in feature flags
      // https://docs.datadoghq.com/real_user_monitoring/guide/setup-feature-flag-data-collection/?tab=reactnative#feature-flag-naming
      flagKey.replaceAll('-', '_').replaceAll('.', '_'),
      getStatsigClient().checkGate(flagKey),
    )
  }

  for (const experiment of Object.values(Experiments)) {
    datadogRum.addFeatureFlagEvaluation(
      // Datadog has a limited set of accepted symbols in feature flags
      // https://docs.datadoghq.com/real_user_monitoring/guide/setup-feature-flag-data-collection/?tab=reactnative#feature-flag-naming
      `experiment_${experiment.replaceAll('-', '_').replaceAll('.', '_')}`,
      getStatsigClient().getExperiment(experiment).groupName,
    )
  }
}
