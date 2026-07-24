import { useIsFocused } from '@react-navigation/native'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { getIsNotificationServiceLocalOverrideEnabled } from '@universe/notifications'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { navigate } from 'src/app/navigation/rootNavigation'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { OnboardingIntroCardStack } from 'src/components/home/introCards/OnboardingIntroCardStack'
import { PortfolioOverview } from 'src/components/home/PortfolioChart/PortfolioOverview'
import { MobileNotificationServiceManager } from 'src/notification-service/MobileNotificationServiceManager'
import { HomeScreenQuickActions } from 'src/screens/HomeScreen/HomeScreenQuickActions'
import { useHomeScreenState } from 'src/screens/HomeScreen/useHomeScreenState'
import { Flex, Text, TouchableArea } from 'ui/src'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { DataApiOutageBanner } from 'uniswap/src/features/dataApi/outage/DataApiOutageBanner'
import { DataApiOutageModalContent } from 'uniswap/src/features/dataApi/outage/DataApiOutageModalContent'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'
import { HomeScreenEarningSection } from 'wallet/src/features/earn/HomeScreenEarningSection'
import { useCanActiveAddressClaimUnitag } from 'wallet/src/features/unitags/hooks/useCanActiveAddressClaimUnitag'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

interface HomeScreenPortfolioHeaderState {
  header: JSX.Element
  outageModal: JSX.Element
}

export function useHomeScreenPortfolioHeader(): HomeScreenPortfolioHeaderState {
  const activeAccount = useActiveAccountWithThrow()
  const { t } = useTranslation()
  const { chains } = useEnabledChains()
  const { showEmptyWalletState, isTabsDataLoaded } = useHomeScreenState()
  const [hasIntroCards, setHasIntroCards] = useState(false)

  const isNotificationServiceEnabledFlag = useFeatureFlag(FeatureFlags.NotificationService)
  const isNotificationServiceEnabled =
    getIsNotificationServiceLocalOverrideEnabled() || isNotificationServiceEnabledFlag

  const isSignerAccount = activeAccount.type === AccountType.SignerMnemonic
  const viewOnlyLabel = t('home.warning.viewOnly')

  const { error: portfolioError, dataUpdatedAt: portfolioDataUpdatedAt } = usePortfolioTotalValue({
    evmAddress: activeAccount.address,
    chainIds: chains,
  })

  const [isOutageSheetOpen, setIsOutageSheetOpen] = useState(false)
  const handleOutageBannerPress = useEvent(() => setIsOutageSheetOpen(true))
  const handleOutageSheetClose = useEvent(() => setIsOutageSheetOpen(false))

  const handleIntroCardsChange = useCallback((hasCards: boolean) => {
    setHasIntroCards(hasCards)
  }, [])

  const onPressViewOnlyLabel = useCallback(() => navigate(ModalName.ViewOnlyExplainer), [])

  // Home stays mounted while other tabs are active, and the unitag intro card can appear
  // asynchronously above the earn section — hold the one-time earn reveal until the screen
  // is focused and the welcome-card area has settled.
  const isFocused = useIsFocused()
  const { isLoading: isUnitagEligibilityLoading } = useCanActiveAddressClaimUnitag()
  const isEarnRevealReady = isFocused && isTabsDataLoaded && !isUnitagEligibilityLoading

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
        {promoBanner}
        <HomeScreenEarningSection
          evmAddress={activeAccount.address}
          isRevealReady={isEarnRevealReady}
          mb={hasIntroCards ? '$spacing8' : undefined}
          mt="$spacing16"
          mx="$spacing20"
        />
      </Flex>
    ),
    [
      hasIntroCards,
      showEmptyWalletState,
      chains,
      activeAccount.address,
      isEarnRevealReady,
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

  return { header, outageModal }
}
