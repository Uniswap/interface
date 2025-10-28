import { useApolloClient } from '@apollo/client'
import { SharedEventName } from '@uniswap/analytics-events'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { memo, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { ActivityTab } from 'src/app/components/tabs/ActivityTab'
import { NftsTab } from 'src/app/components/tabs/NftsTab'
import { useSmartWalletNudges } from 'src/app/context/SmartWalletNudgesContext'
import AppRatingModal from 'src/app/features/appRating/AppRatingModal'
import { useAppRating } from 'src/app/features/appRating/hooks/useAppRating'
import { HomeIntroCardStack } from 'src/app/features/home/introCards/HomeIntroCardStack'
import { PortfolioActionButtons } from 'src/app/features/home/PortfolioActionButtons'
import { PortfolioHeader } from 'src/app/features/home/PortfolioHeader'
import { ExtensionTokenBalanceList } from 'src/app/features/home/TokenBalanceList'
import { selectAlertsState } from 'src/app/features/onboarding/alerts/selectors'
import { AlertName, closeAlert } from 'src/app/features/onboarding/alerts/slice'
import { PinReminder } from 'src/app/features/onboarding/PinReminder'
import { useOptimizedSearchParams } from 'src/app/hooks/useOptimizedSearchParams'
import { HomeQueryParams, HomeTabs } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { Flex, Loader, styled, Text, TouchableArea } from 'ui/src'
import { SMART_WALLET_UPGRADE_VIDEO } from 'ui/src/assets'
import { NFTS_TAB_DATA_DEPENDENCIES } from 'uniswap/src/components/nfts/constants'
import { useSelectAddressHasNotifications } from 'uniswap/src/features/notifications/slice/hooks'
import { setNotificationStatus } from 'uniswap/src/features/notifications/slice/slice'
import { PortfolioBalance } from 'uniswap/src/features/portfolio/PortfolioBalance/PortfolioBalance'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { ONE_MINUTE_MS, ONE_SECOND_MS } from 'utilities/src/time/time'
import { useTimeout } from 'utilities/src/time/timing'
import { SmartWalletEnabledModal } from 'wallet/src/components/smartWallet/modals/SmartWalletEnabledModal'
import { SmartWalletUpgradeModals } from 'wallet/src/components/smartWallet/modals/SmartWalletUpgradeModal'
import { useOpenSmartWalletNudgeOnCompletedSwap } from 'wallet/src/components/smartWallet/smartAccounts/hooks'
import { setIncrementNumPostSwapNudge } from 'wallet/src/features/behaviorHistory/slice'
import { PendingNotificationBadge } from 'wallet/src/features/notifications/components/PendingNotificationBadge'
import { useActiveAccountAddressWithThrow, useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'
import { setSmartWalletConsent } from 'wallet/src/features/wallet/slice'

const MemoizedVideo = memo(() => (
  <Flex borderRadius="$rounded12" overflow="hidden" height="auto" maxWidth="100%" aspectRatio="16 / 9">
    <video
      src={SMART_WALLET_UPGRADE_VIDEO}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      }}
      autoPlay
      muted
    />
  </Flex>
))

MemoizedVideo.displayName = 'MemoizedVideo'

export const HomeScreen = memo(function _HomeScreen(): JSX.Element {
  const { t } = useTranslation()
  const activeAccount = useActiveAccountWithThrow()
  const [showTabs, setShowTabs] = useState(false)

  const apolloClient = useApolloClient()

  // The tabs are too slow to render on the first load, so we delay them to speed up the perceived loading time.
  useTimeout(() => setShowTabs(true), 0)

  const address = useActiveAccountAddressWithThrow()
  const [selectedTab, setSelectedTab] = useSelectedTabState()
  const isSmartWalletEnabled = useFeatureFlag(FeatureFlags.SmartWallet)
  const [isSmartWalletEnabledModalOpen, setIsSmartWalletEnabledModalOpen] = useState(false)
  const dispatch = useDispatch()

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

  const handleSmartWalletEnable = useCallback(
    (onComplete?: () => void): void => {
      dispatch(setSmartWalletConsent({ address: activeAccount.address, smartWalletConsent: true }))
      onComplete?.()
      setIsSmartWalletEnabledModalOpen(true)
    },
    [dispatch, activeAccount.address],
  )

  // Handle the smart wallet nudge when a swap transaction is completed
  const { openModal, activeModal } = useSmartWalletNudges()
  useOpenSmartWalletNudgeOnCompletedSwap(
    useEvent(() => {
      if (!activeAccount.address) {
        return
      }
      dispatch(setIncrementNumPostSwapNudge({ walletAddress: address }))
      openModal(ModalName.SmartWalletNudge)
    }),
  )

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
                      <ExtensionTokenBalanceList owner={address} />
                    </AnimatedTab>

                    <AnimatedTab
                      hideLeft={selectedTab === HomeTabs.Activity}
                      hideRight={selectedTab === HomeTabs.Tokens}
                      isActive={selectedTab === HomeTabs.NFTs}
                    >
                      <NftsTab owner={address} skip={selectedTab !== HomeTabs.NFTs} />
                    </AnimatedTab>

                    <AnimatedTab
                      hideRight={selectedTab !== HomeTabs.Activity}
                      isActive={selectedTab === HomeTabs.Activity}
                    >
                      <ActivityTab address={address} skip={selectedTab !== HomeTabs.Activity} />
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
      {isSmartWalletEnabled && !activeModal && (
        <SmartWalletUpgradeModals
          account={activeAccount}
          video={<MemoizedVideo />}
          onEnableSmartWallet={handleSmartWalletEnable}
        />
      )}

      {isSmartWalletEnabledModalOpen && isSmartWalletEnabled ? (
        <SmartWalletEnabledModal
          isOpen
          showReconnectDappPrompt={false}
          onClose={() => setIsSmartWalletEnabledModalOpen(false)}
        />
      ) : undefined}
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
