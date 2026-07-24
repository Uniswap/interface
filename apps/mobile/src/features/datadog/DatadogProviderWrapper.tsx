import {
  type AutoInstrumentationConfiguration,
  BatchSize,
  DatadogProvider,
  DdRum,
  type PartialInitializationConfiguration,
  PropagatorType,
  SdkVerbosity,
  TrackingConsent,
  UploadFrequency,
} from '@datadog/mobile-react-native'
import { type ErrorEventMapper } from '@datadog/mobile-react-native/lib/typescript/rum/eventMappers/errorEventMapper'
import { isUnitTestEnv, isDatadogEnabled, localDevDatadogEnabled } from '@universe/environment'
import {
  DatadogIgnoredErrorsConfigKey,
  DatadogIgnoredErrorsValType,
  DynamicConfigs,
  getDynamicConfigValue,
} from '@universe/gating'
import { PropsWithChildren, default as React, useEffect, useState } from 'react'
import { getConfig } from 'src/config'
import { DatadogContext } from 'src/features/datadog/DatadogContext'
import { setAttributesToDatadog } from 'utilities/src/logger/datadog/Datadog'
import { getDatadogEnvironment } from 'utilities/src/logger/datadog/env'
import { logger } from 'utilities/src/logger/logger'

// In case Statsig is not available
export const MOBILE_DEFAULT_DATADOG_SESSION_SAMPLE_RATE = 10 // percent

// Configuration for Datadog's automatic monitoring features:
// - Error tracking: Captures and reports application errors
// - User interactions: Monitors user events and actions
// - Resource tracking: Traces network requests and API calls
// Note: Can buffer up to 100 RUM events before SDK initialization
// https://docs.datadoghq.com/real_user_monitoring/mobile_and_tv_monitoring/react_native/advanced_configuration/#delaying-the-initialization
const isEnabled = isDatadogEnabled()

// Event type accepted by the Datadog Logs mapper, derived from the SDK config type so we avoid a deep
// type import (the SDK's package `exports` map blocks `.../lib/typescript/types` under tsgo).
type DatadogLogEvent = Parameters<
  NonNullable<AutoInstrumentationConfiguration['logsConfiguration']['logEventMapper']>
>[0]

// Event mappers and feature toggles must be supplied to the DatadogProvider component (not initialize)
// so auto-instrumentation buffers correctly before the deferred native initialization runs.
const datadogAutoInstrumentation: AutoInstrumentationConfiguration = {
  rumConfiguration: {
    trackErrors: isEnabled,
    trackInteractions: isEnabled,
    trackResources: isEnabled,
    firstPartyHosts: [
      { match: 'gateway.uniswap.org', propagatorTypes: [PropagatorType.DATADOG, PropagatorType.TRACECONTEXT] },
      { match: 'api.uniswap.org', propagatorTypes: [PropagatorType.DATADOG, PropagatorType.TRACECONTEXT] },
    ],
    errorEventMapper: (event: ReturnType<ErrorEventMapper>): ReturnType<ErrorEventMapper> | null => {
      const ignoredErrors = getDynamicConfigValue<
        DynamicConfigs.DatadogIgnoredErrors,
        DatadogIgnoredErrorsConfigKey,
        DatadogIgnoredErrorsValType
      >({
        config: DynamicConfigs.DatadogIgnoredErrors,
        key: DatadogIgnoredErrorsConfigKey.Errors,
        defaultValue: [],
      })

      const ignoredError = ignoredErrors.find(({ messageContains }) => event?.message.includes(messageContains))
      if (ignoredError) {
        return Math.random() < ignoredError.sampleRate ? event : null
      }

      return event
    },
  },
  // v3 only enables the native Logs feature when logsConfiguration carries a logEventMapper —
  // Logs.enable() is gated on it (iOS DdSdkNativeInitialization.swift / Android equivalent). With an
  // empty {}, every DdLogs.* call (including the rpcObserver "RPC response"/"RPC error" logs) silently
  // no-ops, so RUM works but logs go dark. Passthrough mapper enables Logs without altering events.
  logsConfiguration: {
    logEventMapper: (logEvent: DatadogLogEvent): DatadogLogEvent => logEvent,
  },
}

async function initializeDatadog(sessionSamplingRate: number): Promise<void> {
  const isE2ETest = getConfig().isE2ETest
  // oxlint-disable-next-line typescript/no-unnecessary-condition
  const useDebugConfig = localDevDatadogEnabled || isE2ETest

  const datadogConfig: PartialInitializationConfiguration = {
    clientToken: getConfig().datadogClientToken,
    env: getDatadogEnvironment(),
    site: 'US1',
    // Must be set to a concrete value: v3's CoreConfiguration runs Object.assign(this, ...rest),
    // so an explicit `undefined` key clobbers the GRANTED default and natively resolves to
    // TrackingConsent.PENDING — the SDK then buffers all data on-device and never uploads (DD goes dark).
    trackingConsent: TrackingConsent.GRANTED,
    verbosity: useDebugConfig ? SdkVerbosity.DEBUG : SdkVerbosity.INFO,
    // oxlint-disable-next-line typescript/no-unnecessary-condition
    ...(localDevDatadogEnabled ? { uploadFrequency: UploadFrequency.FREQUENT, batchSize: BatchSize.SMALL } : {}),
    rumConfiguration: {
      applicationId: getConfig().datadogProjectId,
      sessionSampleRate: useDebugConfig ? 100 : sessionSamplingRate,
      longTaskThresholdMs: 100,
      nativeCrashReportEnabled: true,
    },
  }

  await DatadogProvider.initialize(datadogConfig)

  setAttributesToDatadog({
    isE2ETest,
  }).catch(() => undefined)
}

/**
 * Wrapper component to provide Datadog to the app with our mobile app's
 * specific configuration.
 */
export function DatadogProviderWrapper({
  children,
  sessionSampleRate,
}: PropsWithChildren<{ sessionSampleRate: number | undefined }>): JSX.Element {
  const [isInitialized, setInitialized] = useState(false)

  useEffect(() => {
    if ((isDatadogEnabled() || getConfig().isE2ETest) && sessionSampleRate !== undefined) {
      initializeDatadog(sessionSampleRate).catch(() => undefined)
    }
  }, [sessionSampleRate])

  if (isUnitTestEnv()) {
    return <>{children}</>
  }
  logger.setDatadogEnabled(true)
  return (
    <DatadogContext.Provider value={{ isInitialized, setInitialized }}>
      <DatadogProvider
        configuration={datadogAutoInstrumentation}
        onInitialization={async () => {
          const sessionId = await DdRum.getCurrentSessionId()
          // we do not want to log anything if session is not sampled
          logger.setDatadogEnabled(sessionId !== undefined)
          setInitialized(true)
        }}
      >
        {children}
      </DatadogProvider>
    </DatadogContext.Provider>
  )
}
