import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { getIsNotificationServiceLocalOverrideEnabled } from '@universe/notifications'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { OnboardingIntroCardStack } from 'src/components/home/introCards/OnboardingIntroCardStack'
import { PortfolioOverview } from 'src/components/home/PortfolioChart/PortfolioOverview'
import { MobileNotificationServiceManager } from 'src/notification-service/MobileNotificationServiceManager'
import { HomeScreenQuickActions } from 'src/screens/HomeScreen/HomeScreenQuickActions'
import { useHomeScreenState } from 'src/screens/HomeScreen/useHomeScreenState'
import { Flex, Text, TouchableArea } from 'ui/src'
import { buildWrappedUrl } from 'uniswap/src/components/banners/shared/utils'
import { UniswapWrapped2025Banner } from 'uniswap/src/components/banners/UniswapWrapped2025Banner/UniswapWrapped2025Banner'
import { UNISWAP_WEB_URL } from 'uniswap/src/constants/urls'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { selectHasDismissedUniswapWrapped2025Banner } from 'uniswap/src/features/behaviorHistory/selectors'
import { setHasDismissedUniswapWrapped2025Banner } from 'uniswap/src/features/behaviorHistory/slice'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { DataApiOutageBanner } from 'uniswap/src/features/dataApi/outage/DataApiOutageBanner'
import { DataApiOutageModalContent } from 'uniswap/src/features/dataApi/outage/DataApiOutageModalContent'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { openUri } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { HomeScreenEarningSection } from 'wallet/src/features/earn/HomeScreenEarningSection'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

interface HomeScreenPortfolioHeaderState {
  header: JSX.Element
  shouldShowWrappedBanner: boolean
  outageModal: JSX.Element
}

export function useHomeScreenPortfolioHeader(): HomeScreenPortfolioHeaderState {
  const activeAccount = useActiveAccountWithThrow()
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const { chains } = useEnabledChains()
  const { showEmptyWalletState, isTabsDataLoaded } = useHomeScreenState()
  const [hasIntroCards, setHasIntroCards] = useState(false)

  const isWrappedBannerEnabled = useFeatureFlag(FeatureFlags.UniswapWrapped2025)
  const isNotificationServiceEnabledFlag = useFeatureFlag(FeatureFlags.NotificationService)
  const isNotificationServiceEnabled =
    getIsNotificationServiceLocalOverrideEnabled() || isNotificationServiceEnabledFlag

  const hasDismissedWrappedBanner = useSelector(selectHasDismissedUniswapWrapped2025Banner)
  const shouldShowWrappedBanner = isWrappedBannerEnabled && !hasDismissedWrappedBanner

  const isSignerAccount = activeAccount.type === AccountType.SignerMnemonic
  const viewOnlyLabel = t('home.warning.viewOnly')

  const { error: portfolioError, dataUpdatedAt: portfolioDataUpdatedAt } = usePortfolioTotalValue({
    evmAddress: activeAccount.address,
    chainIds: chains,
  })

  const [isOutageSheetOpen, setIsOutageSheetOpen] = useState(false)
  const handleOutageBannerPress = useEvent(() => setIsOutageSheetOpen(true))
  const handleOutageSheetClose = useEvent(() => setIsOutageSheetOpen(false))

  const handleDismissWrappedBanner = useCallback(() => {
    dispatch(setHasDismissedUniswapWrapped2025Banner(true))
  }, [dispatch])

  const handlePressWrappedBanner = useCallback(async () => {
    try {
      const url = buildWrappedUrl(UNISWAP_WEB_URL, activeAccount.address)
      await openUri({ uri: url, openExternalBrowser: true })
      dispatch(setHasDismissedUniswapWrapped2025Banner(true))
    } catch (error) {
      logger.error(error, { tags: { file: 'useHomeScreenPortfolioHeader', function: 'handlePressWrappedBanner' } })
    }
  }, [activeAccount.address, dispatch])

  const handleIntroCardsChange = useCallback((hasCards: boolean) => {
    setHasIntroCards(hasCards)
  }, [])

  const onPressViewOnlyLabel = useCallback(() => navigate(ModalName.ViewOnlyExplainer), [])

  const promoBanner = useMemo(
    () =>
      isNotificationServiceEnabled ? (
        <MobileNotificationServiceManager isLoading={!isTabsDataLoaded} onCardsChange={handleIntroCardsChange} />
      ) : (
        <OnboardingIntroCardStack
          isLoading={!isTabsDataLoaded}
          showEmptyWalletState={showEmptyWalletState}
          onCardsChange={handleIntroCardsChange}
        />
      ),
    [showEmptyWalletState, isTabsDataLoaded, isNotificationServiceEnabled, handleIntroCardsChange],
  )

  const header = useMemo(
    () => (
      <Flex
        pointerEvents="box-none"
        backgroundColor="$surface1"
        pb={hasIntroCards ? '$none' : showEmptyWalletState ? '$spacing8' : '$spacing16'}
        px="$none"
      >
        {portfolioError && <DataApiOutageBanner onPress={handleOutageBannerPress} />}
        {shouldShowWrappedBanner && (
          <Flex>
            <UniswapWrapped2025Banner
              handleDismiss={handleDismissWrappedBanner}
              handlePress={handlePressWrappedBanner}
            />
            <Flex
              height="$spacing24"
              width="100%"
              mt={-24}
              backgroundColor="$surface1"
              borderTopLeftRadius={24}
              borderTopRightRadius={24}
            />
          </Flex>
        )}
        <AccountHeader />
        <PortfolioOverview evmAddress={activeAccount.address} chainIds={chains} />
        {isSignerAccount ? (
          <HomeScreenQuickActions />
        ) : (
          <TouchableArea mt="$spacing8" onPress={onPressViewOnlyLabel}>
            <Flex centered row backgroundColor="$surface2" borderRadius="$rounded12" minHeight={40} p="$spacing8">
              <Text color="$neutral2" variant="body2">
                {viewOnlyLabel}
              </Text>
            </Flex>
          </TouchableArea>
        )}
        <HomeScreenEarningSection evmAddress={activeAccount.address} mt="$spacing16" mx="$spacing20" />
        {promoBanner}
      </Flex>
    ),
    [
      hasIntroCards,
      showEmptyWalletState,
      chains,
      shouldShowWrappedBanner,
      handleDismissWrappedBanner,
      handlePressWrappedBanner,
      activeAccount.address,
      portfolioError,
      handleOutageBannerPress,
      isSignerAccount,
      onPressViewOnlyLabel,
      viewOnlyLabel,
      promoBanner,
    ],
  )

  const outageModal = (
    <DataApiOutageModalContent
      isOpen={isOutageSheetOpen}
      lastUpdatedAt={portfolioDataUpdatedAt}
      onClose={handleOutageSheetClose}
    />
  )

  return { header, shouldShowWrappedBanner, outageModal }
}
