import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { BRIDGING_BANNER, UNICHAIN_BANNER_COLD, UNICHAIN_BANNER_WARM } from 'ui/src/assets'
import { Person } from 'ui/src/components/icons'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { selectHasViewedBridgingBanner } from 'uniswap/src/features/behaviorHistory/selectors'
import {
  setHasDismissedUnichainColdBanner,
  setHasDismissedUnichainWarmBanner,
  setHasViewedBridgingBanner,
} from 'uniswap/src/features/behaviorHistory/slice'
import { useNumBridgingChains } from 'uniswap/src/features/bridging/hooks/chains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { OnboardingCardLoggingName } from 'uniswap/src/features/telemetry/types'
import { useUnichainPromoVisibility } from 'uniswap/src/features/unichain/hooks/useUnichainPromoVisibility'
import { UNITAG_SUFFIX_NO_LEADING_DOT } from 'uniswap/src/features/unitags/constants'
import { CurrencyField } from 'uniswap/src/types/currency'
import { CardType, IntroCardGraphicType, IntroCardProps } from 'wallet/src/components/introCards/IntroCard'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { selectHasSkippedUnitagPrompt } from 'wallet/src/features/behaviorHistory/selectors'
import { useCanActiveAddressClaimUnitag, useHasAnyAccountsWithUnitag } from 'wallet/src/features/unitags/hooks'
import { useUnitagClaimHandler } from 'wallet/src/features/unitags/useUnitagClaimHandler'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

type SharedIntroCardsProps = {
  showUnichainModal: () => void
  navigateToUnitagClaim: () => void
  navigateToUnitagIntro: () => void
}

type SharedIntroCardReturn = {
  cards: IntroCardProps[]
  shouldPromptUnitag: boolean
  shouldShowBridgingBanner: boolean
}

export function useSharedIntroCards({
  navigateToUnitagClaim,
  navigateToUnitagIntro,
  showUnichainModal,
}: SharedIntroCardsProps): SharedIntroCardReturn {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const activeAccount = useActiveAccountWithThrow()
  const isSignerAccount = activeAccount.type === AccountType.SignerMnemonic
  const claimUnitagEnabled = useFeatureFlag(FeatureFlags.ExtensionClaimUnitag)

  const { data: totalValueData } = usePortfolioTotalValue({
    address: activeAccount.address,
    // Not needed often given usage, and will get updated from other sources
    pollInterval: PollingInterval.Slow,
  })
  const hasTokens = (totalValueData?.balanceUSD ?? 0) > 0

  const hasSkippedUnitagPrompt = useSelector(selectHasSkippedUnitagPrompt)
  const { canClaimUnitag } = useCanActiveAddressClaimUnitag()
  const { handleClaim: handleUnitagClaim, handleDismiss: handleUnitagDismiss } = useUnitagClaimHandler({
    analyticsEntryPoint: 'home',
    navigateToClaim: navigateToUnitagClaim,
    navigateToIntro: navigateToUnitagIntro,
  })

  const hasAnyUnitags = useHasAnyAccountsWithUnitag()
  const shouldPromptUnitag = isSignerAccount && !hasSkippedUnitagPrompt && canClaimUnitag && !hasAnyUnitags

  const hasViewedBridgingBanner = useSelector(selectHasViewedBridgingBanner)
  const { navigateToSwapFlow } = useWalletNavigation()
  const numBridgingChains = useNumBridgingChains()
  const handleBridgingDismiss = useCallback(
    (shouldNavigate: boolean) => {
      if (shouldNavigate) {
        navigateToSwapFlow({ openTokenSelector: CurrencyField.OUTPUT })
      } else {
        dispatch(setHasViewedBridgingBanner(true))
      }
    },
    [dispatch, navigateToSwapFlow],
  )
  const shouldShowBridgingBanner = isSignerAccount && !hasViewedBridgingBanner && hasTokens

  const bridgingCard = useMemo(() => {
    return {
      loggingName: OnboardingCardLoggingName.BridgingBanner,
      graphic: {
        type: IntroCardGraphicType.Image as const,
        image: BRIDGING_BANNER,
      },
      title: t('swap.bridging.title'),
      description: t('onboarding.home.intro.bridging.description', { count: numBridgingChains }),
      cardType: CardType.Dismissible,
      onPress: () => handleBridgingDismiss(true),
      onClose: () => handleBridgingDismiss(false),
    }
  }, [handleBridgingDismiss, numBridgingChains, t])

  const { shouldShowUnichainBannerCold, shouldShowUnichainBannerWarm } = useUnichainPromoVisibility()

  const unichainBannerCold = useMemo(() => {
    return {
      loggingName: OnboardingCardLoggingName.UnichainBannerCold,
      isNew: true,
      graphic: {
        type: IntroCardGraphicType.Image as const,
        image: UNICHAIN_BANNER_COLD,
      },
      title: t('unichain.promotion.cold.title'),
      description: t('unichain.promotion.cold.description'),
      cardType: CardType.Dismissible,
      onPress: showUnichainModal,
      onClose: (): void => {
        dispatch(setHasDismissedUnichainColdBanner(true))
      },
    }
  }, [dispatch, showUnichainModal, t])

  const unichainBannerWarm = useMemo(() => {
    return {
      loggingName: OnboardingCardLoggingName.UnichainBannerWarm,
      isNew: true,
      graphic: {
        type: IntroCardGraphicType.Image as const,
        image: UNICHAIN_BANNER_WARM,
      },
      title: t('unichain.promotion.warm.title'),
      description: t('unichain.promotion.warm.description'),
      cardType: CardType.Dismissible,
      onPress: (): void => {
        navigateToSwapFlow({ openTokenSelector: CurrencyField.OUTPUT, inputChainId: UniverseChainId.Unichain })
        dispatch(setHasDismissedUnichainWarmBanner(true))
      },
      onClose: (): void => {
        dispatch(setHasDismissedUnichainWarmBanner(true))
      },
    }
  }, [dispatch, navigateToSwapFlow, t])

  return useMemo(() => {
    const output: IntroCardProps[] = []

    if (shouldPromptUnitag && claimUnitagEnabled) {
      output.push({
        loggingName: OnboardingCardLoggingName.ClaimUnitag,
        graphic: {
          type: IntroCardGraphicType.Icon,
          Icon: Person,
        },
        title: t('onboarding.home.intro.unitag.title', {
          unitagDomain: UNITAG_SUFFIX_NO_LEADING_DOT,
        }),
        description: t('onboarding.home.intro.unitag.description'),
        cardType: CardType.Dismissible,
        onPress: () => handleUnitagClaim(),
        onClose: () => handleUnitagDismiss(),
      })
    }

    if (shouldShowUnichainBannerCold) {
      output.push(unichainBannerCold)
    }

    if (shouldShowUnichainBannerWarm) {
      output.push(unichainBannerWarm)
    }

    if (shouldShowBridgingBanner) {
      output.push(bridgingCard)
    }

    return {
      cards: output,
      shouldShowBridgingBanner,
      shouldPromptUnitag,
    }
  }, [
    shouldPromptUnitag,
    claimUnitagEnabled,
    shouldShowUnichainBannerCold,
    shouldShowUnichainBannerWarm,
    shouldShowBridgingBanner,
    t,
    handleUnitagClaim,
    handleUnitagDismiss,
    unichainBannerCold,
    unichainBannerWarm,
    bridgingCard,
  ])
}
