import { useNavigation } from '@react-navigation/native'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator } from 'react-native'
import { Button, Flex, Icons, Text, useSporeColors } from 'ui/src'
import { fonts } from 'ui/src/theme'
import { useUnitagUpdater } from 'uniswap/src/features/unitags/context'
import { logger } from 'utilities/src/logger/logger'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { deleteUnitag } from 'wallet/src/features/unitags/api'
import { useWalletSigners } from 'wallet/src/features/wallet/context'
import { useAccount } from 'wallet/src/features/wallet/hooks'
import { useAppDispatch } from 'wallet/src/state'
import { sendWalletAnalyticsEvent } from 'wallet/src/telemetry'
import { ElementName, ModalName, UnitagEventName } from 'wallet/src/telemetry/constants'

export function DeleteUnitagModal({
  unitag,
  address,
  onClose,
}: {
  unitag: string
  address: Address
  onClose: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const navigation = useNavigation()
  const dispatch = useAppDispatch()
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
      })
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
        sendWalletAnalyticsEvent(UnitagEventName.UnitagRemoved)
        triggerRefetchUnitags()
        dispatch(
          pushNotification({
            type: AppNotificationType.Success,
            title: t('unitags.notification.delete.title'),
          })
        )
        navigation.goBack()
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
    <BottomSheetModal isDismissible name={ModalName.UnitagsDelete} onClose={onClose}>
      <Flex centered gap="$spacing12" pb="$spacing12" pt="$spacing12" px="$spacing24">
        <Flex
          centered
          backgroundColor="$DEP_accentCriticalSoft"
          borderRadius="$rounded12"
          height="$spacing48"
          mb="$spacing8"
          minWidth="$spacing48">
          <Icons.AlertTriangle color="$statusCritical" size="$icon.24" />
        </Flex>
        <Text textAlign="center" variant="subheading1">
          {t('unitags.delete.confirm.title')}
        </Text>
        <Text color="$neutral2" textAlign="center" variant="body2">
          {t('unitags.delete.confirm.subtitle')}
        </Text>
        <Flex centered row gap="$spacing12" pt="$spacing24">
          <Button
            fill
            disabled={isDeleting}
            testID={ElementName.Remove}
            theme="detrimental"
            onPress={onDelete}>
            {isDeleting ? (
              <Flex height={fonts.buttonLabel1.lineHeight}>
                <ActivityIndicator color={colors.sporeWhite.val} />
              </Flex>
            ) : (
              t('common.button.delete')
            )}
          </Button>
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}
