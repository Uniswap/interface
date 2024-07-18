import { t } from 'i18next'
import { Button, Flex, Text, useSporeColors } from 'ui/src'
import { MessageStar } from 'ui/src/components/icons'
import { BottomSheetModal } from 'uniswap/src/components/modals/BottomSheetModal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { selectExtensionBetaFeedbackState } from 'wallet/src/features/behaviorHistory/selectors'
import { ExtensionBetaFeedbackState, setExtensionBetaFeedbackState } from 'wallet/src/features/behaviorHistory/slice'
import { useAppDispatch, useAppSelector } from 'wallet/src/state'

export function FeedbackRequestModal(): JSX.Element {
  const dispatch = useAppDispatch()
  const colors = useSporeColors()

  const onDismiss = (): void => {
    dispatch(setExtensionBetaFeedbackState(ExtensionBetaFeedbackState.Shown))
  }

  const openFeedbackUrl = (): void => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    window.open(uniswapUrls.extensionFeedbackFormUrl, '_blank')
    onDismiss()
  }

  const isOpen = useAppSelector(selectExtensionBetaFeedbackState) === ExtensionBetaFeedbackState.ReadyToShow

  return (
    <BottomSheetModal
      alignment="center"
      backgroundColor={colors.surface1.val}
      isModalOpen={isOpen}
      name={ModalName.ExtensionBetaFeedbackModal}
      onClose={onDismiss}
    >
      <Flex alignItems="center" gap="$spacing12" pt="$spacing12">
        <Flex backgroundColor="$accent2" borderRadius="$rounded12" p="$spacing12">
          <MessageStar color="$accent1" size="$icon.24" />
        </Flex>
        <Flex alignItems="center" gap="$spacing12" pb="$spacing16" pt="$spacing8" px="$spacing4">
          <Text color="$neutral1" textAlign="center" variant="subheading2">
            {t('extension.feedback.title')}
          </Text>
          <Text color="$neutral2" textAlign="center" variant="body3">
            {t('extension.feedback.description')}
          </Text>
        </Flex>
        <Flex fill row gap="$spacing12" width="100%">
          <Button flex={1} textAlign="center" theme="tertiary" width="100%" onPress={onDismiss}>
            <Text color="$neutral2" variant="buttonLabel3">
              {t('common.button.later')}
            </Text>
          </Button>
          <Button flex={1} textAlign="center" theme="accentSecondary" width="100%" onPress={openFeedbackUrl}>
            <Text color="$accent1" variant="buttonLabel3">
              {t('common.button.share')}
            </Text>
          </Button>
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}
