import { PropsWithChildren } from 'react'
import { I18nextProvider } from 'react-i18next'
import { GraphqlProvider } from 'src/app/apollo'
import { TraceUserProperties } from 'src/app/components/Trace/TraceUserProperties'
import { ExtensionStatsigProvider } from 'src/app/core/StatsigProvider'
import { DatadogAppNameTag } from 'src/app/datadog'
import { getReduxStore } from 'src/store/store'
import { BlankUrlProvider } from 'uniswap/src/contexts/UrlContext'
import { LocalizationContextProvider } from 'uniswap/src/features/language/LocalizationContext'
import Trace from 'uniswap/src/features/telemetry/Trace'
import i18n from 'uniswap/src/i18n'
import { ErrorBoundary } from 'wallet/src/components/ErrorBoundary/ErrorBoundary'
import { SharedWalletProvider } from 'wallet/src/providers/SharedWalletProvider'

export function BaseAppContainer({
  children,
  appName,
}: PropsWithChildren<{ appName: DatadogAppNameTag }>): JSX.Element {
  return (
    <Trace>
      <ExtensionStatsigProvider appName={appName}>
        <I18nextProvider i18n={i18n}>
          <SharedWalletProvider reduxStore={getReduxStore()}>
            <ErrorBoundary>
              <GraphqlProvider>
                <BlankUrlProvider>
                  <LocalizationContextProvider>
                    <TraceUserProperties />
                    {children}
                  </LocalizationContextProvider>
                </BlankUrlProvider>
              </GraphqlProvider>
            </ErrorBoundary>
          </SharedWalletProvider>
        </I18nextProvider>
      </ExtensionStatsigProvider>
    </Trace>
  )
}
