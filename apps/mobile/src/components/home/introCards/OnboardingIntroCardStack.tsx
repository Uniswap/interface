import { SharedEventName } from '@uniswap/analytics-events'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import {
  NotificationPermission,
  useNotificationOSPermissionsEnabled,
} from 'src/features/notifications/hooks/useNotificationOSPermissionsEnabled'
import { Flex } from 'ui/src'
import { BRIDGED_ASSETS_CARD_BANNER, PUSH_NOTIFICATIONS_CARD_BANNER } from 'ui/src/assets'
import { Buy } from 'ui/src/components/icons'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
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
import {
  selectHasViewedBridgedAssetsCard,
  selectHasViewedNotificationsCard,
} from 'wallet/src/features/behaviorHistory/selectors'
import { setHasViewedBridgedAssetsCard, setHasViewedNotificationsCard } from 'wallet/src/features/behaviorHistory/slice'
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

  const { notificationPermissionsEnabled } = useNotificationOSPermissionsEnabled()
  const notificationOnboardingCardEnabled = useFeatureFlag(FeatureFlags.NotificationOnboardingCard)
  const hasViewedNotificationsCard = useSelector(selectHasViewedNotificationsCard)
  const showEnableNotificationsCard =
    notificationOnboardingCardEnabled &&
    notificationPermissionsEnabled === NotificationPermission.Disabled &&
    !hasViewedNotificationsCard

  const hasViewedBridgedAssetCard = useSelector(selectHasViewedBridgedAssetsCard)
  const shouldShowBridgedAssetCard = useFeatureFlag(FeatureFlags.BridgedAssetsBanner) && !hasViewedBridgedAssetCard

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
    navigate(ModalName.UnitagsIntro, {
      address,
      entryPoint: MobileScreens.Home,
    })
  }, [address])

  const navigateToBackupFlow = useCallback((): void => {
    navigate(MobileScreens.OnboardingStack, {
      screen: OnboardingScreens.Backup,
      params: {
        importType: ImportType.BackupOnly,
        entryPoint: OnboardingEntryPoint.BackupCard,
      },
    })
  }, [])

  const navigateToBridgedAssetSwap = useCallback((): void => {
    navigateToSwapFlow({ openTokenSelector: CurrencyField.OUTPUT, inputChainId: UniverseChainId.Unichain })
  }, [navigateToSwapFlow])

  const { cards: sharedCards } = useSharedIntroCards({
    navigateToUnitagClaim,
    navigateToUnitagIntro,
    navigateToBackupFlow,
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
          navigate(ModalName.FundWallet)
          sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
            element: ElementName.OnboardingIntroCardFundWallet,
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

    if (shouldShowBridgedAssetCard) {
      output.push({
        loggingName: OnboardingCardLoggingName.BridgedAsset,
        graphic: {
          type: IntroCardGraphicType.Image,
          image: BRIDGED_ASSETS_CARD_BANNER,
        },
        title: t('onboarding.home.intro.bridgedAssets.title'),
        description: t('onboarding.home.intro.bridgedAssets.description'),
        cardType: CardType.Dismissible,
        onPress: () => {
          navigateToBridgedAssetSwap()
          dispatch(setHasViewedBridgedAssetsCard(true))
        },
        onClose: () => {
          dispatch(setHasViewedBridgedAssetsCard(true))
        },
      })
    }

    return output
  }, [
    showEmptyWalletState,
    isSignerAccount,
    sharedCards,
    t,
    dispatch,
    navigateToBridgedAssetSwap,
    shouldShowBridgedAssetCard,
    showEnableNotificationsCard,
  ])

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

  if (cards.length) {
    return (
      <Flex pt="$spacing12" px="$spacing12">
        {isLoading ? <Flex height={INTRO_CARD_MIN_HEIGHT} /> : <IntroCardStack cards={cards} onSwiped={handleSwiped} />}
      </Flex>
    )
  }

  return null
}
