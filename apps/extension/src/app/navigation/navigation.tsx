import { AnimatePresence, Variants, motion } from 'framer-motion'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { NavigationType, Outlet, ScrollRestoration, useLocation } from 'react-router-dom'
import { DappRequestQueue } from 'src/app/features/dappRequests/DappRequestQueue'
import { HomeScreen } from 'src/app/features/home/HomeScreen'
import { Locked } from 'src/app/features/lockScreen/Locked'
import { NotificationToastWrapper } from 'src/app/features/notifications/NotificationToastWrapper'
import { StorageWarningModal } from 'src/app/features/warnings/StorageWarningModal'
import { useIsWalletUnlocked } from 'src/app/hooks/useIsWalletUnlocked'
import { HideContentsWhenSidebarBecomesInactive } from 'src/app/navigation/HideContentsWhenSidebarBecomesInactive'
import { SideBarNavigationProvider } from 'src/app/navigation/SideBarNavigationProvider'
import { AppRoutes } from 'src/app/navigation/constants'
import { RouterState, subscribeToRouterState, useRouterState } from 'src/app/navigation/state'
import { focusOrCreateOnboardingTab } from 'src/app/navigation/utils'
import { isOnboardedSelector } from 'src/app/utils/isOnboardedSelector'
import { Flex, SpinningLoader, styled } from 'ui/src'
import { TestnetModeBanner } from 'uniswap/src/components/banners/TestnetModeBanner'
import { useIsChromeWindowFocusedWithTimeout } from 'uniswap/src/extension/useIsChromeWindowFocused'
import { useAsyncData, usePrevious } from 'utilities/src/react/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { TransactionHistoryUpdater } from 'wallet/src/features/transactions/TransactionHistoryUpdater'
import { WalletUniswapProvider } from 'wallet/src/features/transactions/contexts/WalletUniswapContext'
import { QueuedOrderModal } from 'wallet/src/features/transactions/swap/modals/QueuedOrderModal'

export function MainContent(): JSX.Element {
  const isOnboarded = useSelector(isOnboardedSelector)

  if (!isOnboarded) {
    // TODO: add an error state that takes the user to fullscreen onboarding
    throw new Error('you should have onboarded')
  }

  return (
    <>
      <StorageWarningModal isOnboarding={false} />
      <HomeScreen />
    </>
  )
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

const animationVariant: Variants = {
  initial: (dir: Direction) => ({
    x: isVertical(dir) ? 0 : dir === 'right' ? -30 : 30,
    y: !isVertical(dir) ? 0 : dir === 'down' ? -15 : 15,
    opacity: 0,
    zIndex: 1,
  }),
  animate: {
    x: 0,
    y: 0,
    opacity: 1,
    zIndex: 1,
  },
  exit: (dir: Direction) => ({
    x: isVertical(dir) ? 0 : dir === 'left' ? -30 : 30,
    y: !isVertical(dir) ? 0 : dir === 'up' ? -15 : 15,
    opacity: 0,
    zIndex: 0,
  }),
}

export function WebNavigation(): JSX.Element {
  const [isTransitioning, setIsTransitioning] = useState(false)
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

  useEffect(() => {
    // We're using subscribeToRouterState subscriber to detect, whether we will
    // navigate to another page, which will lead to the start of the animation.
    subscribeToRouterState(({ historyAction, location }: RouterState) => {
      const trimmedPathname = location.pathname.replace('/', '') as AppRoutes
      if (historyAction !== NavigationType.Replace && Object.values(AppRoutes).includes(trimmedPathname)) {
        setIsTransitioning(true)
      }
    })
  }, [])

  const childrenMemo = useMemo(() => {
    return (
      <OverflowControlledFlex isTransitioning={isTransitioning}>
        <AnimatePresence initial={false}>
          <MotionFlex
            key={pathname}
            variants={animationVariant}
            custom={towards}
            initial="initial"
            animate="animate"
            exit="exit"
            onAnimationComplete={() => {
              setIsTransitioning(false)
            }}
          >
            <Flex fill grow overflow="visible">
              <TestnetModeBanner />
              {isLoggedIn === null ? (
                <Loading />
              ) : isLoggedIn === true ? (
                <HideContentsWhenSidebarBecomesInactive>
                  <LoggedIn />
                </HideContentsWhenSidebarBecomesInactive>
              ) : (
                <LoggedOut />
              )}
            </Flex>
          </MotionFlex>
        </AnimatePresence>
      </OverflowControlledFlex>
    )
  }, [isLoggedIn, pathname, towards, isTransitioning])

  return (
    <SideBarNavigationProvider>
      <WalletUniswapProvider>
        <NotificationToastWrapper />
        {shouldRestoreScroll && <ScrollRestoration />}
        {childrenMemo}
      </WalletUniswapProvider>
    </SideBarNavigationProvider>
  )
}

const MotionFlex = styled(motion(Flex), {
  zIndex: 1,
  fill: true,
  position: 'absolute',
  inset: 0,
  x: 0,
  opacity: 1,
  maxWidth: 'calc(min(535px, 100vw))',
  minHeight: '100vh',
  mx: 'auto',
  width: '100%',
})

function OverflowControlledFlex({
  children,
  isTransitioning,
}: React.PropsWithChildren & { isTransitioning: boolean }): JSX.Element {
  if (!isTransitioning) {
    return <Flex fill>{children}</Flex>
  }
  return (
    <Flex fill overflow="hidden">
      {children}
    </Flex>
  )
}

// TODO(EXT-994): improve this loading screen.
function Loading(): JSX.Element {
  return (
    <Flex centered grow>
      <SpinningLoader />
    </Flex>
  )
}

const isVertical = (dir: Direction): boolean => dir === 'up' || dir === 'down'

function useConstant<A>(c: A): A {
  const out = useRef<A>()
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
    </>
  )
}

function LoggedOut(): JSX.Element {
  const isOnboarded = useSelector(isOnboardedSelector)
  const didOpenOnboarding = useRef(false)

  const handleOnboarding = useCallback(async () => {
    if (!isOnboarded && !didOpenOnboarding.current) {
      // We keep track of this to avoid opening the onboarding page multiple times if this component remounts.
      didOpenOnboarding.current = true
      await focusOrCreateOnboardingTab()
      // Automatically close the pop up after focusing on the onboarding tab.
      window.close()
    }
  }, [isOnboarded])

  useAsyncData(handleOnboarding)

  // If the user has not onboarded, we render nothing and let the `useEffect` above automatically close the popup.
  // We could consider showing a loading spinner while the popup is being closed.
  return isOnboarded ? <Locked /> : <></>
}
