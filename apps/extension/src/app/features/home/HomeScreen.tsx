import { useApolloClient } from '@apollo/client'
import { SharedEventName } from '@uniswap/analytics-events'
import { memo, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { ActivityTab } from 'src/app/components/tabs/ActivityTab'
import { NftsTab } from 'src/app/components/tabs/NftsTab'
import AppRatingModal from 'src/app/features/appRating/AppRatingModal'
import { useAppRating } from 'src/app/features/appRating/hooks/useAppRating'
import { PortfolioActionButtons } from 'src/app/features/home/PortfolioActionButtons'
import { PortfolioHeader } from 'src/app/features/home/PortfolioHeader'
import { TokenBalanceList } from 'src/app/features/home/TokenBalanceList'
import { HomeIntroCardStack } from 'src/app/features/home/introCards/HomeIntroCardStack'
import { PinReminder } from 'src/app/features/onboarding/PinReminder'
import { selectAlertsState } from 'src/app/features/onboarding/alerts/selectors'
import { AlertName, closeAlert } from 'src/app/features/onboarding/alerts/slice'
import { useOptimizedSearchParams } from 'src/app/hooks/useOptimizedSearchParams'
import { HomeQueryParams, HomeTabs } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { Flex, Loader, Text, TouchableArea, styled } from 'ui/src'
import { useSelectAddressHasNotifications } from 'uniswap/src/features/notifications/hooks'
import { setNotificationStatus } from 'uniswap/src/features/notifications/slice'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logger } from 'utilities/src/logger/logger'
import { ONE_MINUTE_MS, ONE_SECOND_MS } from 'utilities/src/time/time'
import { useTimeout } from 'utilities/src/time/timing'
import { NFTS_TAB_DATA_DEPENDENCIES } from 'wallet/src/components/nfts/NftsList'
import { PendingNotificationBadge } from 'wallet/src/features/notifications/components/PendingNotificationBadge'
import { PortfolioBalance } from 'wallet/src/features/portfolio/PortfolioBalance'
import { useHeartbeatReporter, useLastBalancesReporter } from 'wallet/src/features/telemetry/hooks'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

