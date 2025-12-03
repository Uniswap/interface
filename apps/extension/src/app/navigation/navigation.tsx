import { useMutation } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'
import { NavigationType, Outlet, ScrollRestoration, useLocation } from 'react-router'
import { AutoLockProvider } from 'src/app/components/AutoLockProvider'
import { SmartWalletNudgeModals } from 'src/app/components/modals/SmartWalletNudgeModals'
import { DappRequestQueue } from 'src/app/features/dappRequests/DappRequestQueue'
import { ForceUpgradeModal } from 'src/app/features/forceUpgrade/ForceUpgradeModal'
import { HomeScreen } from 'src/app/features/home/HomeScreen'
import { Locked } from 'src/app/features/lockScreen/Locked'
import { NotificationToastWrapper } from 'src/app/features/notifications/NotificationToastWrapper'
import { StorageWarningModal } from 'src/app/features/warnings/StorageWarningModal'
import { useIsWalletUnlocked } from 'src/app/hooks/useIsWalletUnlocked'
import { AppRoutes } from 'src/app/navigation/constants'
import { focusOrCreateOnboardingTab } from 'src/app/navigation/focusOrCreateOnboardingTab'
import { HideContentsWhenSidebarBecomesInactive } from 'src/app/navigation/HideContentsWhenSidebarBecomesInactive'
import { SidebarNavigationProvider } from 'src/app/navigation/providers'
import { useRouterState } from 'src/app/navigation/state'
import { isOnboardedSelector } from 'src/app/utils/isOnboardedSelector'
import { AnimatePresence, Flex, SpinningLoader, styled } from 'ui/src'
import { TestnetModeBanner } from 'uniswap/src/components/banners/TestnetModeBanner'
import { useIsChromeWindowFocusedWithTimeout } from 'uniswap/src/extension/useIsChromeWindowFocused'
import { useEvent, usePrevious } from 'utilities/src/react/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useHeartbeatReporter } from 'wallet/src/features/telemetry/hooks/useHeartbeatReporter'
import { useLastBalancesReporter } from 'wallet/src/features/telemetry/hooks/useLastBalancesReporter'
import { WalletUniswapProvider } from 'wallet/src/features/transactions/contexts/WalletUniswapContext'
import { QueuedOrderModal } from 'wallet/src/features/transactions/swap/modals/QueuedOrderModal'
import { TransactionHistoryUpdater } from 'wallet/src/features/transactions/TransactionHistoryUpdater'
import { NativeWalletProvider } from 'wallet/src/features/wallet/providers/NativeWalletProvider'

export function MainContent(): JSX.Element {
  const isOnboarded = useSelector(isOnboardedSelector)

  if (!isOnboarded) {
    // TODO: add an error state that takes the user to fullscreen onboarding
    throw new Error('you should have onboarded')
  }

  return (
    <>
      <BackgroundServices />
      <StorageWarningModal isOnboarding={false} />
      <HomeScreen />
    </>
  )
}

/**
 * Background side effects that run in the background and are not part of the main app.
 * A separate component is used to avoid unnecessary re-rendering of the main app when
 * these services are running.
 */
function BackgroundServices(): JSX.Element {
  const isOnboarded = useSelector(isOnboardedSelector)
  useHeartbeatReporter({ isOnboarded })
  useLastBalancesReporter({ isOnboarded })
  return <></>
}

enum Direction {
  Left = 'left',
  Right = 'right',
  Up = 'up',
  Down = 'down',
}

const oppositeDirection = {
  [Direction.Left]: Direction.Right,
  [Direction.Right]: Direction.Left,
  [Direction.Up]: Direction.Down,
  [Direction.Down]: Direction.Up,
}

// default is Right
const routeDirections = {
  [AppRoutes.AccountSwitcher]: Direction.Up,
  [AppRoutes.Swap]: Direction.Down,
  [AppRoutes.Home]: Direction.Right,
  [AppRoutes.Requests]: Direction.Right,
  [AppRoutes.Receive]: Direction.Down,
  [AppRoutes.Settings]: Direction.Right,
  [AppRoutes.Send]: Direction.Down,
} satisfies Record<AppRoutes, Direction>

const getAppRouteFromPathName = (pathname: string): AppRoutes | null => {
  const val = (pathname.split('/')[1] || '') as AppRoutes
  if (Object.values(AppRoutes).includes(val)) {
    return val
  }
  return null
}

