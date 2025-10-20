import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Button, Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons'
import { fonts } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { UnitagsApiClient } from 'uniswap/src/data/apiClients/unitagsApi/UnitagsApiClient'
import { useResetUnitagsQueries } from 'uniswap/src/data/apiClients/unitagsApi/useResetUnitagsQueries'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { ModalName, UnitagEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { UnitagName } from 'uniswap/src/features/unitags/UnitagName'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { logger } from 'utilities/src/logger/logger'
import { isExtensionApp } from 'utilities/src/platform'
import { ModalBackButton } from 'wallet/src/components/modals/ModalBackButton'
import { useWalletSigners } from 'wallet/src/features/wallet/context'
import { useAccount } from 'wallet/src/features/wallet/hooks'
import { generateSignerFunc } from 'wallet/src/features/wallet/signing/utils'

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
  const resetUnitagsQueries = useResetUnitagsQueries()
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
      const deleteResponse = await UnitagsApiClient.deleteUnitag({
        data: { username: unitag },
        address: account.address,
        signMessage: generateSignerFunc(account, signerManager),
      })
      setIsDeleting(false)

      if (!deleteResponse.success) {
        handleDeleteError()
        return
      }

      // Deletion was a success
      sendAnalyticsEvent(UnitagEventName.UnitagRemoved)
      resetUnitagsQueries()
      dispatch(
        pushNotification({
          type: AppNotificationType.Success,
          title: t('unitags.notification.delete.title'),
        }),
      )
      onSuccess?.()
      onClose()
    } catch (e) {
      logger.error(e, {
        tags: { file: 'DeleteUnitagModal', function: 'onDelete' },
      })
      handleDeleteError()
    }
  }

  return (
    <Modal isDismissible name={ModalName.UnitagsDelete} onClose={onClose}>
      {isExtensionApp && <ModalBackButton onBack={onClose} />}
      <Flex centered gap="$spacing12" pb="$spacing12" pt={isExtensionApp ? '$spacing24' : '$spacing12'} px="$spacing24">
        <Flex
          centered
          backgroundColor="$statusCritical2"
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
        <Text color="$neutral2" textAlign="center" variant={isExtensionApp ? 'body3' : 'body2'}>
          {t('unitags.delete.confirm.subtitle')}
        </Text>
        <Flex py="$spacing24">
          <UnitagName animateText name={unitag} textProps={{ fontSize: fonts.heading3.fontSize }} />
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