export const HomeScreen = memo(function _HomeScreen(): JSX.Element {
  const { t } = useTranslation()
  const [showTabs, setShowTabs] = useState(false)

  const apolloClient = useApolloClient()

  // The tabs are too slow to render on the first load, so we delay them to speed up the perceived loading time.
  useTimeout(() => setShowTabs(true), 0)

  const address = useActiveAccountAddressWithThrow()
  const [selectedTab, setSelectedTab] = useSelectedTabState()
  const dispatch = useDispatch()

  // Record a heartbeat for anonymous user DAU
  useHeartbeatReporter()
  // Report balances at most every 24 hours, checking every 15 seconds when app is open
  useLastBalancesReporter()

  useEffect(() => {
    if (selectedTab) {
      sendAnalyticsEvent(SharedEventName.PAGE_VIEWED, {
        screen: selectedTab,
      })
    }
  }, [selectedTab])

  // defaults to true, but store state will persist to future loads once updated
  const { isOpen: isPinRequestOpen } = useSelector(selectAlertsState(AlertName.PinToToolbar))
  const onClosePinRequest = useCallback(() => dispatch(closeAlert(AlertName.PinToToolbar)), [dispatch])

  useEffect(() => {
    let intervalId: number
    const checkExtensionPinnedStatus = async (): Promise<void> => {
      const settings = await chrome.action.getUserSettings()
      if (settings.isOnToolbar) {
        onClosePinRequest()
        // Clear interval once pinned
        clearInterval(intervalId)
      }
    }

    // Only set up the interval if the pin request is open
    if (isPinRequestOpen) {
      // Check immediately on mount
      checkExtensionPinnedStatus().catch((e) => logger.error('Error checking if extension is pinned in Chrome', e))

      intervalId = window.setInterval(checkExtensionPinnedStatus, ONE_SECOND_MS)
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [isPinRequestOpen, onClosePinRequest])

  const hasNotifications = useSelectAddressHasNotifications(address)
  useEffect(() => {
    if (selectedTab === HomeTabs.Activity && hasNotifications) {
      dispatch(setNotificationStatus({ address, hasNotifications: false }))
    }
  }, [dispatch, address, hasNotifications, selectedTab])

  const [lastNftFetchTime, setLastNftFetchTime] = useState(0)

  useEffect(() => {
    // NFTs tab is first fetched on mount, so we need to set the last fetch time here
    setLastNftFetchTime(Date.now())
  }, [])

  const shouldRefetchNfts = useCallback(() => {
    const now = Date.now()
    return now - lastNftFetchTime >= ONE_MINUTE_MS
  }, [lastNftFetchTime])

  const maybeRefetchNfts = useCallback(() => {
    if (shouldRefetchNfts()) {
      setLastNftFetchTime(Date.now())
      apolloClient.refetchQueries({ include: NFTS_TAB_DATA_DEPENDENCIES }).catch((e) => {
        logger.error('Error refetching NFTs tab data', e)
      })
    }
  }, [apolloClient, shouldRefetchNfts])

  const { appRatingModalVisible, onAppRatingModalClose } = useAppRating()

  return (
    <Flex fill alignItems="center" backgroundColor="$surface1" p="$spacing12">
      {address ? (
        <Flex backgroundColor="$surface1" gap="$spacing12" width="100%">
          {isPinRequestOpen && (
            <Flex position="relative" width="100%">
              <PinReminder style="popup" onClose={onClosePinRequest} />
            </Flex>
          )}
          <Flex grow gap="$spacing8">
            <Flex pl="$spacing4" position="relative" pt="$spacing4">
              <PortfolioHeader address={address} />
            </Flex>
            <Flex pb="$spacing8" pl="$spacing4">
              <PortfolioBalance owner={address} />
            </Flex>

            <PortfolioActionButtons />

            <HomeIntroCardStack />

            <Flex flex={1} width="100%">
              <Flex row gap="$spacing16" px="$spacing4" py="$spacing8">
                <TabButton isActive={selectedTab === HomeTabs.Tokens} onPress={() => setSelectedTab(HomeTabs.Tokens)}>
                  {t('home.tokens.title')}
                </TabButton>

                <TabButton
                  isActive={selectedTab === HomeTabs.NFTs}
                  onPress={() => {
                    setSelectedTab(HomeTabs.NFTs)
                    maybeRefetchNfts()
                  }}
                >
                  {t('home.nfts.title')}
                </TabButton>

                <TabButton
                  showPendingNotificationBadge
                  isActive={selectedTab === HomeTabs.Activity}
                  onPress={() => setSelectedTab(HomeTabs.Activity)}
                >
                  {t('home.activity.title')}
                </TabButton>
              </Flex>

              <Flex row height="100%" width="100%">
                {showTabs ? (
                  <>
                    <AnimatedTab hideLeft={selectedTab !== HomeTabs.Tokens} isActive={selectedTab === HomeTabs.Tokens}>
                      <TokenBalanceList owner={address} />
                    </AnimatedTab>

                    <AnimatedTab
                      hideLeft={selectedTab === HomeTabs.Activity}
                      hideRight={selectedTab === HomeTabs.Tokens}
                      isActive={selectedTab === HomeTabs.NFTs}
                    >
                      <NftsTab owner={address} />
                    </AnimatedTab>

                    <AnimatedTab
                      hideRight={selectedTab !== HomeTabs.Activity}
                      isActive={selectedTab === HomeTabs.Activity}
                    >
                      <ActivityTab address={address} />
                    </AnimatedTab>
                  </>
                ) : (
                  <Flex fill mx="$spacing8">
                    <Loader.Token withPrice repeat={6} />
                  </Flex>
                )}
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      ) : (
        <Text color="$statusCritical" variant="subheading1">
          {t('home.extension.error')}
        </Text>
      )}
      {appRatingModalVisible && <AppRatingModal onClose={onAppRatingModalClose} />}
    </Flex>
  )
})

const TabButton = ({
  isActive,
  onPress,
  children,
  showPendingNotificationBadge = false,
}: {
  isActive: boolean
  onPress: () => void
  children: React.ReactNode
  showPendingNotificationBadge?: boolean
}): JSX.Element => {
  return (
    <TouchableArea alignItems="center" flexDirection="row" gap="$spacing4" p="$spacing2" onPress={onPress}>
      <Text color={isActive ? '$neutral1' : '$neutral2'} userSelect="none" variant="subheading2">
        {children}
      </Text>
      {showPendingNotificationBadge && !isActive && <PendingNotificationBadge />}
    </TouchableArea>
  )
}

const AnimatedTab = styled(Flex, {
  animation: 'quicker',
  width: '100%',
  mr: '-100%',
  x: 0,
  opacity: 1,

  variants: {
    isActive: {
      true: {},
      false: {
        pointerEvents: 'none',
        display: 'none',
      },
    },

    hideLeft: {
      true: {
        opacity: 0,
        // if this number is larger than the horizontal padding of the screen, it
        // will make a horizontal scroll bar appear when using a mouse on macOS
        x: -10,
        pointerEvents: 'none',
      },
    },
    hideRight: {
      true: {
        opacity: 0,
        x: 10,
        pointerEvents: 'none',
      },
    },
  } as const,
})

// useNavigate/useSearchParams re-renders on every page change, so we avoid them here:
// https://github.com/remix-run/react-router/issues/7634#issuecomment-1306650156
function useSelectedTabState(): [HomeTabs | null, (tab: HomeTabs) => void] {
  const searchParams = useOptimizedSearchParams()
  const tab = searchParams.get(HomeQueryParams.Tab)

  const setNewTab = useCallback(async (newTab: HomeTabs) => {
    navigate(
      {
        search: `?${HomeQueryParams.Tab}=${newTab}`,
      },
      {
        replace: true,
      },
    )
  }, [])

  if (isValidHomeTab(tab)) {
    return [tab, setNewTab]
  }

  return [HomeTabs.Tokens, setNewTab]
}

function isValidHomeTab(tab: unknown): tab is HomeTabs {
  return tab === HomeTabs.Tokens || tab === HomeTabs.NFTs || tab === HomeTabs.Activity
}
