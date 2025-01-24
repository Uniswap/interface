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
import { PropsWithChildren, default as React } from 'react'
import { getDatadogEnvironment } from 'src/utils/version'
import { config } from 'uniswap/src/config'
import {
  DatadogIgnoredErrorsConfigKey,
  DatadogIgnoredErrorsValType,
  DynamicConfigs,
} from 'uniswap/src/features/gating/configs'
import { getDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import { datadogEnabled, isDetoxBuild, isJestRun, localDevDatadogEnabled } from 'utilities/src/environment/constants'
import { logger } from 'utilities/src/logger/logger'

export const SESSION_SAMPLE_RATE = 10 // percent

const datadogConfig = new DatadogProviderConfiguration(
  config.datadogClientToken,
  getDatadogEnvironment(),
  config.datadogProjectId,
  datadogEnabled, // trackInteractions
  datadogEnabled, // trackResources
  datadogEnabled, // trackErrors
  localDevDatadogEnabled ? TrackingConsent.GRANTED : undefined,
)

Object.assign(datadogConfig, {
  site: 'US1',
  longTaskThresholdMs: 100,
  nativeCrashReportEnabled: true,
  verbosity: SdkVerbosity.INFO,
  errorEventMapper: (event: ReturnType<ErrorEventMapper>) => {
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
  sessionSampleRate: SESSION_SAMPLE_RATE,
})

if (localDevDatadogEnabled) {
  Object.assign(datadogConfig, {
    sessionSamplingRate: 100,
    resourceTracingSamplingRate: 100,
    uploadFrequency: UploadFrequency.FREQUENT,
    batchSize: BatchSize.SMALL,
    verbosity: SdkVerbosity.DEBUG,
  })
}

/**
 * Wrapper component to provide Datadog to the app with our mobile app's
 * specific configuration.
 */
export function DatadogProviderWrapper({ children }: PropsWithChildren): JSX.Element {
  if (isDetoxBuild || isJestRun) {
    return <>{children}</>
  }
  return (
    <DatadogProvider
      configuration={datadogConfig}
      onInitialization={async () => {
        const sessionId = await DdRum.getCurrentSessionId()
        // we do not want to log anything if session is not sampled
        logger.setWalletDatadogEnabled(sessionId !== undefined)
      }}
    >
      {children}
    </DatadogProvider>
  )
}
