import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Button, Flex, Text, TouchableArea } from 'ui/src'
import { Feedback, LikeSquare, MessageText, X } from 'ui/src/components/icons'
import { IconSizeTokens, zIndexes } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName, WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { appRatingPromptedMsSelector, appRatingProvidedMsSelector } from 'wallet/src/features/wallet/selectors'
import { setAppRating } from 'wallet/src/features/wallet/slice'

interface AppRatingModalProps {
  onClose: () => void
}

enum State {
  Initial = 0,
  NotReally = 1,
  Yes = 2,
}

export default function AppRatingModal({ onClose }: AppRatingModalProps): JSX.Element | null {
  const { t } = useTranslation()
  const [state, setState] = useState(State.Initial)
  const dispatch = useDispatch()
  const appRatingPromptedMs = useSelector(appRatingPromptedMsSelector)
  const appRatingProvidedMs = useSelector(appRatingProvidedMsSelector)

  const close = (): void => {
    sendAnalyticsEvent(WalletEventName.AppRating, {
      type: 'close',
      appRatingPromptedMs,
      appRatingProvidedMs,
    })
    onClose()
  }

  const onRemindLater = (): void => {
    sendAnalyticsEvent(WalletEventName.AppRating, {
      type: 'remind',
      appRatingPromptedMs,
      appRatingProvidedMs,
    })
    onClose()
  }

  const stateConfig = {
    [State.Initial]: {
      title: t('appRating.extension.title'),
      description: t('appRating.description'),
      secondaryButtonText: t('appRating.button.notReally'),
      primaryButtonText: t('common.button.yes'),
      Icon: LikeSquare,
      iconSize: '$icon.24' as IconSizeTokens,
      onSecondaryButtonPress: () => setState(State.NotReally),
      onPrimaryButtonPress: () => setState(State.Yes),
    },
    [State.NotReally]: {
      title: t('appRating.feedback.title'),
      description: t('appRating.feedback.description'),
      secondaryButtonText: t('common.button.notNow'),
      primaryButtonText: t('appRating.feedback.button.send'),
      Icon: MessageText,
      iconSize: '$icon.18' as IconSizeTokens,
      onSecondaryButtonPress: onRemindLater,
      onPrimaryButtonPress: (): void => {
        window.open(uniswapUrls.walletFeedbackForm)
        dispatch(setAppRating({ feedbackProvided: true }))
        sendAnalyticsEvent(WalletEventName.AppRating, {
          type: 'feedback-form',
          appRatingPromptedMs,
          appRatingProvidedMs,
        })
        onClose()
      },
    },
    [State.Yes]: {
      title: t('appRating.extension.review.title'),
      description: t('appRating.extension.review.description'),
      secondaryButtonText: t('common.button.notNow'),
      primaryButtonText: t('common.button.review'),
      Icon: Feedback,
      iconSize: '$icon.24' as IconSizeTokens,
      onSecondaryButtonPress: onRemindLater,
      onPrimaryButtonPress: (): void => {
        window.open(`https://chromewebstore.google.com/detail/uniswap-extension/${chrome.runtime.id}/reviews`)
        dispatch(setAppRating({ ratingProvided: true }))
        sendAnalyticsEvent(WalletEventName.AppRating, {
          type: 'store-review',
          appRatingPromptedMs,
          appRatingProvidedMs: Date.now(), // to avoid race condition with updates from redux
        })
        onClose()
      },
    },
  }

  const {
    title,
    description,
    secondaryButtonText,
    primaryButtonText,
    Icon,
    iconSize,
    onSecondaryButtonPress,
    onPrimaryButtonPress,
  } = stateConfig[state]

  useEffect(() => {
    // just to set that prompt has been shown
    dispatch(setAppRating({}))
  }, [dispatch])

  return (
    <Modal isDismissible isModalOpen name={ModalName.AppRatingModal} backgroundColor="$surface1" onClose={close}>
      <TouchableArea p="$spacing16" position="absolute" right={0} top={0} zIndex={zIndexes.default} onPress={close}>
        <X color="$neutral2" size="$icon.20" />
      </TouchableArea>
      <Flex alignItems="center" gap="$spacing8" pt="$spacing16">
        <Flex centered backgroundColor="$accent2" width="$spacing48" height="$spacing48" borderRadius="$rounded12">
          <Icon color="$accent1" size={iconSize} />
        </Flex>
        <Flex alignItems="center" gap="$spacing8" pb="$spacing16" pt="$spacing8" px="$spacing4">
          <Text color="$neutral1" textAlign="center" variant="subheading2">
            {title}
          </Text>
          <Text color="$neutral2" textAlign="center" variant="body3">
            {description}
          </Text>
        </Flex>
        <Flex row width="100%" gap="$spacing12">
          <Button flexBasis={1} size="small" emphasis="secondary" onPress={onSecondaryButtonPress}>
            {secondaryButtonText}
          </Button>
          <Button flexBasis={1} size="small" variant="branded" onPress={onPrimaryButtonPress}>
            {primaryButtonText}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
