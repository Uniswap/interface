import { SharedEventName } from '@uniswap/analytics-events'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { FundWalletModal } from 'src/components/home/introCards/FundWalletModal'
import { openModal } from 'src/features/modals/modalSlice'
import {
  NotificationPermission,
  useNotificationOSPermissionsEnabled,
} from 'src/features/notifications/hooks/useNotificationOSPermissionsEnabled'
import { Flex } from 'ui/src'
import { PUSH_NOTIFICATIONS_CARD_BANNER } from 'ui/src/assets'
import { Buy, ShieldCheck } from 'ui/src/components/icons'
import { UnichainIntroModal } from 'uniswap/src/components/unichain/UnichainIntroModal'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { ElementName, ModalName, WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { OnboardingCardLoggingName } from 'uniswap/src/features/telemetry/types'
import { CurrencyField } from 'uniswap/src/types/currency'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { MobileScreens, OnboardingScreens, UnitagScreens } from 'uniswap/src/types/screens/mobile'
import {
  CardType,
  IntroCardGraphicType,
  IntroCardProps,
  isOnboardingCardLoggingName,
} from 'wallet/src/components/introCards/IntroCard'
import { INTRO_CARD_MIN_HEIGHT, IntroCardStack } from 'wallet/src/components/introCards/IntroCardStack'
import { useSharedIntroCards } from 'wallet/src/components/introCards/useSharedIntroCards'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { selectHasViewedNotificationsCard } from 'wallet/src/features/behaviorHistory/selectors'
import { setHasViewedNotificationsCard } from 'wallet/src/features/behaviorHistory/slice'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

type OnboardingIntroCardStackProps = {
  isLoading?: boolean
  showEmptyWalletState: boolean
}
export function OnboardingIntroCardStack({
  showEmptyWalletState,
  isLoading = false,
}: OnboardingIntroCardStackProps): JSX.Element | null {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const activeAccount = useActiveAccountWithThrow()
  const address = activeAccount.address
  const isSignerAccount = activeAccount.type === AccountType.SignerMnemonic
  const hasBackups = activeAccount.backups && activeAccount.backups.length > 0

  const { notificationPermissionsEnabled } = useNotificationOSPermissionsEnabled()
  const notificationOnboardingCardEnabled = useFeatureFlag(FeatureFlags.NotificationOnboardingCard)
  const hasViewedNotificationsCard = useSelector(selectHasViewedNotificationsCard)
  const showEnableNotificationsCard =
    notificationOnboardingCardEnabled &&
    notificationPermissionsEnabled === NotificationPermission.Disabled &&
    !hasViewedNotificationsCard

  const { navigateToSwapFlow } = useWalletNavigation()

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

  const [showFundModal, setShowFundModal] = useState(false)
  const [showUnichainIntroModal, setShowUnichainIntroModal] = useState(false)

  const { cards: sharedCards } = useSharedIntroCards({
    showUnichainModal: () => setShowUnichainIntroModal(true),
    navigateToUnitagClaim,
    navigateToUnitagIntro,
  })

  const cards = useMemo((): IntroCardProps[] => {
    const output: IntroCardProps[] = []

    // Don't show cards for view only wallets
    if (!isSignerAccount) {
      return output
    }

    if (showEmptyWalletState) {
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

    if (!hasBackups) {
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

    if (showEnableNotificationsCard) {
      output.push({
        loggingName: OnboardingCardLoggingName.EnablePushNotifications,
        graphic: {
          type: IntroCardGraphicType.Image,
          image: PUSH_NOTIFICATIONS_CARD_BANNER,
        },
        title: t('onboarding.home.intro.pushNotifications.title'),
        description: t('onboarding.home.intro.pushNotifications.description'),
        cardType: CardType.Dismissible,
        onPress: (): void => {
          navigate(ModalName.NotificationsOSSettings)
          dispatch(setHasViewedNotificationsCard(true))
          sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
            element: ElementName.OnboardingIntroCardEnablePushNotifications,
          })
        },
        onClose: (): void => {
          dispatch(setHasViewedNotificationsCard(true))
        },
      })
    }
    return output
  }, [hasBackups, showEmptyWalletState, isSignerAccount, sharedCards, t, showEnableNotificationsCard, dispatch])

  const handleSwiped = useCallback(
    (_card: IntroCardProps, index: number) => {
      const loggingName = cards[index]?.loggingName
      if (loggingName && isOnboardingCardLoggingName(loggingName)) {
        sendAnalyticsEvent(WalletEventName.OnboardingIntroCardSwiped, {
          card_name: loggingName,
        })
      }
    },
    [cards],
  )

  const UnichainIntroModalInstance = useMemo((): JSX.Element => {
    return (
      <UnichainIntroModal
        openSwapFlow={() =>
          navigateToSwapFlow({ openTokenSelector: CurrencyField.OUTPUT, outputChainId: UniverseChainId.Unichain })
        }
        onClose={() => setShowUnichainIntroModal(false)}
      />
    )
  }, [navigateToSwapFlow])

  if (cards.length) {
    return (
      <Flex pt="$spacing12">
        {isLoading ? <Flex height={INTRO_CARD_MIN_HEIGHT} /> : <IntroCardStack cards={cards} onSwiped={handleSwiped} />}

        {showFundModal && <FundWalletModal onClose={() => setShowFundModal(false)} />}
        {showUnichainIntroModal && UnichainIntroModalInstance}
      </Flex>
    )
  }

  if (showUnichainIntroModal) {
    return UnichainIntroModalInstance
  }

  return null
}
