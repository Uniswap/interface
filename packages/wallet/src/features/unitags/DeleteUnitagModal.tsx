import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Button, Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons'
import { fonts } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/types'
import { ModalName, UnitagEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useUnitagUpdater } from 'uniswap/src/features/unitags/context'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { logger } from 'utilities/src/logger/logger'
import { isExtension } from 'utilities/src/platform'
import { ModalBackButton } from 'wallet/src/components/modals/ModalBackButton'
import { UnitagName } from 'wallet/src/features/unitags/UnitagName'
import { deleteUnitag } from 'wallet/src/features/unitags/api'
import { useWalletSigners } from 'wallet/src/features/wallet/context'
import { useAccount } from 'wallet/src/features/wallet/hooks'

export function DeleteUnitagModal({
  unitag,
  address,
  onClose,
  onSuccess,
}: {
  unitag: string
  address: Address
  onClose: () => void
  onSuccess?: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { triggerRefetchUnitags } = useUnitagUpdater()
  const account = useAccount(address)
  const signerManager = useWalletSigners()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteError = (): void => {
    setIsDeleting(false)
    dispatch(
      pushNotification({
        type: AppNotificationType.Error,
        errorMessage: t('unitags.notification.delete.error'),
      }),
    )
    onClose()
  }

  const onDelete = async (): Promise<void> => {
    try {
      setIsDeleting(true)
      const { data: deleteResponse } = await deleteUnitag({
        username: unitag,
        account,
        signerManager,
      })
      setIsDeleting(false)

      if (!deleteResponse?.success) {
        handleDeleteError()
        return
      }

      if (deleteResponse?.success) {
        sendAnalyticsEvent(UnitagEventName.UnitagRemoved)
        triggerRefetchUnitags()
        dispatch(
          pushNotification({
            type: AppNotificationType.Success,
            title: t('unitags.notification.delete.title'),
          }),
        )
        onSuccess?.()
        onClose()
      }
    } catch (e) {
      logger.error(e, {
        tags: { file: 'DeleteUnitagModal', function: 'onDelete' },
      })
      handleDeleteError()
    }
  }

  return (
    <Modal isDismissible name={ModalName.UnitagsDelete} onClose={onClose}>
      {isExtension && <ModalBackButton onBack={onClose} />}
      <Flex centered gap="$spacing12" pb="$spacing12" pt={isExtension ? '$spacing24' : '$spacing12'} px="$spacing24">
        <Flex
          centered
          backgroundColor="$DEP_accentCriticalSoft"
          borderRadius="$rounded12"
          height="$spacing48"
          mb="$spacing8"
          minWidth="$spacing48"
        >
          <AlertTriangleFilled color="$statusCritical" size="$icon.24" />
        </Flex>
        <Text textAlign="center" variant="subheading1">
          {t('unitags.delete.confirm.title')}
        </Text>
        <Text color="$neutral2" textAlign="center" variant={isExtension ? 'body3' : 'body2'}>
          {t('unitags.delete.confirm.subtitle')}
        </Text>
        <Flex py="$spacing24">
          <UnitagName name={unitag} fontSize={fonts.heading3.fontSize} />
        </Flex>
        <Flex row width="100%">
          <Button
            loading={isDeleting}
            isDisabled={isDeleting}
            testID={TestID.Remove}
            variant="critical"
            emphasis="secondary"
            size="large"
            onPress={onDelete}
          >
            {t('common.button.delete')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
