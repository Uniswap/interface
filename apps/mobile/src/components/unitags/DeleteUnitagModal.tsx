import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Icons, Text } from 'ui/src'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { deleteUnitag } from 'wallet/src/features/unitags/api'
import { useUnitagUpdater } from 'wallet/src/features/unitags/context'
import { useAppDispatch } from 'wallet/src/state'
import { ElementName, ModalName } from 'wallet/src/telemetry/constants'

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
  const navigation = useNavigation()
  const dispatch = useAppDispatch()
  const { triggerRefetchUnitags } = useUnitagUpdater()

  const handleDeleteError = (): void => {
    dispatch(
      pushNotification({
        type: AppNotificationType.Error,
        errorMessage: t('Could not delete username. Try again later.'),
      })
    )
    onClose()
  }

  const onDelete = async (): Promise<void> => {
    try {
      const { data: deleteResponse } = await deleteUnitag(unitag, address)
      if (!deleteResponse?.success) {
        handleDeleteError()
        return
      }

      if (deleteResponse?.success) {
        triggerRefetchUnitags()
        dispatch(
          pushNotification({
            type: AppNotificationType.Success,
            title: t('Username deleted'),
          })
        )
        navigation.goBack()
        onClose()
      }
    } catch (e) {
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
          {t('Are you sure?')}
        </Text>
        <Text color="$neutral2" textAlign="center" variant="body2">
          {t(
            'You’re about to delete your username and customizable profile details. You will not be able to reclaim it.'
          )}
        </Text>
        <Flex centered row gap="$spacing12" pt="$spacing24">
          <Button fill testID={ElementName.Remove} theme="detrimental" onPress={onDelete}>
            {t('Delete')}
          </Button>
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}
