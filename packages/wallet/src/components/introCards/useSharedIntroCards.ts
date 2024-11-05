import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { BRIDGING_BANNER } from 'ui/src/assets'
import { Person } from 'ui/src/components/icons'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { selectHasViewedBridgingBanner } from 'uniswap/src/features/behaviorHistory/selectors'
import { setHasViewedBridgingBanner } from 'uniswap/src/features/behaviorHistory/slice'
import { useNumBridgingChains } from 'uniswap/src/features/bridging/hooks/chains'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { OnboardingCardLoggingName } from 'uniswap/src/features/telemetry/types'
import { CurrencyField } from 'uniswap/src/types/currency'
import { CardType, IntroCardGraphicType, IntroCardProps } from 'wallet/src/components/introCards/IntroCard'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { selectHasSkippedUnitagPrompt } from 'wallet/src/features/behaviorHistory/selectors'
import { UNITAG_SUFFIX_NO_LEADING_DOT } from 'wallet/src/features/unitags/constants'
import { useCanActiveAddressClaimUnitag, useHasAnyAccountsWithUnitag } from 'wallet/src/features/unitags/hooks'
import { useUnitagClaimHandler } from 'wallet/src/features/unitags/useUnitagClaimHandler'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

type SharedIntroCardsProps = {
  hasTokens: boolean
  navigateToUnitagClaim: () => void
  navigateToUnitagIntro: () => void
}

type SharedIntroCardReturn = {
  cards: IntroCardProps[]
  bridgingCard: IntroCardProps
  shouldPromptUnitag: boolean
  shouldShowBridgingBanner: boolean
}

export function useSharedIntroCards({
  navigateToUnitagClaim,
  navigateToUnitagIntro,
  hasTokens,
}: SharedIntroCardsProps): SharedIntroCardReturn {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const activeAccount = useActiveAccountWithThrow()
  const isSignerAccount = activeAccount.type === AccountType.SignerMnemonic
  const claimUnitagEnabled = useFeatureFlag(FeatureFlags.ExtensionClaimUnitag)

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
  const bridgingEnabled = useFeatureFlag(FeatureFlags.Bridging)
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
  const shouldShowBridgingBanner = isSignerAccount && bridgingEnabled && !hasViewedBridgingBanner && hasTokens

  const bridgingCard = useMemo(() => {
    return {
      loggingName: OnboardingCardLoggingName.BridgingBanner,
      isNew: true,
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

    if (shouldShowBridgingBanner) {
      output.push(bridgingCard)
    }

    return {
      cards: output,
      bridgingCard,
      shouldShowBridgingBanner,
      shouldPromptUnitag,
    }
  }, [
    shouldPromptUnitag,
    claimUnitagEnabled,
    shouldShowBridgingBanner,
    t,
    handleUnitagClaim,
    handleUnitagDismiss,
    bridgingCard,
  ])
}
