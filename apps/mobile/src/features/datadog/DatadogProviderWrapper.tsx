import {
  BatchSize,
  DatadogProvider,
  DatadogProviderConfiguration,
  DdRum,
  SdkVerbosity,
  TrackingConsent,
  UploadFrequency,
} from '@datadog/mobile-react-native'
import { ErrorEventMapper } from '@datadog/mobile-react-native/lib/typescript/rum/eventMappers/errorEventMapper'
import {
  DatadogIgnoredErrorsConfigKey,
  DatadogIgnoredErrorsValType,
  DynamicConfigs,
  getDynamicConfigValue,
} from '@universe/gating'
import { PropsWithChildren, default as React, useEffect, useState } from 'react'
import { DatadogContext } from 'src/features/datadog/DatadogContext'
import { config } from 'uniswap/src/config'
import { datadogEnabledBuild, isTestRun, localDevDatadogEnabled } from 'utilities/src/environment/constants'
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

async function initializeDatadog(sessionSamplingRate: number): Promise<void> {
  const datadogConfig: DatadogProviderConfiguration = {
    clientToken: config.datadogClientToken,
    env: getDatadogEnvironment(),
    applicationId: config.datadogProjectId,
    // @ts-expect-error - Favored getting types from DatadogProviderConfiguration over fixing ths type
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
    sessionSamplingRate,
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
  const [isInitialized, setInitialized] = useState(false)

  useEffect(() => {
    if ((datadogEnabledBuild || config.isE2ETest) && sessionSampleRate !== undefined) {
      initializeDatadog(sessionSampleRate).catch(() => undefined)
    }
  }, [sessionSampleRate])

  if (isTestRun) {
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
