import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { navigate } from 'src/app/navigation/rootNavigation'
import { Delay } from 'src/components/layout/Delayed'
import { AssociatedAccountsList } from 'src/components/RemoveWallet/AssociatedAccountsList'
import { RemoveLastMnemonicWalletFooter } from 'src/components/RemoveWallet/RemoveLastMnemonicWalletFooter'
import { RemoveWalletStep, useModalContent } from 'src/components/RemoveWallet/useModalContent'
import { navigateToOnboardingImportMethod } from 'src/components/RemoveWallet/utils'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { closeModal } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { OnboardingScreens, Screens } from 'src/screens/Screens'
import { AnimatedFlex, Button, ColorTokens, Flex, Text, ThemeKeys, useSporeColors } from 'ui/src'
import { iconSizes, opacify } from 'ui/src/theme'
import { SpinningLoader } from 'wallet/src/components/loading/SpinningLoader'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { ImportType, OnboardingEntryPoint } from 'wallet/src/features/onboarding/types'
import {
  EditAccountAction,
  editAccountActions,
} from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { useAccounts } from 'wallet/src/features/wallet/hooks'
import { selectSignerMnemonicAccounts } from 'wallet/src/features/wallet/selectors'
import { setFinishedOnboarding } from 'wallet/src/features/wallet/slice'
import { ElementName, ModalName } from 'wallet/src/telemetry/constants'

export function RemoveWalletModal(): JSX.Element | null {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const dispatch = useAppDispatch()

  const addressToAccount = useAccounts()
  const associatedAccounts = useAppSelector(selectSignerMnemonicAccounts)

  const { initialState } = useAppSelector(selectModalState(ModalName.RemoveWallet))
  const address = initialState?.address

  const account = (address && addressToAccount[address]) || undefined
  // If address was not provided, it means we need to remove all mnemonics.
  // This happens when user wants to replace mnemonic with a new one
  const isReplacing = !address

  const isRemovingMnemonic = Boolean(associatedAccounts.find((acc) => address === acc.address))
  const isRemovingLastMnemonic = isRemovingMnemonic && associatedAccounts.length === 1
  const isRemovingRecoveryPhrase = isReplacing || isRemovingLastMnemonic

  const hasAccountsLeft =
    Object.keys(addressToAccount).length > (isReplacing ? associatedAccounts.length : 1)

  const [inProgress, setInProgress] = useState(false)
  const [currentStep, setCurrentStep] = useState<RemoveWalletStep>(
    isRemovingRecoveryPhrase ? RemoveWalletStep.Warning : RemoveWalletStep.Final
  )

  const onClose = useCallback((): void => {
    dispatch(closeModal({ name: ModalName.RemoveWallet }))
  }, [dispatch])

  const onRemoveWallet = useCallback((): void => {
    if (!hasAccountsLeft) {
      // user has no accounts left, so we bring onboarding back
      dispatch(setFinishedOnboarding({ finishedOnboarding: false }))
      navigateToOnboardingImportMethod()
    } else if (isReplacing) {
      // there are account left and it's replacing, user has view-only accounts left
      navigate(Screens.OnboardingStack, {
        screen: OnboardingScreens.ImportMethod,
        params: {
          importType: ImportType.NotYetSelected,
          entryPoint: OnboardingEntryPoint.Sidebar,
        },
      })
    }
    const accountsToRemove = isReplacing ? associatedAccounts : account ? [account] : []
    accountsToRemove.forEach(({ address: accAddress, pushNotificationsEnabled }) => {
      dispatch(
        editAccountActions.trigger({
          type: EditAccountAction.Remove,
          address: accAddress,
          notificationsEnabled: !!pushNotificationsEnabled,
        })
      )
    })

    onClose()
    setInProgress(false)
  }, [account, associatedAccounts, dispatch, isReplacing, hasAccountsLeft, onClose])

  const { trigger } = useBiometricPrompt(
    () => {
      onRemoveWallet()
    },
    () => {
      setInProgress(false)
    }
  )

  const {
    requiredForAppAccess: biometricAuthRequiredForAppAccess,
    requiredForTransactions: biometricAuthRequiredForTransactions,
  } = useBiometricAppSettings()

  const onRemoveWalletPress = async (): Promise<void> => {
    if (biometricAuthRequiredForAppAccess || biometricAuthRequiredForTransactions) {
      await trigger()
    } else {
      onRemoveWallet()
    }
  }

  const onPress = async (): Promise<void> => {
    // we want to call onRemoveWallet only once
    if (inProgress) {
      return
    }
    if (currentStep === RemoveWalletStep.Warning) {
      setCurrentStep(RemoveWalletStep.Final)
    } else if (currentStep === RemoveWalletStep.Final) {
      setInProgress(true)
      await onRemoveWalletPress()
    }
  }

  const modalContent = useModalContent({
    account,
    isReplacing,
    currentStep,
    isRemovingRecoveryPhrase,
    associatedAccounts,
  })

  // we want to nicely squeeze the cancel button when user presses remove
  const animatedCancelButtonSpanStyles = useAnimatedStyle(() => {
    return {
      flexGrow: withTiming(inProgress ? 0 : 1, { duration: Delay.Short / 2 }),
    }
  })

  if (!modalContent) {
    return null
  }

  const { title, description, Icon, iconColorLabel, actionButtonTheme, actionButtonLabel } =
    modalContent

  // TODO(MOB-1420): clean up types
  const labelColor: ThemeKeys = iconColorLabel

  return (
    <BottomSheetModal
      backgroundColor={colors.surface1.get()}
      name={ModalName.RemoveSeedPhraseWarningModal}
      onClose={onClose}>
      <Flex gap="$spacing24" px="$spacing24" py="$spacing24">
        <Flex centered gap="$spacing16">
          <Flex
            centered
            borderRadius="$rounded12"
            p="$spacing12"
            style={{
              backgroundColor: opacify(12, colors[labelColor].val),
            }}>
            <Icon
              color={colors[labelColor].val}
              height={iconSizes.icon24}
              width={iconSizes.icon24}
            />
          </Flex>
          <Flex gap="$spacing8">
            <Text textAlign="center" variant="body1">
              {title}
            </Text>
            <Text color="$neutral2" textAlign="center" variant="body3">
              {description}
            </Text>
          </Flex>
        </Flex>
        <Flex centered gap="$spacing16">
          {currentStep === RemoveWalletStep.Final && isRemovingRecoveryPhrase ? (
            <>
              <AssociatedAccountsList accounts={associatedAccounts} />
              <RemoveLastMnemonicWalletFooter inProgress={inProgress} onPress={onPress} />
            </>
          ) : (
            <Flex centered row gap={inProgress ? '$none' : '$spacing12'} pt="$spacing12">
              {inProgress ? (
                <AnimatedFlex style={animatedCancelButtonSpanStyles} />
              ) : (
                <Button fill disabled={inProgress} theme="outline" onPress={onClose}>
                  {t('common.button.cancel')}
                </Button>
              )}
              <Button
                fill
                icon={
                  inProgress ? (
                    <SpinningLoader
                      // TODO(MOB-1420): clean up types (as ColorTokens)
                      color={`$${labelColor}` as ColorTokens}
                    />
                  ) : undefined
                }
                testID={isRemovingRecoveryPhrase ? ElementName.Continue : ElementName.Remove}
                theme={actionButtonTheme}
                width="100%"
                onPress={onPress}>
                {inProgress ? undefined : actionButtonLabel}
              </Button>
            </Flex>
          )}
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}
