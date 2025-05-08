import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Person } from 'ui/src/components/icons'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { OnboardingCardLoggingName } from 'uniswap/src/features/telemetry/types'
import { UNITAG_SUFFIX_NO_LEADING_DOT } from 'uniswap/src/features/unitags/constants'
import { CardType, IntroCardGraphicType, IntroCardProps } from 'wallet/src/components/introCards/IntroCard'
import { selectHasSkippedUnitagPrompt } from 'wallet/src/features/behaviorHistory/selectors'
import { useCanActiveAddressClaimUnitag } from 'wallet/src/features/unitags/hooks/useCanActiveAddressClaimUnitag'
import { useHasAnyAccountsWithUnitag } from 'wallet/src/features/unitags/hooks/useHasAnyAccountsWithUnitag'
import { useUnitagClaimHandler } from 'wallet/src/features/unitags/useUnitagClaimHandler'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

type SharedIntroCardsProps = {
  navigateToUnitagClaim: () => void
  navigateToUnitagIntro: () => void
}

type SharedIntroCardReturn = {
  cards: IntroCardProps[]
  shouldPromptUnitag: boolean
}

export function useSharedIntroCards({
  navigateToUnitagClaim,
  navigateToUnitagIntro,
}: SharedIntroCardsProps): SharedIntroCardReturn {
  const { t } = useTranslation()
  const activeAccount = useActiveAccountWithThrow()
  const isSignerAccount = activeAccount.type === AccountType.SignerMnemonic

  const hasSkippedUnitagPrompt = useSelector(selectHasSkippedUnitagPrompt)
  const { canClaimUnitag } = useCanActiveAddressClaimUnitag()
  const { handleClaim: handleUnitagClaim, handleDismiss: handleUnitagDismiss } = useUnitagClaimHandler({
    analyticsEntryPoint: 'home',
    navigateToClaim: navigateToUnitagClaim,
    navigateToIntro: navigateToUnitagIntro,
  })

  const hasAnyUnitags = useHasAnyAccountsWithUnitag()
  const shouldPromptUnitag = isSignerAccount && !hasSkippedUnitagPrompt && canClaimUnitag && !hasAnyUnitags

  return useMemo(() => {
    const output: IntroCardProps[] = []

    if (shouldPromptUnitag) {
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

    return {
      cards: output,
      shouldPromptUnitag,
    }
  }, [shouldPromptUnitag, t, handleUnitagClaim, handleUnitagDismiss])
}
