import { ApiInit, getEntryGatewayUrl, provideSessionService } from '@universe/api'
import { getIsSessionServiceEnabled, getIsSessionUpgradeAutoEnabled } from '@universe/gating'
import {
  createChallengeSolverService,
  createSessionInitializationService,
  SessionInitializationService,
} from '@universe/sessions'
import { PropsWithChildren } from 'react'
import { I18nextProvider } from 'react-i18next'
import { GraphqlProvider } from 'src/app/apollo'
import { TraceUserProperties } from 'src/app/components/Trace/TraceUserProperties'
import { SmartWalletNudgesProvider } from 'src/app/context/SmartWalletNudgesContext'
import { ExtensionStatsigProvider } from 'src/app/core/StatsigProvider'
import { DatadogAppNameTag } from 'src/app/datadog'
import { getReduxStore } from 'src/store/store'
import { BlankUrlProvider } from 'uniswap/src/contexts/UrlContext'
import { LocalizationContextProvider } from 'uniswap/src/features/language/LocalizationContext'
import Trace from 'uniswap/src/features/telemetry/Trace'
import i18n from 'uniswap/src/i18n'
import { ErrorBoundary } from 'wallet/src/components/ErrorBoundary/ErrorBoundary'
import { AccountsStoreContextProvider } from 'wallet/src/features/accounts/store/provider'
import { SharedWalletProvider } from 'wallet/src/providers/SharedWalletProvider'

const provideSessionInitializationService = (): SessionInitializationService =>
  createSessionInitializationService({
    getSessionService: () =>
      provideSessionService({
        getBaseUrl: getEntryGatewayUrl,
        getIsSessionServiceEnabled,
      }),
    challengeSolverService: createChallengeSolverService(),
    getIsSessionUpgradeAutoEnabled,
  })

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
              <AccountsStoreContextProvider>
                <GraphqlProvider>
                  <BlankUrlProvider>
                    <SmartWalletNudgesProvider>
                      <LocalizationContextProvider>
                        <TraceUserProperties />
                        <ApiInit
                          getSessionInitService={provideSessionInitializationService}
                          getIsSessionServiceEnabled={getIsSessionServiceEnabled}
                        />
                        {children}
                      </LocalizationContextProvider>
                    </SmartWalletNudgesProvider>
                  </BlankUrlProvider>
                </GraphqlProvider>
              </AccountsStoreContextProvider>
            </ErrorBoundary>
          </SharedWalletProvider>
        </I18nextProvider>
      </ExtensionStatsigProvider>
    </Trace>
  )
}
