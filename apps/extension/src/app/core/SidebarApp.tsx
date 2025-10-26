import '@tamagui/core/reset.css'
import 'src/app/Global.css'

import { SharedEventName } from '@uniswap/analytics-events'
import { useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { createHashRouter, RouterProvider } from 'react-router'
import { PersistGate } from 'redux-persist/integration/react'
import { ErrorElement } from 'src/app/components/ErrorElement'
import { useTraceSidebarDappUrl } from 'src/app/components/Trace/useTraceSidebarDappUrl'
import { BaseAppContainer } from 'src/app/core/BaseAppContainer'
import { DatadogAppNameTag } from 'src/app/datadog'
import { AccountSwitcherScreen } from 'src/app/features/accounts/AccountSwitcherScreen'
import { DappContextProvider } from 'src/app/features/dapp/DappContext'
import { addRequest } from 'src/app/features/dappRequests/actions'
import { ReceiveScreen } from 'src/app/features/receive/ReceiveScreen'
import { SendFlow } from 'src/app/features/send/SendFlow'
import { BackupRecoveryPhraseScreen } from 'src/app/features/settings/BackupRecoveryPhrase/BackupRecoveryPhraseScreen'
import { DeviceAccessScreen } from 'src/app/features/settings/DeviceAccessScreen'
import { DevMenuScreen } from 'src/app/features/settings/DevMenuScreen'
import { SettingsManageConnectionsScreen } from 'src/app/features/settings/SettingsManageConnectionsScreen/SettingsManageConnectionsScreen'
import { RemoveRecoveryPhraseVerify } from 'src/app/features/settings/SettingsRecoveryPhraseScreen/RemoveRecoveryPhraseVerify'
import { RemoveRecoveryPhraseWallets } from 'src/app/features/settings/SettingsRecoveryPhraseScreen/RemoveRecoveryPhraseWallets'
import { ViewRecoveryPhraseScreen } from 'src/app/features/settings/SettingsRecoveryPhraseScreen/ViewRecoveryPhraseScreen'
import { SettingsScreen } from 'src/app/features/settings/SettingsScreen'
import { SettingsScreenWrapper } from 'src/app/features/settings/SettingsScreenWrapper'
import { SmartWalletSettingsScreen } from 'src/app/features/settings/SmartWalletSettingsScreen'
import { SwapFlowScreen } from 'src/app/features/swap/SwapFlowScreen'
import { useIsWalletUnlocked } from 'src/app/hooks/useIsWalletUnlocked'
import { AppRoutes, RemoveRecoveryPhraseRoutes, SettingsRoutes } from 'src/app/navigation/constants'
import { MainContent, WebNavigation } from 'src/app/navigation/navigation'
import { setRouter, setRouterState } from 'src/app/navigation/state'
import { initExtensionAnalytics } from 'src/app/utils/analytics'
import {
  backgroundToSidePanelMessageChannel,
  createBackgroundToSidePanelMessagePort,
  DappBackgroundPortChannel,
} from 'src/background/messagePassing/messageChannels'
import { BackgroundToSidePanelRequestType } from 'src/background/messagePassing/types/requests'
import { PrimaryAppInstanceDebuggerLazy } from 'src/store/PrimaryAppInstanceDebuggerLazy'
import { useResetUnitagsQueries } from 'uniswap/src/data/apiClients/unitagsApi/useResetUnitagsQueries'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { isDevEnv } from 'utilities/src/environment/env'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useInterval } from 'utilities/src/time/timing'
import { useTestnetModeForLoggingAndAnalytics } from 'wallet/src/features/testnetMode/hooks/useTestnetModeForLoggingAndAnalytics'
import { getReduxPersistor } from 'wallet/src/state/persistor'

const router = createHashRouter([
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
            path: SettingsRoutes.DeviceAccess,
            element: <DeviceAccessScreen />,
          },
          isDevEnv()
            ? {
                path: SettingsRoutes.DevMenu,
                element: <DevMenuScreen />,
              }
            : {},
          {
            path: SettingsRoutes.ViewRecoveryPhrase,
            element: <ViewRecoveryPhraseScreen />,
          },
          {
            path: SettingsRoutes.BackupRecoveryPhrase,
            element: <BackupRecoveryPhraseScreen />,
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
            path: SettingsRoutes.ManageConnections,
            element: <SettingsManageConnectionsScreen />,
          },
          {
            path: SettingsRoutes.SmartWallet,
            element: <SmartWalletSettingsScreen />,
          },
        ],
      },
      {
        path: AppRoutes.Send,
        element: <SendFlow />,
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
  const dispatch = useDispatch()
  const [currentPortChannel, setCurrentPortChannel] = useState<DappBackgroundPortChannel | undefined>()
  const [windowId, setWindowId] = useState<string | undefined>()

  // biome-ignore lint/correctness/useExhaustiveDependencies: Only run on component mount for initial setup, disconnect cleanup is managed separately
  useEffect(() => {
    chrome.windows.getCurrent((window) => {
      setWindowId(window.id?.toString())
    })

    return () => currentPortChannel?.port.disconnect()
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
  useDappRequestPortListener()
  useTestnetModeForLoggingAndAnalytics()

  const resetUnitagsQueries = useResetUnitagsQueries()

  useEffect(() => {
    return backgroundToSidePanelMessageChannel.addMessageListener(
      BackgroundToSidePanelRequestType.RefreshUnitags,
      () => {
        resetUnitagsQueries()
      },
    )
  }, [resetUnitagsQueries])

  return (
    <>
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

function SidebarContent(): JSX.Element {
  useTraceSidebarDappUrl()

  return (
    <>
      <PrimaryAppInstanceDebuggerLazy />
      <RouterProvider router={router} />
    </>
  )
}

export default function SidebarApp(): JSX.Element {
  // initialize analytics on load
  useEffect(() => {
    initExtensionAnalytics().catch(() => undefined)
  }, [])

  const isLoggedIn = useIsWalletUnlocked()
  const hasSentAppLoadEvent = useRef(false)
  useEffect(() => {
    if (isLoggedIn !== null && !hasSentAppLoadEvent.current) {
      hasSentAppLoadEvent.current = true
      sendAnalyticsEvent(SharedEventName.APP_LOADED)
      sendAnalyticsEvent(ExtensionEventName.SidebarLoad, { locked: !isLoggedIn })
    }
  }, [isLoggedIn])

  return (
    <PersistGate persistor={getReduxPersistor()}>
      <BaseAppContainer appName={DatadogAppNameTag.Sidebar}>
        <DappContextProvider>
          <SidebarContent />
        </DappContextProvider>
      </BaseAppContainer>
    </PersistGate>
  )
}