export function WebNavigation(): JSX.Element {
  const isLoggedIn = useIsWalletUnlocked()
  const { pathname } = useLocation()
  const history = useRef<string[]>([]).current
  if (history[0] !== pathname) {
    history.unshift(pathname)
  }

  let towards = Direction.Right
  const routeName = getAppRouteFromPathName(pathname)
  const routerState = useRouterState()
  if (routeName != null) {
    towards = routeDirections[routeName]
    const isBackwards = routerState?.historyAction === NavigationType.Pop
    if (isBackwards) {
      const lastRoute = getAppRouteFromPathName(history[1] || '')
      const previousDirection = lastRoute ? routeDirections[lastRoute] : 'right'
      towards = oppositeDirection[previousDirection]
    }
  }

  // Only restore scroll if path on latest re-render is different from the previous path.
  const prevPathname = usePrevious(pathname)
  const shouldRestoreScroll = pathname !== prevPathname
  const childrenMemo = useMemo(() => {
    return (
      <AnimatePresence custom={{ towards }} initial={false}>
        <AnimatedPane
          key={pathname}
          animation={[
            isVertical(towards) ? 'quicker' : '100ms',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
        >
          <Flex fill grow overflow="visible">
            <TestnetModeBanner />
            {isLoggedIn === null ? (
              <Loading />
            ) : isLoggedIn === true ? (
              <AutoLockProvider>
                <HideContentsWhenSidebarBecomesInactive>
                  <LoggedIn />
                </HideContentsWhenSidebarBecomesInactive>
              </AutoLockProvider>
            ) : (
              <LoggedOut />
            )}
          </Flex>
        </AnimatedPane>
      </AnimatePresence>
    )
  }, [isLoggedIn, pathname, towards])

  return (
    <SidebarNavigationProvider>
      <NativeWalletProvider>
        <WalletUniswapProvider>
          <NotificationToastWrapper />
          {shouldRestoreScroll && <ScrollRestoration />}
          {childrenMemo}
          {isLoggedIn && <ForceUpgradeModal />}
        </WalletUniswapProvider>
      </NativeWalletProvider>
    </SidebarNavigationProvider>
  )
}

function Loading(): JSX.Element {
  return (
    <Flex centered grow>
      <SpinningLoader />
    </Flex>
  )
}

const AnimatedPane = styled(Flex, {
  zIndex: 1,
  fill: true,
  position: 'absolute',
  inset: 0,
  x: 0,
  opacity: 1,
  maxWidth: 'calc(min(535px, 100vw))',
  minWidth: 319,
  minHeight: '100vh',
  mx: 'auto',
  width: '100%',

  variants: {
    towards: (dir: Direction) => ({
      enterStyle: {
        opacity: 0,
        zIndex: 1,
      },
      exitStyle: {
        zIndex: 0,
        x: isVertical(dir) ? 0 : dir === 'left' ? 30 : -30,
        y: !isVertical(dir) ? 0 : dir === 'up' ? 15 : -15,
        opacity: 0,
      },
    }),
  } as const,
})

const isVertical = (dir: Direction): boolean => dir === 'up' || dir === 'down'

function useConstant<A>(c: A): A {
  const out = useRef<A>(undefined)
  if (!out.current) {
    out.current = c
  }
  return out.current
}

function LoggedIn(): JSX.Element {
  /**
   *
   * So, rendering <Outlet /> directly means the internal hooks in Outlet
   * will update instantly on page change, but we don't want that.
   *
   * Instead we run an animation on page change and keep the old page around
   * until the animation completes.
   *
   * So what this does is "unwraps" the Outlet component in a sense, the hooks
   * actually run inside *this* component instead of inside the sub-component
   * Outlet.
   *
   * Then we wrap that in `useConstant` so it never changes.
   *
   * This makes it so the old page doesn't render with the new page contents
   * as it does its exit animation.
   *
   **/
  const outletContents = Outlet({})
  const contents = useConstant(outletContents)

  // To avoid excessive API calls, we pause the transaction history updater a short time after the window loses focus.
  const isChromeWindowFocused = useIsChromeWindowFocusedWithTimeout(30 * ONE_SECOND_MS)

  return (
    <>
      {contents}

      <QueuedOrderModal />

      {isChromeWindowFocused && <TransactionHistoryUpdater />}

      <DappRequestQueue />

      <SmartWalletNudgeModals />
    </>
  )
}

function LoggedOut(): JSX.Element {
  const isOnboarded = useSelector(isOnboardedSelector)
  const didOpenOnboarding = useRef(false)

  const focusOrCreateOnboardingTabMutation = useMutation({
    onSettled: () => {
      // We keep track of this to avoid opening the onboarding page multiple times if this component remounts.
      didOpenOnboarding.current = true
    },
    mutationFn: () => {
      return focusOrCreateOnboardingTab()
    },
    onSuccess: () => {
      // Automatically close the pop up after focusing on the onboarding tab.
      window.close()
    },
  })

  const focusOrCreateOnboardingTabEvent = useEvent(focusOrCreateOnboardingTabMutation.mutate)

  useEffect(() => {
    if (!focusOrCreateOnboardingTabMutation.isPending && !isOnboarded && !didOpenOnboarding.current) {
      focusOrCreateOnboardingTabEvent()
    }
  }, [focusOrCreateOnboardingTabEvent, isOnboarded, focusOrCreateOnboardingTabMutation.isPending])

  // If the user has not onboarded, we render nothing and let the `useEffect` above automatically close the popup.
  // We could consider showing a loading spinner while the popup is being closed.
  return isOnboarded ? <Locked /> : <></>
}
