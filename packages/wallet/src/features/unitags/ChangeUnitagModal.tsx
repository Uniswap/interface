/* eslint-disable complexity */
import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Button, Flex, Text } from 'ui/src'
import { AlertTriangleFilled, Person } from 'ui/src/components/icons'
import { fonts, spacing } from 'ui/src/theme'
import { TextInput } from 'uniswap/src/components/input/TextInput'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/types'
import { ModalName, UnitagEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { UNITAG_SUFFIX } from 'uniswap/src/features/unitags/constants'
import { useUnitagUpdater } from 'uniswap/src/features/unitags/context'
import { UnitagErrorCodes } from 'uniswap/src/features/unitags/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { getUniqueId } from 'utilities/src/device/getUniqueId'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard'
import { logger } from 'utilities/src/logger/logger'
import { isExtension, isMobileApp } from 'utilities/src/platform'
import { useAsyncData } from 'utilities/src/react/hooks'
import { ModalBackButton } from 'wallet/src/components/modals/ModalBackButton'
import { UnitagName } from 'wallet/src/features/unitags/UnitagName'
import { changeUnitag } from 'wallet/src/features/unitags/api'
import { useCanAddressClaimUnitag } from 'wallet/src/features/unitags/hooks/useCanAddressClaimUnitag'
import { useCanClaimUnitagName } from 'wallet/src/features/unitags/hooks/useCanClaimUnitagName'
import { parseUnitagErrorCode } from 'wallet/src/features/unitags/utils'
import { useWalletSigners } from 'wallet/src/features/wallet/context'
import { useAccount } from 'wallet/src/features/wallet/hooks'

export function ChangeUnitagModal({
  unitag,
  address,
  keyboardHeight = 0,
  onClose,
  onSuccess,
}: {
  unitag: string
  address: Address
  keyboardHeight?: number
  onClose: () => void
  onSuccess?: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { data: deviceId } = useAsyncData(getUniqueId)
  const account = useAccount(address)
  const signerManager = useWalletSigners()

  const [newUnitag, setNewUnitag] = useState(unitag)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isCheckingUnitag, setIsCheckingUnitag] = useState(false)
  const [isChangeResponseLoading, setIsChangeResponseLoading] = useState(false)
  const [unitagToCheck, setUnitagToCheck] = useState(unitag)

  const { error: canClaimUnitagNameError, loading: loadingUnitagErrorCheck } = useCanClaimUnitagName(unitagToCheck)
  const { errorCode } = useCanAddressClaimUnitag(address, true)
  const { triggerRefetchUnitags } = useUnitagUpdater()

  const isUnitagEdited = unitag !== newUnitag
  const isUnitagInvalid = newUnitag === unitagToCheck && !!canClaimUnitagNameError && !loadingUnitagErrorCheck
  const isUnitagValid = isUnitagEdited && !canClaimUnitagNameError && !loadingUnitagErrorCheck && !!newUnitag
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
    dismissNativeKeyboard()
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
          }),
        )
        return
      }

      // If change succeeded, exit the modal and display a success message
      if (changeResponse.success) {
        sendAnalyticsEvent(UnitagEventName.UnitagChanged)
        triggerRefetchUnitags()
        dispatch(
          pushNotification({
            type: AppNotificationType.Success,
            title: t('unitags.notification.username.title'),
          }),
        )
        onSuccess?.()
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
        }),
      )
      onClose()
      setIsChangeResponseLoading(false)
    }
  }

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
        <ChangeUnitagConfirmModal unitag={newUnitag} onChangeSubmit={onChangeSubmit} onClose={onCloseConfirmModal} />
      )}
      <Modal isDismissible name={ModalName.UnitagsChange} onClose={onClose}>
        {isExtension && <ModalBackButton onBack={onClose} />}
        <Flex
          centered
          gap="$spacing12"
          // Since BottomSheetTextInput doesnt work, dynamically set bottom padding based on keyboard height to get a keyboard avoiding view
          pb={keyboardHeight > 0 ? keyboardHeight - spacing.spacing20 : '$spacing12'}
          pt={isExtension ? '$spacing24' : '$spacing12'}
          px={isExtension ? undefined : '$spacing24'}
        >
          <Flex
            centered
            backgroundColor="$surface2"
            borderRadius="$rounded12"
            height="$spacing48"
            minWidth="$spacing48"
          >
            <Person color="$neutral1" size="$icon.24" />
          </Flex>
          <Text textAlign="center" variant="subheading1">
            {t('unitags.editUsername.title')}
          </Text>
          <Flex
            row
            alignItems="center"
            borderColor="$surface3"
            borderRadius="$rounded16"
            borderWidth="$spacing1"
            px="$spacing24"
            mt="$spacing12"
            width="100%"
          >
            <TextInput
              autoFocus
              autoCapitalize="none"
              color="$neutral1"
              fontFamily="$subHeading"
              fontSize={fonts.subheading1.fontSize}
              fontWeight="$book"
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
              width="100%"
            >
              <Text color="$statusCritical" variant="body3">
                {t('unitags.editUsername.warning.max')}
              </Text>
            </Flex>
          ) : (
            <Flex backgroundColor="$surface2" borderRadius="$rounded16" px="$spacing16" py="$spacing12" width="100%">
              <Text color="$neutral2" variant="body3">
                <Trans
                  components={{ highlight: <Text color="$statusCritical" variant="body3" /> }}
                  i18nKey="unitags.editUsername.warning.default"
                />
              </Text>
            </Flex>
          )}
          <Flex centered row gap="$spacing8" minHeight={fonts.body3.lineHeight}>
            {isUnitagEdited && unitagToCheck === newUnitag && canClaimUnitagNameError && (
              <Text color="$statusCritical" textAlign="center" variant="body3">
                {canClaimUnitagNameError}
              </Text>
            )}
          </Flex>
          <Flex row width="100%" pt="$spacing4">
            <Button
              isDisabled={isSubmitButtonDisabled}
              loading={isCheckingUnitag || isChangeResponseLoading}
              testID={TestID.Confirm}
              variant="branded"
              emphasis="primary"
              onPress={onPressSaveChanges}
            >
              {t('common.button.save')}
            </Button>
          </Flex>
        </Flex>
      </Modal>
    </>
  )
}

function ChangeUnitagConfirmModal({
  unitag,
  onClose,
  onChangeSubmit,
}: {
  unitag: string
  onClose: () => void
  onChangeSubmit: () => Promise<void>
}): JSX.Element {
  const { t } = useTranslation()
  return (
    <Modal isDismissible name={ModalName.UnitagsChangeConfirm} onClose={onClose}>
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
          {t('unitags.editUsername.confirm.title')}
        </Text>
        <Text color="$neutral2" textAlign="center" variant={isExtension ? 'body3' : 'body2'}>
          {t('unitags.editUsername.confirm.subtitle')}
        </Text>
        <Flex py="$spacing32">
          <UnitagName name={unitag} fontSize={fonts.heading3.fontSize} />
        </Flex>
        <Flex row gap="$spacing12" width="100%">
          {isMobileApp && (
            <Button testID={TestID.Remove} size="large" variant="default" emphasis="secondary" onPress={onClose}>
              {t('common.button.back')}
            </Button>
          )}
          <Button testID={TestID.Remove} size="large" variant="critical" emphasis="secondary" onPress={onChangeSubmit}>
            {t('common.button.confirm')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
