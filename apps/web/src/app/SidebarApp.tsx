import './Global.css'

import { ToastProvider, ToastViewport } from '@tamagui/toast'
import { useEffect } from 'react'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { GraphqlProvider } from 'src/app/apollo'
import { ErrorBoundary } from 'src/app/components/ErrorBoundary'
import { BottomToast } from 'src/app/components/toast/BottomToast'
import Trace from 'src/app/components/Trace/Trace'
import { TraceUserProperties } from 'src/app/components/Trace/TraceUserProperties'
import { AccountSwitcherScreen } from 'src/app/features/accounts/AccountSwitcherScreen'
import { SettingsScreen } from 'src/app/features/settings/SettingsScreen'
import { SettingsScreenWrapper } from 'src/app/features/settings/SettingsScreenWrapper'
import { SettingsViewRecoveryPhraseScreen } from 'src/app/features/settings/SettingsViewRecoveryPhraseScreen'
import { SettingsWalletEditNicknameScreen } from 'src/app/features/settings/SettingsWalletEditNicknameScreen'
import { SettingsWalletScreen } from 'src/app/features/settings/SettingsWalletScreen'
import { sendExtensionAnalyticsEvent } from 'src/app/features/telemetry'
import { ExtensionEventName } from 'src/app/features/telemetry/constants'
import { TransferFlowScreen } from 'src/app/features/transfer/TransferFlowScreen'
import { AppRoutes, SettingsRoutes, SettingsWalletRoutes } from 'src/app/navigation/constants'
import { DappContextProvider } from 'src/background/features/dapp/DappContext'
import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { ApplicationTransport } from 'utilities/src/telemetry/analytics/ApplicationTransport'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { LocalizationContextProvider } from 'wallet/src/features/language/LocalizationContext'
import { SharedProvider } from 'wallet/src/provider'
import { Store } from 'webext-redux'
import { MainContent, WebNavigation } from './navigation'

const EXTENSION_ORIGIN_APPLICATION = 'extension'

const router = createHashRouter([
  {
    path: '',
    element: <WebNavigation />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: '',
        element: <MainContent />,
      },
      {
        path: AppRoutes.AccountSwitcher,
        element: <AccountSwitcherScreen />,
      },
      {
        path: AppRoutes.Settings,
        element: <SettingsScreenWrapper />,
        children: [
          {
            path: '',
            element: <SettingsScreen />,
          },
          {
            path: `${SettingsRoutes.Wallet}/:address`,
            element: <SettingsWalletScreen />,
          },
          {
            path: `${SettingsRoutes.Wallet}/:address/${SettingsWalletRoutes.EditNickname}`,
            element: <SettingsWalletEditNicknameScreen />,
          },
          {
            path: SettingsRoutes.ViewRecoveryPhrase,
            element: <SettingsViewRecoveryPhraseScreen />,
          },
        ],
      },
      {
        path: AppRoutes.Transfer,
        element: <TransferFlowScreen />,
      },
    ],
  },
])

function App({ store }: { store: Store }): JSX.Element {
  // initialize analytics on load
  useEffect(() => {
    async function initAndLogLoad(): Promise<void> {
      await analytics.init(
        new ApplicationTransport(uniswapUrls.amplitudeProxyUrl, EXTENSION_ORIGIN_APPLICATION)
      )
      sendExtensionAnalyticsEvent(ExtensionEventName.ExtensionLoad)
    }
    initAndLogLoad().catch(() => undefined)
  }, [])

  return (
    <Trace>
      <SharedProvider reduxStore={store}>
        <GraphqlProvider>
          <LocalizationContextProvider>
            <TraceUserProperties />
            <DappContextProvider>
              <ToastProvider>
                <RouterProvider router={router} />
                <ToastViewport bottom={0} flexDirection="column" left={0} name="popup" right={0} />
                <BottomToast />
              </ToastProvider>
            </DappContextProvider>
          </LocalizationContextProvider>
        </GraphqlProvider>
      </SharedProvider>
    </Trace>
  )
}

export default App
