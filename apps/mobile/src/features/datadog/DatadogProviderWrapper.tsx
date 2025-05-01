import {
  BatchSize,
  DatadogProvider,
  DdRum,
  SdkVerbosity,
  TrackingConsent,
  UploadFrequency,
} from '@datadog/mobile-react-native'
import { ErrorEventMapper } from '@datadog/mobile-react-native/lib/typescript/rum/eventMappers/errorEventMapper'
import { PropsWithChildren, default as React, useEffect } from 'react'
import { config } from 'uniswap/src/config'
import {
  DatadogIgnoredErrorsConfigKey,
  DatadogIgnoredErrorsValType,
  DynamicConfigs,
} from 'uniswap/src/features/gating/configs'
import { getDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import { datadogEnabledBuild, isJestRun, localDevDatadogEnabled } from 'utilities/src/environment/constants'
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
const datadogAutoInstrumentation = {
  trackErrors: datadogEnabledBuild,
  trackInteractions: datadogEnabledBuild,
  trackResources: datadogEnabledBuild,
}

async function initializeDatadog(sessionSamplingRate: number | undefined): Promise<void> {
  const datadogConfig = {
    clientToken: config.datadogClientToken,
    env: getDatadogEnvironment(),
    applicationId: config.datadogProjectId,
    trackingConsent: undefined,
    site: 'US1',
    longTaskThresholdMs: 100,
    nativeCrashReportEnabled: true,
    verbosity: SdkVerbosity.INFO,
    errorEventMapper: (event: ReturnType<ErrorEventMapper>): ReturnType<ErrorEventMapper> | null => {
      const ignoredErrors = getDynamicConfigValue<
        DynamicConfigs.DatadogIgnoredErrors,
        DatadogIgnoredErrorsConfigKey,
        DatadogIgnoredErrorsValType
      >(DynamicConfigs.DatadogIgnoredErrors, DatadogIgnoredErrorsConfigKey.Errors, [])

      const ignoredError = ignoredErrors.find(({ messageContains }) => event?.message.includes(messageContains))
      if (ignoredError) {
        return Math.random() < ignoredError.sampleRate ? event : null
      }

      return event
    },
    sessionSamplingRate,
  }

  if (localDevDatadogEnabled) {
    Object.assign(datadogConfig, {
      sessionSamplingRate: 100,
      uploadFrequency: UploadFrequency.FREQUENT,
      batchSize: BatchSize.SMALL,
      verbosity: SdkVerbosity.DEBUG,
      trackingConsent: TrackingConsent.GRANTED,
    })
  }

  if (config.isE2ETest) {
    Object.assign(datadogConfig, {
      sessionSamplingRate: 100,
      trackingConsent: TrackingConsent.GRANTED,
      verbosity: SdkVerbosity.DEBUG,
    })
  }

  await DatadogProvider.initialize(datadogConfig)

  setAttributesToDatadog({
    isE2ETest: config.isE2ETest,
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
  useEffect(() => {
    if ((datadogEnabledBuild || config.isE2ETest) && sessionSampleRate !== undefined) {
      initializeDatadog(sessionSampleRate).catch(() => undefined)
    }
  }, [sessionSampleRate])

  if (isJestRun) {
    return <>{children}</>
  }
  logger.setDatadogEnabled(true)
  return (
    <DatadogProvider
      configuration={datadogAutoInstrumentation}
      onInitialization={async () => {
        const sessionId = await DdRum.getCurrentSessionId()
        // we do not want to log anything if session is not sampled
        logger.setDatadogEnabled(sessionId !== undefined)
      }}
    >
      {children}
    </DatadogProvider>
  )
}
