import '@tamagui/core/reset.css'
import 'src/app/Global.css'

import { useEffect, useRef, useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import { RouterProvider, ScrollRestoration } from 'react-router-dom'
import { PersistGate } from 'redux-persist/integration/react'
import { ExtensionStatsigProvider } from 'src/app/StatsigProvider'
import { GraphqlProvider } from 'src/app/apollo'
import { ErrorElement } from 'src/app/components/ErrorElement'
import { TraceUserProperties } from 'src/app/components/Trace/TraceUserProperties'
import { AccountSwitcherScreen } from 'src/app/features/accounts/AccountSwitcherScreen'
import { DappContextProvider } from 'src/app/features/dapp/DappContext'
import { addRequest } from 'src/app/features/dappRequests/saga'
import { ReceiveScreen } from 'src/app/features/receive/ReceiveScreen'
import { DevMenuScreen } from 'src/app/features/settings/DevMenuScreen'
import { SettingsPrivacyScreen } from 'src/app/features/settings/SettingsPrivacyScreen'
import { RemoveRecoveryPhraseVerify } from 'src/app/features/settings/SettingsRecoveryPhraseScreen/RemoveRecoveryPhraseVerify'
import { RemoveRecoveryPhraseWallets } from 'src/app/features/settings/SettingsRecoveryPhraseScreen/RemoveRecoveryPhraseWallets'
import { SettingsViewRecoveryPhraseScreen } from 'src/app/features/settings/SettingsRecoveryPhraseScreen/ViewRecoveryPhraseScreen'
import { SettingsScreen } from 'src/app/features/settings/SettingsScreen'
import { SettingsScreenWrapper } from 'src/app/features/settings/SettingsScreenWrapper'
import { SettingsChangePasswordScreen } from 'src/app/features/settings/password/SettingsChangePasswordScreen'
import { SwapFlowScreen } from 'src/app/features/swap/SwapFlowScreen'
import { TransferFlowScreen } from 'src/app/features/transfer/TransferFlowScreen'
import { useIsWalletUnlocked } from 'src/app/hooks/useIsWalletUnlocked'
import { MainContent, WebNavigation } from 'src/app/navigation'
import { AppRoutes, RemoveRecoveryPhraseRoutes, SettingsRoutes } from 'src/app/navigation/constants'
import { setRouter, setRouterState } from 'src/app/navigation/state'
import { SentryAppNameTag, initializeSentry, sentryCreateHashRouter } from 'src/app/sentry'
import { initExtensionAnalytics } from 'src/app/utils/analytics'
import { getLocalUserId } from 'src/app/utils/storage'
import {
  DappBackgroundPortChannel,
  createBackgroundToSidePanelMessagePort,
} from 'src/background/messagePassing/messageChannels'
import { BackgroundToSidePanelRequestType } from 'src/background/messagePassing/types/requests'
import { PrimaryAppInstanceDebuggerLazy } from 'src/store/PrimaryAppInstanceDebuggerLazy'
import { getReduxPersistor, getReduxStore, useAppDispatch } from 'src/store/store'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { UnitagUpdaterContextProvider } from 'uniswap/src/features/unitags/context'
import i18n from 'uniswap/src/i18n/i18n'
import { isDevEnv } from 'utilities/src/environment'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useInterval } from 'utilities/src/time/timing'
import { ErrorBoundary } from 'wallet/src/components/ErrorBoundary/ErrorBoundary'
import { LocalizationContextProvider } from 'wallet/src/features/language/LocalizationContext'
import { syncAppWithDeviceLanguage } from 'wallet/src/features/language/slice'
import { SharedProvider } from 'wallet/src/provider'

getLocalUserId()
  .then((userId) => {
    initializeSentry(SentryAppNameTag.Sidebar, userId)
  })
  .catch((error) => {
    logger.error(error, {
      tags: { file: 'SidebarApp.tsx', function: 'getLocalUserId' },
    })
  })

const router = sentryCreateHashRouter([
  {
    path: '',
    element: <SidebarWrapper />,
    errorElement: <ErrorElement />,
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
            path: SettingsRoutes.ChangePassword,
            element: <SettingsChangePasswordScreen />,
          },
          isDevEnv()
            ? {
                path: SettingsRoutes.DevMenu,
                element: <DevMenuScreen />,
              }
            : {},
          {
            path: SettingsRoutes.ViewRecoveryPhrase,
            element: <SettingsViewRecoveryPhraseScreen />,
          },
          {
            path: SettingsRoutes.RemoveRecoveryPhrase,
            children: [
              {
                path: RemoveRecoveryPhraseRoutes.Wallets,
                element: <RemoveRecoveryPhraseWallets />,
              },
              {
                path: RemoveRecoveryPhraseRoutes.Verify,
                element: <RemoveRecoveryPhraseVerify />,
              },
            ],
          },
          {
            path: SettingsRoutes.Privacy,
            element: <SettingsPrivacyScreen />,
          },
        ],
      },
      {
        path: AppRoutes.Transfer,
        element: <TransferFlowScreen />,
      },
      {
        path: AppRoutes.Swap,
        element: <SwapFlowScreen />,
      },
      {
        path: AppRoutes.Receive,
        element: <ReceiveScreen />,
      },
    ],
  },
])

