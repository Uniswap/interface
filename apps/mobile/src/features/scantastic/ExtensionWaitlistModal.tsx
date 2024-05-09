import { useTranslation } from 'react-i18next'
import { useAppSelector } from 'src/app/hooks'
import { closeModal } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { Button, Flex, Text, TouchableArea } from 'ui/src'
import { AlertTriangle, DocumentList } from 'ui/src/components/icons'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { useAppDispatch } from 'wallet/src/state'
import { ModalName } from 'wallet/src/telemetry/constants'
import { openUri } from 'wallet/src/utils/linking'

export function ExtensionWaitlistModal(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const { initialState } = useAppSelector(selectModalState(ModalName.ExtensionWaitlistModal))
  const isUserOnWaitlist = initialState?.isUserOnWaitlist

  const onClose = (): void => {
    dispatch(closeModal({ name: ModalName.ExtensionWaitlistModal }))
  }

  return (
    <BottomSheetModal name={ModalName.ExtensionWaitlistModal} onClose={onClose}>
      <Flex gap="$spacing16" p="$spacing24">
        <Flex alignItems="center" gap="$spacing16" pb="$spacing16">
          <Flex
            centered
            backgroundColor="$surface2"
            borderRadius="$rounded12"
            height="$spacing48"
            p="$spacing12"
            width="$spacing48">
            {isUserOnWaitlist ? (
              <DocumentList color="$neutral2" size="$icon.28" />
            ) : (
              <AlertTriangle color="$neutral2" size="$icon.28" />
            )}
          </Flex>
          <Flex alignItems="center" gap="$spacing8">
            <Text variant="subheading1">
              {isUserOnWaitlist
                ? t('scantastic.modal.onWaitlist.title')
                : t('scantastic.modal.notOnWaitlist.title')}
            </Text>
            <Text color="$neutral2" textAlign="center" variant="body3">
              {isUserOnWaitlist
                ? t('scantastic.modal.onWaitlist.message')
                : t('scantastic.modal.notOnWaitlist.message')}
            </Text>
            {!isUserOnWaitlist && (
              <TouchableArea
                hapticFeedback
                onPress={async (): Promise<void> => {
                  await openUri(uniswapUrls.helpArticleUrls.extensionWaitlist)
                }}>
                <Text color="$accent1" variant="buttonLabel3">
                  {t('common.button.learn')}
                </Text>
              </TouchableArea>
            )}
          </Flex>
        </Flex>
        <Flex>
          <Button
            alignSelf="center"
            backgroundColor="$surface3"
            borderRadius="$rounded16"
            color="$neutral1"
            height="$spacing48"
            theme="secondary"
            width="100%"
            onPress={onClose}>
            {t('common.button.close')}
          </Button>
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}
