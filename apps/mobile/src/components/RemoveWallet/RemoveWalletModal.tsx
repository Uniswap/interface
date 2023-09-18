import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { navigate } from 'src/app/navigation/rootNavigation'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import { AnimatedBox } from 'src/components/layout'
import { Delay } from 'src/components/layout/Delayed'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { AssociatedAccountsList } from 'src/components/RemoveWallet/AssociatedAccountsList'
import { RemoveLastMnemonicWalletFooter } from 'src/components/RemoveWallet/RemoveLastMnemonicWalletFooter'
import { RemoveWalletStep, useModalContent } from 'src/components/RemoveWallet/useModalContent'
import { navigateToOnboardingImportMethod } from 'src/components/RemoveWallet/utils'
import { useBiometricPrompt } from 'src/features/biometrics/hooks'
import { closeModal, selectModalState } from 'src/features/modals/modalSlice'
import { ImportType, OnboardingEntryPoint } from 'src/features/onboarding/utils'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { OnboardingScreens, Screens } from 'src/screens/Screens'
import { Flex, Text } from 'ui/src'
import { iconSizes, opacify } from 'ui/src/theme'
import { useAccounts } from 'wallet/src/features/wallet/hooks'
import { selectSignerMnemonicAccounts } from 'wallet/src/features/wallet/selectors'
import { removeAccounts, setFinishedOnboarding } from 'wallet/src/features/wallet/slice'

export interface RemoveWalletModalState {
  address?: Address
}

export function RemoveWalletModal(): JSX.Element | null {
  const { t } = useTranslation()
  // TODO(MOB-1280): refactor to use useSporeColors hook instead
  const theme = useAppTheme()
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
    const accountsToRemove = isReplacing
      ? associatedAccounts.map((acc) => acc.address as string)
      : [address]
    dispatch(removeAccounts(accountsToRemove))
    onClose()
    setInProgress(false)
  }, [address, associatedAccounts, dispatch, isReplacing, hasAccountsLeft, onClose])

  const { trigger } = useBiometricPrompt(
    () => {
      onRemoveWallet()
    },
    () => {
      setInProgress(false)
    }
  )

  const onPress = async (): Promise<void> => {
    // we want to call onRemoveWallet only once
    if (inProgress) return
    if (currentStep === RemoveWalletStep.Warning) {
      setCurrentStep(RemoveWalletStep.Final)
    } else if (currentStep === RemoveWalletStep.Final) {
      setInProgress(true)
      await trigger()
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

  const { title, description, Icon, iconColorLabel, actionButtonEmphasis, actionButtonLabel } =
    modalContent

  return (
    <BottomSheetModal
      backgroundColor={theme.colors.surface1}
      name={ModalName.RemoveSeedPhraseWarningModal}
      onClose={onClose}>
      <Flex centered gap="$spacing16" height="100%" mb="$spacing24" p="$spacing24" pt="$none">
        <Flex
          centered
          borderRadius="$rounded12"
          p="$spacing12"
          style={{
            backgroundColor: opacify(12, theme.colors[iconColorLabel]),
          }}>
          <Icon
            color={theme.colors[iconColorLabel]}
            height={iconSizes.icon24}
            width={iconSizes.icon24}
          />
        </Flex>
        <Text textAlign="center" variant="bodyLarge">
          {title}
        </Text>
        <Text color="$neutral2" textAlign="center" variant="bodySmall">
          {description}
        </Text>
        {currentStep === RemoveWalletStep.Final && isRemovingRecoveryPhrase ? (
          <>
            <AssociatedAccountsList accounts={associatedAccounts} />
            <RemoveLastMnemonicWalletFooter inProgress={inProgress} onPress={onPress} />
          </>
        ) : (
          <Flex centered row gap={inProgress ? '$none' : '$spacing12'} pt="$spacing12">
            {inProgress ? (
              <AnimatedBox gap="$none" style={animatedCancelButtonSpanStyles} />
            ) : (
              <Button
                fill
                disabled={inProgress}
                emphasis={ButtonEmphasis.Tertiary}
                label={t('Cancel')}
                onPress={onClose}
              />
            )}

            <Button
              fill
              CustomIcon={inProgress ? <SpinningLoader color={iconColorLabel} /> : undefined}
              emphasis={actionButtonEmphasis}
              label={inProgress ? undefined : actionButtonLabel}
              testID={isRemovingRecoveryPhrase ? ElementName.Continue : ElementName.Remove}
              onPress={onPress}
            />
          </Flex>
        )}
      </Flex>
    </BottomSheetModal>
  )
}
