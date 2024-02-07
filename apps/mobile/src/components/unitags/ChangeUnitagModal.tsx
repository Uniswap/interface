import { useNavigation } from '@react-navigation/native'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EmitterSubscription, Keyboard, KeyboardAvoidingView, StyleSheet } from 'react-native'
import { getUniqueId } from 'react-native-device-info'
import { Button, Flex, Text } from 'ui/src'
import { fonts } from 'ui/src/theme'
import { logger } from 'utilities/src/logger/logger'
import { useAsyncData } from 'utilities/src/react/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useDebounce } from 'utilities/src/time/timing'
import { TextInput } from 'wallet/src/components/input/TextInput'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { useUnitagChangeMutation } from 'wallet/src/features/unitags/api'
import { UNITAG_SUFFIX } from 'wallet/src/features/unitags/constants'
import { useUnitagUpdater } from 'wallet/src/features/unitags/context'
import { useCanClaimUnitagName } from 'wallet/src/features/unitags/hooks'
import { parseUnitagErrorCode } from 'wallet/src/features/unitags/utils'
import { useAppDispatch } from 'wallet/src/state'
import { ElementName, ModalName } from 'wallet/src/telemetry/constants'
import { isIOS } from 'wallet/src/utils/platform'

export function ChangeUnitagModal({
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
  const { data: deviceId } = useAsyncData(getUniqueId)
  const [changeUnitagMutation] = useUnitagChangeMutation()
  const [newUnitag, setNewUnitag] = useState(unitag)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const debouncedInputValue = useDebounce(newUnitag, ONE_SECOND_MS)
  const { error, loading } = useCanClaimUnitagName(address, debouncedInputValue)
  const { triggerRefetchUnitags } = useUnitagUpdater()

  const isUnitagEdited = unitag !== newUnitag
  const isUnitagValid = isUnitagEdited && !error && !loading && !!newUnitag

  const onFinishEditing = (): void => {
    Keyboard.dismiss()
  }

  const onChangeSubmit = async (): Promise<void> => {
    if (!deviceId) {
      logger.error(new Error('DeviceId is undefined'), {
        tags: { file: 'ChangeUnitagModal', function: 'onChangeSubmit' },
      })
      return // Should never hit this condition. Button is disabled if deviceId is undefined
    }

    onFinishEditing()
    try {
      // Change unitag backend call
      const { data: changeResponse } = await changeUnitagMutation({
        username: newUnitag,
        address,
        deviceId,
      })

      // If change failed and returns an error code, display the error message
      if (!changeResponse?.data.success && !!changeResponse?.data.errorCode) {
        dispatch(
          pushNotification({
            type: AppNotificationType.Error,
            errorMessage: parseUnitagErrorCode(t, newUnitag, changeResponse?.data.errorCode),
          })
        )
        return
      }

      // If change succeeded, exit the modal and display a success message
      if (changeResponse?.data.success) {
        triggerRefetchUnitags()
        dispatch(
          pushNotification({
            type: AppNotificationType.Success,
            title: t('Username changed'),
          })
        )
        navigation.goBack()
        onClose()
      }
    } catch (e) {
      // If some other error occurs, display a generic error message
      dispatch(
        pushNotification({
          type: AppNotificationType.Error,
          errorMessage: t('Could not change username. Try again later.'),
        })
      )
      onClose()
    }
  }

  // This useEffect makes KeyboardAvoidingView work when inside a BottomSheetModal
  // Dynamically add bottom padding equal to keyboard height so that elements have room to shift up
  useEffect(() => {
    let showSubscription: EmitterSubscription
    let hideSubscription: EmitterSubscription

    if (isIOS) {
      // Using keyboardWillShow makes it feel more responsive, but only available on iOS
      showSubscription = Keyboard.addListener('keyboardWillShow', (e) => {
        setKeyboardHeight(e.endCoordinates.height)
      })
      hideSubscription = Keyboard.addListener('keyboardWillHide', () => {
        setKeyboardHeight(0)
      })
    } else {
      // keyboardDidShow only emits after the keyboard has fully appeared
      showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
        setKeyboardHeight(e.endCoordinates.height)
      })
      hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
        setKeyboardHeight(0)
      })
    }

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [])

  return (
    <BottomSheetModal isDismissible name={ModalName.UnitagsChange} onClose={onClose}>
      <KeyboardAvoidingView
        enabled
        behavior={isIOS ? 'padding' : undefined}
        contentContainerStyle={styles.expand}
        style={styles.base}>
        <Flex
          centered
          gap="$spacing12"
          pb={keyboardHeight > 0 ? keyboardHeight : '$spacing12'}
          pt="$spacing12"
          px="$spacing24">
          <Text textAlign="center" variant="subheading1">
            {t('Edit username')}
          </Text>
          <Flex
            row
            alignItems="center"
            borderColor="$surface3"
            borderRadius="$rounded16"
            borderWidth="$spacing1"
            px="$spacing24">
            <TextInput
              autoFocus
              autoCapitalize="none"
              color="$neutral1"
              fontFamily="$subHeading"
              fontSize={fonts.subheading1.fontSize}
              margin="$none"
              maxLength={20}
              numberOfLines={1}
              px="$none"
              py="$spacing20"
              returnKeyType="done"
              value={newUnitag}
              width="100%"
              onChangeText={setNewUnitag}
              onSubmitEditing={onFinishEditing}
            />
            <Flex position="absolute" right="$spacing20" top="$spacing20">
              <Text color="$neutral3" variant="subheading1">
                {UNITAG_SUFFIX}
              </Text>
            </Flex>
          </Flex>
          {isUnitagEdited && !loading && error && (
            <Flex centered row gap="$spacing8">
              <Text color="$statusCritical" textAlign="center" variant="body2">
                {error}
              </Text>
            </Flex>
          )}

          <Text color="$neutral2" textAlign="center" variant="body2">
            {t(
              'You only get two username changes per address. Once you change your username, you can’t change it back.'
            )}
          </Text>
          <Flex centered row gap="$spacing12" pt="$spacing24">
            <Button
              fill
              disabled={!isUnitagValid || !deviceId}
              testID={ElementName.Confirm}
              theme="primary"
              onPress={onChangeSubmit}>
              {t('Save changes')}
            </Button>
          </Flex>
        </Flex>
      </KeyboardAvoidingView>
    </BottomSheetModal>
  )
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  expand: {
    flexGrow: 1,
  },
})