const PORT_PING_INTERVAL = 5 * ONE_SECOND_MS
function useDappRequestPortListener(): void {
  const dispatch = useAppDispatch()
  const [currentPortChannel, setCurrentPortChannel] = useState<DappBackgroundPortChannel | undefined>()
  const [windowId, setWindowId] = useState<string | undefined>()

  useEffect(() => {
    chrome.windows.getCurrent((window) => {
      setWindowId(window.id?.toString())
    })

    return () => currentPortChannel?.port.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (windowId === undefined || currentPortChannel) {
      return
    }

    try {
      const port = chrome.runtime.connect({ name: windowId.toString() })
      const portChannel = createBackgroundToSidePanelMessagePort(port)
      portChannel.addMessageListener(BackgroundToSidePanelRequestType.DappRequestReceived, (message) => {
        const { dappRequest, senderTabInfo, isSidebarClosed } = message
        dispatch(
          addRequest({
            dappRequest,
            senderTabInfo,
            isSidebarClosed,
          }),
        )
      })

      port.onDisconnect.addListener(() => {
        sendAnalyticsEvent(ExtensionEventName.SidebarClosed)
        setCurrentPortChannel(undefined)
      })
      setCurrentPortChannel(portChannel)
    } catch (error) {
      logger.error(error, {
        tags: { file: 'SidebarApp.tsx', function: 'useDappRequestPortListener' },
      })
    }
  }, [dispatch, windowId, currentPortChannel])

  useInterval(() => {
    try {
      // Need to send general ping message, no type-safety needed
      currentPortChannel?.port.postMessage('statusPing')
    } catch (error) {
      currentPortChannel?.port.disconnect()
      setCurrentPortChannel(undefined)

      logger.error(error, {
        tags: { file: 'SidebarApp.tsx', function: 'useDappRequestPortListener' },
      })
    }
  }, PORT_PING_INTERVAL)
}

function SidebarWrapper(): JSX.Element {
  const dispatch = useAppDispatch()
  useDappRequestPortListener()

  useEffect(() => {
    dispatch(syncAppWithDeviceLanguage())
  }, [dispatch])

  return (
    <>
      <ScrollRestoration />
      <WebNavigation />
    </>
  )
}

/**
 * Note: we are using a pattern here to avoid circular dependencies, because
 * this is the root of the app and it imports all sub-pages, we need to push the
 * router/router state to a different file so it can be imported by those pages
 */
router.subscribe((state) => {
  setRouterState(state)
})

setRouter(router)

export default function SidebarApp(): JSX.Element {
  // initialize analytics on load
  useEffect(() => {
    initExtensionAnalytics().catch(() => undefined)
  }, [])

  const isLoggedIn = useIsWalletUnlocked()
  const hasSentLoginEvent = useRef(false)
  useEffect(() => {
    if (isLoggedIn !== null && !hasSentLoginEvent.current) {
      hasSentLoginEvent.current = true
      sendAnalyticsEvent(ExtensionEventName.SidebarLoad, { locked: !isLoggedIn })
    }
  }, [isLoggedIn])

  return (
    <Trace>
      <PersistGate persistor={getReduxPersistor()}>
        <ExtensionStatsigProvider>
          <I18nextProvider i18n={i18n}>
            <SharedProvider reduxStore={getReduxStore()}>
              <ErrorBoundary>
                <GraphqlProvider>
                  <LocalizationContextProvider>
                    <UnitagUpdaterContextProvider>
                      <TraceUserProperties />
                      <DappContextProvider>
                        <PrimaryAppInstanceDebuggerLazy />
                        <RouterProvider router={router} />
                      </DappContextProvider>
                    </UnitagUpdaterContextProvider>
                  </LocalizationContextProvider>
                </GraphqlProvider>
              </ErrorBoundary>
            </SharedProvider>
          </I18nextProvider>
        </ExtensionStatsigProvider>
      </PersistGate>
    </Trace>
  )
}
