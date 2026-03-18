import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useIsDarkMode } from 'ui/src'
import {
  NO_FEES_ICON,
  NO_UNISWAP_INTERFACE_FEES_BANNER_DARK,
  NO_UNISWAP_INTERFACE_FEES_BANNER_LIGHT,
} from 'ui/src/assets'
import { Person, ShieldCheck } from 'ui/src/components/icons'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { OnboardingCardLoggingName } from 'uniswap/src/features/telemetry/types'
import { UNITAG_SUFFIX_NO_LEADING_DOT } from 'uniswap/src/features/unitags/constants'
import { buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { isExtensionApp } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'
import { CardType, IntroCardGraphicType, IntroCardProps } from 'wallet/src/components/introCards/IntroCard'
import {
  selectHasDismissedNoAppFeesAnnouncement,
  selectHasSkippedUnitagPrompt,
} from 'wallet/src/features/behaviorHistory/selectors'
import { setHasDismissedNoAppFeesAnnouncement } from 'wallet/src/features/behaviorHistory/slice'
import { useCanActiveAddressClaimUnitag } from 'wallet/src/features/unitags/hooks/useCanActiveAddressClaimUnitag'
import { useHasAnyAccountsWithUnitag } from 'wallet/src/features/unitags/hooks/useHasAnyAccountsWithUnitag'
import { useUnitagClaimHandler } from 'wallet/src/features/unitags/useUnitagClaimHandler'
import { hasExternalBackup } from 'wallet/src/features/wallet/accounts/utils'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

type SharedIntroCardsProps = {
  navigateToUnitagClaim: () => void
  navigateToUnitagIntro: () => void
  navigateToBackupFlow: () => void
}

type SharedIntroCardReturn = {
  cards: IntroCardProps[]
  shouldPromptUnitag: boolean
}

export function useSharedIntroCards({
  navigateToUnitagClaim,
  navigateToUnitagIntro,
  navigateToBackupFlow,
}: SharedIntroCardsProps): SharedIntroCardReturn {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const activeAccount = useActiveAccountWithThrow()
  const isSignerAccount = activeAccount.type === AccountType.SignerMnemonic
  const isDarkMode = useIsDarkMode()

  const externalBackups = hasExternalBackup(activeAccount)

  const hasSkippedUnitagPrompt = useSelector(selectHasSkippedUnitagPrompt)
  const { canClaimUnitag } = useCanActiveAddressClaimUnitag()
  const { handleClaim: handleUnitagClaim, handleDismiss: handleUnitagDismiss } = useUnitagClaimHandler({
    analyticsEntryPoint: 'home',
    navigateToClaim: navigateToUnitagClaim,
    navigateToIntro: navigateToUnitagIntro,
  })

  const hasAnyUnitags = useHasAnyAccountsWithUnitag()
  const shouldPromptUnitag = isSignerAccount && !hasSkippedUnitagPrompt && canClaimUnitag && !hasAnyUnitags

  // No app fees announcement state
  const { navigateToSwapFlow } = useUniswapContext()
  const handleNavigateToSwapFlow = useEvent(() =>
    navigateToSwapFlow({ inputCurrencyId: buildNativeCurrencyId(UniverseChainId.Mainnet) }),
  )
  const isNoAppFeesAnnouncementEnabled = useFeatureFlag(FeatureFlags.NoUniswapInterfaceFees)
  const isNoAppFeesCardDismissed = useSelector(selectHasDismissedNoAppFeesAnnouncement)

  const handleNoAppFeesCardDismiss = useCallback(() => {
    dispatch(setHasDismissedNoAppFeesAnnouncement(true))
  }, [dispatch])

  return useMemo(() => {
    const output: IntroCardProps[] = []

    // No app fees announcement card
    if (isNoAppFeesAnnouncementEnabled && !isNoAppFeesCardDismissed) {
      output.push({
        loggingName: OnboardingCardLoggingName.NoAppFeesAnnouncement,
        graphic: {
          type: IntroCardGraphicType.Gradient,
          icon: NO_FEES_ICON,
          gradientImage: isDarkMode ? NO_UNISWAP_INTERFACE_FEES_BANNER_DARK : NO_UNISWAP_INTERFACE_FEES_BANNER_LIGHT,
        },
        title: t('notification.noAppFees.title'),
        description: t('notification.noAppFees.subtitle'),
        cardType: CardType.Dismissible,
        onPress: handleNavigateToSwapFlow,
        onClose: handleNoAppFeesCardDismiss,
      })
    }

    if (!externalBackups) {
      output.push({
        loggingName: OnboardingCardLoggingName.RecoveryBackup,
        graphic: {
          type: IntroCardGraphicType.Icon,
          Icon: ShieldCheck,
        },
        title: t('onboarding.home.intro.backup.title'),
        description: isExtensionApp
          ? t('onboarding.home.intro.backup.description.extension')
          : t('onboarding.home.intro.backup.description.mobile'),
        cardType: CardType.Required,
        onPress: navigateToBackupFlow,
      })
    }

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
  }, [
    isDarkMode,
    isNoAppFeesAnnouncementEnabled,
    isNoAppFeesCardDismissed,
    externalBackups,
    shouldPromptUnitag,
    t,
    navigateToBackupFlow,
    handleUnitagClaim,
    handleUnitagDismiss,
    handleNavigateToSwapFlow,
    handleNoAppFeesCardDismiss,
  ])
}
