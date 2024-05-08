import { useNavigation } from '@react-navigation/native'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, EmitterSubscription, Keyboard } from 'react-native'
import { getUniqueId } from 'react-native-device-info'
import { Button, Flex, Icons, Text, useSporeColors } from 'ui/src'
import { fonts, spacing } from 'ui/src/theme'
import { useUnitagUpdater } from 'uniswap/src/features/unitags/context'
import { UnitagErrorCodes } from 'uniswap/src/features/unitags/types'
import { isIOS } from 'uniswap/src/utils/platform'
import { logger } from 'utilities/src/logger/logger'
import { useAsyncData } from 'utilities/src/react/hooks'
import { TextInput } from 'wallet/src/components/input/TextInput'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { changeUnitag } from 'wallet/src/features/unitags/api'
import { UNITAG_SUFFIX } from 'wallet/src/features/unitags/constants'
import { useCanAddressClaimUnitag, useCanClaimUnitagName } from 'wallet/src/features/unitags/hooks'
import { parseUnitagErrorCode } from 'wallet/src/features/unitags/utils'
import { useWalletSigners } from 'wallet/src/features/wallet/context'
import { useAccount } from 'wallet/src/features/wallet/hooks'
import { useAppDispatch } from 'wallet/src/state'
import { sendWalletAnalyticsEvent } from 'wallet/src/telemetry'
import { ElementName, ModalName, UnitagEventName } from 'wallet/src/telemetry/constants'

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
  const colors = useSporeColors()
  const navigation = useNavigation()
  const dispatch = useAppDispatch()
  const { data: deviceId } = useAsyncData(getUniqueId)
  const account = useAccount(address)
  const signerManager = useWalletSigners()

  const [newUnitag, setNewUnitag] = useState(unitag)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isCheckingUnitag, setIsCheckingUnitag] = useState(false)
  const [isChangeResponseLoading, setIsChangeResponseLoading] = useState(false)
  const [unitagToCheck, setUnitagToCheck] = useState(unitag)

  const { error: canClaimUnitagNameError, loading: loadingUnitagErrorCheck } =
    useCanClaimUnitagName(address, unitagToCheck)
  const { errorCode } = useCanAddressClaimUnitag(address, true)
  const { triggerRefetchUnitags } = useUnitagUpdater()

  const isUnitagEdited = unitag !== newUnitag
  const isUnitagInvalid =
    newUnitag === unitagToCheck && !!canClaimUnitagNameError && !loadingUnitagErrorCheck
  const isUnitagValid =
    isUnitagEdited && !canClaimUnitagNameError && !loadingUnitagErrorCheck && !!newUnitag
  const hasReachedAddressLimit = errorCode === UnitagErrorCodes.AddressLimitReached
  const isSubmitButtonDisabled =
    isCheckingUnitag ||
    isChangeResponseLoading ||
    !deviceId ||
    hasReachedAddressLimit ||
    !isUnitagEdited ||
    !newUnitag ||
    isUnitagInvalid

  const onFinishEditing = (): void => {
    Keyboard.dismiss()
  }

  const onCloseConfirmModal = (): void => {
    setShowConfirmModal(false)
  }

  const onPressSaveChanges = (): void => {
    if (newUnitag !== unitagToCheck) {
      // Unitag needs to be checked for errors and availability
      setIsCheckingUnitag(true)
      setUnitagToCheck(newUnitag)
    } else if (isUnitagValid) {
      // If unitag is unchanged and is available, continue to speedbump
      onFinishEditing()
      setShowConfirmModal(true)
    }
  }

  const onChangeSubmit = async (): Promise<void> => {
    if (!deviceId) {
      logger.error(new Error('DeviceId is undefined'), {
        tags: { file: 'ChangeUnitagModal', function: 'onChangeSubmit' },
      })
      return // Should never hit this condition. Button is disabled if deviceId is undefined
    }

    onFinishEditing()
    setShowConfirmModal(false)
    setIsChangeResponseLoading(true)
    try {
      // Change unitag backend call
      const { data: changeResponse } = await changeUnitag({
        username: unitagToCheck,
        deviceId,
        account,
        signerManager,
      })
      setIsChangeResponseLoading(false)

      // If change failed and returns an error code, display the error message
      if (!changeResponse.success && !!changeResponse.errorCode) {
        dispatch(
          pushNotification({
            type: AppNotificationType.Error,
            errorMessage: parseUnitagErrorCode(t, unitagToCheck, changeResponse.errorCode),
          })
        )
        return
      }

      // If change succeeded, exit the modal and display a success message
      if (changeResponse.success) {
        sendWalletAnalyticsEvent(UnitagEventName.UnitagChanged)
        triggerRefetchUnitags()
        dispatch(
          pushNotification({
            type: AppNotificationType.Success,
            title: t('unitags.notification.username.title'),
          })
        )
        navigation.goBack()
        onClose()
      }
    } catch (e) {
      // If some other error occurs, log it and display a generic error message
      logger.error(e, {
        tags: { file: 'ChangeUnitagModal', function: 'onChangeSubmit' },
      })
      dispatch(
        pushNotification({
          type: AppNotificationType.Error,
          errorMessage: t('unitags.notification.username.error'),
        })
      )
      onClose()
      setIsChangeResponseLoading(false)
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

  // When useUnitagError completes loading, if unitag is valid then continue to speedbump
  useEffect(() => {
    if (isCheckingUnitag && !!unitagToCheck && !loadingUnitagErrorCheck) {
      setIsCheckingUnitag(false)
      // If unitagError is defined, it's rendered in UI. If no error, continue to speedbump
      if (unitagToCheck === newUnitag && isUnitagValid) {
        onFinishEditing()
        setShowConfirmModal(true)
      }
    }
  }, [isCheckingUnitag, isUnitagValid, loadingUnitagErrorCheck, newUnitag, unitagToCheck])

  return (
    <>
      {showConfirmModal && (
        <ChangeUnitagConfirmModal onChangeSubmit={onChangeSubmit} onClose={onCloseConfirmModal} />
      )}
      <BottomSheetModal
        isDismissible
        isModalOpen={!showConfirmModal}
        name={ModalName.UnitagsChange}
        onClose={onClose}>
        <Flex
          centered
          gap="$spacing12"
          // Since BottomSheetTextInput doesnt work, dynamically set bottom padding based on keyboard height to get a keyboard avoiding view
          pb={keyboardHeight > 0 ? keyboardHeight - spacing.spacing20 : '$spacing12'}
          pt="$spacing12"
          px="$spacing24">
          <Text textAlign="center" variant="subheading1">
            {t('unitags.editUsername.title')}
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
              m="$none"
              maxLength={20}
              numberOfLines={1}
              px="$none"
              py="$spacing20"
              returnKeyType="done"
              value={newUnitag}
              width="100%"
              onChangeText={(text: string) => setNewUnitag(text.trim().toLowerCase())}
              onSubmitEditing={onFinishEditing}
            />
            <Flex position="absolute" right="$spacing20" top="$spacing20">
              <Text color="$neutral3" variant="subheading1">
                {UNITAG_SUFFIX}
              </Text>
            </Flex>
          </Flex>
          {hasReachedAddressLimit ? (
            <Flex
              backgroundColor="$DEP_accentCriticalSoft"
              borderRadius="$rounded16"
              px="$spacing16"
              py="$spacing12"
              width="100%">
              <Text color="$statusCritical" variant="body3">
                {t('unitags.editUsername.warning.max')}
              </Text>
            </Flex>
          ) : (
            <Flex
              backgroundColor="$surface2"
              borderRadius="$rounded16"
              px="$spacing16"
              py="$spacing12"
              width="100%">
              <Text color="$neutral2" variant="body3">
                {t('unitags.editUsername.warning.default')}
              </Text>
            </Flex>
          )}
          {isUnitagEdited && unitagToCheck === newUnitag && canClaimUnitagNameError && (
            <Flex centered row gap="$spacing8">
              <Text color="$statusCritical" textAlign="center" variant="body3">
                {canClaimUnitagNameError}
              </Text>
            </Flex>
          )}
          <Flex centered row pt="$spacing4">
            <Button
              fill
              disabled={isSubmitButtonDisabled}
              testID={ElementName.Confirm}
              theme="primary"
              onPress={onPressSaveChanges}>
              {isCheckingUnitag || isChangeResponseLoading ? (
                <Flex height={fonts.buttonLabel1.lineHeight}>
                  <ActivityIndicator color={colors.sporeWhite.val} />
                </Flex>
              ) : (
                t('unitags.editUsername.button.confirm')
              )}
            </Button>
          </Flex>
        </Flex>
      </BottomSheetModal>
    </>
  )
}

function ChangeUnitagConfirmModal({
  onClose,
  onChangeSubmit,
}: {
  onClose: () => void
  onChangeSubmit: () => Promise<void>
}): JSX.Element {
  const { t } = useTranslation()
  return (
    <BottomSheetModal isDismissible name={ModalName.UnitagsChangeConfirm} onClose={onClose}>
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
          {t('unitags.editUsername.confirm.title')}
        </Text>
        <Text color="$neutral2" textAlign="center" variant="body2">
          {t('unitags.editUsername.confirm.subtitle')}
        </Text>
        <Flex centered row gap="$spacing12" pt="$spacing24">
          <Button fill testID={ElementName.Remove} theme="secondary" onPress={onClose}>
            {t('common.button.back')}
          </Button>
          <Button fill testID={ElementName.Remove} theme="detrimental" onPress={onChangeSubmit}>
            {t('common.button.confirm')}
          </Button>
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}
