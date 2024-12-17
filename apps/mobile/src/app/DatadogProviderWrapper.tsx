import {
  BatchSize,
  DatadogProvider,
  DatadogProviderConfiguration,
  SdkVerbosity,
  TrackingConsent,
  UploadFrequency,
} from '@datadog/mobile-react-native'
import { ErrorEventMapper } from '@datadog/mobile-react-native/lib/typescript/rum/eventMappers/errorEventMapper'
import { PropsWithChildren, default as React } from 'react'
import { getDatadogEnvironment } from 'src/utils/version'
import { config } from 'uniswap/src/config'
import { datadogEnabled, isDetoxBuild, isJestRun, localDevDatadogEnabled } from 'utilities/src/environment/constants'
import { logger } from 'utilities/src/logger/logger'

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
    // this is Sentry error, which is caused by the not complete closing of their SDK
    if (event?.message.includes('Native is disabled')) {
      return null
    }
    return event
  },
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
  logger.setWalletDatadogEnabled(true)

  if (isDetoxBuild || isJestRun) {
    return <>{children}</>
  }
  return <DatadogProvider configuration={datadogConfig}>{children}</DatadogProvider>
}
