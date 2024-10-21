import { SharedEventName } from '@uniswap/analytics-events'
import React, { useCallback, useMemo, useState } from 'react'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useDispatch, useSelector } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { FundWalletModal } from 'src/components/home/introCards/FundWalletModal'
import { UnitagBanner } from 'src/components/unitags/UnitagBanner'
import { openModal } from 'src/features/modals/modalSlice'
import { Flex } from 'ui/src'
import { Buy, ShieldCheck, UniswapLogo } from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { ElementName, ModalName, WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { OnboardingCardLoggingName } from 'uniswap/src/features/telemetry/types'
import { useTranslation } from 'uniswap/src/i18n'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { MobileScreens, OnboardingScreens, UnitagScreens } from 'uniswap/src/types/screens/mobile'
import { CardType, IntroCardGraphicType, IntroCardProps } from 'wallet/src/components/introCards/IntroCard'
import { INTRO_CARD_MIN_HEIGHT, IntroCardStack } from 'wallet/src/components/introCards/IntroCardStack'
import { useSharedIntroCards } from 'wallet/src/components/introCards/useSharedIntroCards'
import { selectHasViewedWelcomeWalletCard } from 'wallet/src/features/behaviorHistory/selectors'
import { setHasViewedWelcomeWalletCard } from 'wallet/src/features/behaviorHistory/slice'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

type OnboardingIntroCardStackProps = {
  onboardingRedesignHomeEnabled: boolean
  onboardingRedesignBackupEnabled: boolean
  isLoading?: boolean
  hasTokens: boolean
}
export function OnboardingIntroCardStack({
  onboardingRedesignHomeEnabled,
  onboardingRedesignBackupEnabled,
  hasTokens,
  isLoading = false,
}: OnboardingIntroCardStackProps): JSX.Element | null {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const activeAccount = useActiveAccountWithThrow()
  const address = activeAccount.address
  const isSignerAccount = activeAccount.type === AccountType.SignerMnemonic
  const hasBackups = activeAccount.backups && activeAccount.backups.length > 0

  const welcomeCardTitle = t('onboarding.home.intro.welcome.title')
  const hasViewedWelcomeWalletCard = useSelector(selectHasViewedWelcomeWalletCard)

  const navigateToUnitagClaim = useCallback(() => {
    navigate(MobileScreens.UnitagStack, {
      screen: UnitagScreens.ClaimUnitag,
      params: {
        entryPoint: MobileScreens.Home,
        address,
      },
    })
  }, [address])

  const navigateToUnitagIntro = useCallback(() => {
    dispatch(
      openModal({
        name: ModalName.UnitagsIntro,
        initialState: { address, entryPoint: MobileScreens.Home },
      }),
    )
  }, [dispatch, address])

  const {
    cards: sharedCards,
    shouldPromptUnitag,
    shouldShowBridgingBanner,
    bridgingCard,
  } = useSharedIntroCards({
    hasTokens,
    navigateToUnitagClaim,
    navigateToUnitagIntro,
  })

  const [showFundModal, setShowFundModal] = useState(false)

  const cards = useMemo((): IntroCardProps[] => {
    const output: IntroCardProps[] = []

    // Don't show cards for view only wallets
    if (!isSignerAccount) {
      return output
    }

    if (!onboardingRedesignHomeEnabled && !onboardingRedesignBackupEnabled) {
      // Push this even if the experiment isn't enabled
      // This is also added if the home experiment is enabled
      if (shouldShowBridgingBanner) {
        output.push(bridgingCard)
      }
      return output
    }

    if (!hasViewedWelcomeWalletCard) {
      output.push({
        loggingName: OnboardingCardLoggingName.WelcomeWallet,
        graphic: {
          type: IntroCardGraphicType.Icon,
          Icon: UniswapLogo,
          iconProps: {
            color: '$accent1',
          },
          iconContainerProps: {
            backgroundColor: '$accent2',
            borderRadius: '$rounded12',
          },
        },
        title: welcomeCardTitle,
        description: t('onboarding.home.intro.welcome.description'),
        cardType: CardType.Swipe,
      })
    }

    if (onboardingRedesignHomeEnabled && !hasTokens) {
      output.push({
        loggingName: OnboardingCardLoggingName.FundWallet,
        graphic: {
          type: IntroCardGraphicType.Icon,
          Icon: Buy,
        },
        title: t('onboarding.home.intro.fund.title'),
        description: t('onboarding.home.intro.fund.description'),
        cardType: CardType.Required,
        onPress: (): void => {
          setShowFundModal(true)
          sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
            element: ElementName.OnboardingIntroCardFundWallet,
          })
        },
      })
    }

    if (onboardingRedesignBackupEnabled && !hasBackups) {
      output.push({
        loggingName: OnboardingCardLoggingName.RecoveryBackup,
        graphic: {
          type: IntroCardGraphicType.Icon,
          Icon: ShieldCheck,
        },
        title: t('onboarding.home.intro.backup.title'),
        description: t('onboarding.home.intro.backup.description'),
        cardType: CardType.Required,
        onPress: (): void => {
          navigate(MobileScreens.OnboardingStack, {
            screen: OnboardingScreens.Backup,
            params: {
              importType: ImportType.BackupOnly,
              entryPoint: OnboardingEntryPoint.BackupCard,
            },
          })
        },
      })
    }

    output.push(...sharedCards)

    return output
  }, [
    bridgingCard,
    hasBackups,
    hasTokens,
    hasViewedWelcomeWalletCard,
    isSignerAccount,
    onboardingRedesignBackupEnabled,
    onboardingRedesignHomeEnabled,
    sharedCards,
    shouldShowBridgingBanner,
    t,
    welcomeCardTitle,
  ])

  const handleSwiped = useCallback(
    (_card: IntroCardProps, index: number) => {
      const loggingName = cards[index]?.loggingName
      if (loggingName) {
        sendAnalyticsEvent(WalletEventName.OnboardingIntroCardSwiped, {
          card_name: loggingName,
        })
      }

      if (!hasViewedWelcomeWalletCard && cards[index]?.title === welcomeCardTitle) {
        dispatch(setHasViewedWelcomeWalletCard(true))
      }
    },
    [cards, dispatch, hasViewedWelcomeWalletCard, welcomeCardTitle],
  )

  if (cards.length) {
    return (
      <Flex pt="$spacing12">
        {isLoading ? <Flex height={INTRO_CARD_MIN_HEIGHT} /> : <IntroCardStack cards={cards} onSwiped={handleSwiped} />}

        {showFundModal && <FundWalletModal onClose={() => setShowFundModal(false)} />}
      </Flex>
    )
  } else if (shouldPromptUnitag) {
    return (
      <AnimatedFlex entering={FadeIn} exiting={FadeOut}>
        <UnitagBanner address={activeAccount.address} entryPoint={MobileScreens.Home} />
      </AnimatedFlex>
    )
  }

  return null
}
