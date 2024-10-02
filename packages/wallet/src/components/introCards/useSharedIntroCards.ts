import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Person } from 'ui/src/components/icons'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { OnboardingCardLoggingName } from 'uniswap/src/features/telemetry/types'
import { CardType } from 'wallet/src/components/introCards/IntroCard'
import { IntroCardWrapper } from 'wallet/src/components/introCards/IntroCardStack'
import { selectHasSkippedUnitagPrompt } from 'wallet/src/features/behaviorHistory/selectors'
import { UNITAG_SUFFIX_NO_LEADING_DOT } from 'wallet/src/features/unitags/constants'
import { useCanActiveAddressClaimUnitag } from 'wallet/src/features/unitags/hooks'
import { useUnitagClaimHandler } from 'wallet/src/features/unitags/useUnitagClaimHandler'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

export type IntroCardWithLogging = IntroCardWrapper & {
  loggingName: OnboardingCardLoggingName
}

type useSharedIntroCardsProps = {
  navigateToUnitagClaim: () => void
  navigateToUnitagIntro: () => void
}

export function useSharedIntroCards({
  navigateToUnitagClaim,
  navigateToUnitagIntro,
}: useSharedIntroCardsProps): IntroCardWithLogging[] {
  const { t } = useTranslation()
  const activeAccount = useActiveAccountWithThrow()
  const claimUnitagEnabled = useFeatureFlag(FeatureFlags.ExtensionClaimUnitag)

  const hasSkippedUnitagPrompt = useSelector(selectHasSkippedUnitagPrompt)
  const { canClaimUnitag } = useCanActiveAddressClaimUnitag()
  const { handleClaim: handleUnitagClaim, handleDismiss: handleUnitagDismiss } = useUnitagClaimHandler({
    analyticsEntryPoint: 'home',
    navigateToClaim: navigateToUnitagClaim,
    navigateToIntro: navigateToUnitagIntro,
  })

  const shouldPromptUnitag =
    activeAccount.type === AccountType.SignerMnemonic && !hasSkippedUnitagPrompt && canClaimUnitag

  return useMemo(() => {
    const output: IntroCardWithLogging[] = []

    if (shouldPromptUnitag && claimUnitagEnabled) {
      output.push({
        loggingName: OnboardingCardLoggingName.ClaimUnitag,
        Icon: Person,
        title: t('onboarding.home.intro.unitag.title', {
          unitagDomain: UNITAG_SUFFIX_NO_LEADING_DOT,
        }),
        description: t('onboarding.home.intro.unitag.description'),
        cardType: CardType.Dismissible,
        onPress: () => handleUnitagClaim(),
        onClose: () => handleUnitagDismiss(),
      })
    }

    return output
  }, [claimUnitagEnabled, shouldPromptUnitag, handleUnitagClaim, handleUnitagDismiss, t])
}
