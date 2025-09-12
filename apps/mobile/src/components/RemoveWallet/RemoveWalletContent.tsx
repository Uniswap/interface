import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { AssociatedAccountsList } from 'src/components/RemoveWallet/AssociatedAccountsList'
import { RemoveLastMnemonicWalletFooter } from 'src/components/RemoveWallet/RemoveLastMnemonicWalletFooter'
import { RemoveWalletStep, useModalContent } from 'src/components/RemoveWallet/useModalContent'
import { determineRemoveWalletConditions } from 'src/components/RemoveWallet/utils/determineRemoveWalletConditions'
import { navigateToOnboardingImportMethod } from 'src/components/RemoveWallet/utils/navigateToOnboardingImportMethod'
import { useBiometricAppSettings } from 'src/features/biometrics/useBiometricAppSettings'
import { useBiometricPrompt } from 'src/features/biometricsSettings/hooks'
import { Button, Flex, Text, ThemeKeys, useSporeColors } from 'ui/src'
import { ElementName, WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { MobileScreens, OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { logger } from 'utilities/src/logger/logger'
import { EditAccountAction, editAccountActions } from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { useAccounts, useSignerAccounts } from 'wallet/src/features/wallet/hooks'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { setFinishedOnboarding } from 'wallet/src/features/wallet/slice'

type RemoveWalletContentProps = {
  address?: Address
  replaceMnemonic?: boolean
  onClose?: () => void
}

export const RemoveWalletContent = ({
  address,
  replaceMnemonic = false,
  onClose,
}: RemoveWalletContentProps): JSX.Element | null => {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const dispatch = useDispatch()

  const signerAccounts = useSignerAccounts()
  const accountsMap = useAccounts()
  const { targetAccount, hasAccountsLeftAfterRemoval, accountsToRemove, shouldRemoveMnemonic } =
    determineRemoveWalletConditions({ accountsMap, signerAccounts, targetAddress: address, replaceMnemonic })

  const [inProgress, setInProgress] = useState(false)
  const [currentStep, setCurrentStep] = useState<RemoveWalletStep>(
    shouldRemoveMnemonic ? RemoveWalletStep.Warning : RemoveWalletStep.Final,
  )

  const handleOnClose = useCallback((): void => {
    if (onClose) {
      onClose()
    }
  }, [onClose])

  const onRemoveWallet = useCallback((): void => {
    handleOnClose()
    if (!hasAccountsLeftAfterRemoval) {
      // user has no accounts left, so we bring onboarding back
      dispatch(setFinishedOnboarding({ finishedOnboarding: false }))
      navigateToOnboardingImportMethod()
    } else if (replaceMnemonic) {
      // there are account left and it's replacing, user has view-only accounts left
      navigate(MobileScreens.OnboardingStack, {
        screen: OnboardingScreens.ImportMethod,
        params: {
          importType: ImportType.NotYetSelected,
          entryPoint: OnboardingEntryPoint.Sidebar,
        },
      })
    }

    if (shouldRemoveMnemonic) {
      if (signerAccounts[0]) {
        Keyring.removeMnemonic(signerAccounts[0].mnemonicId)
          .then(() => {
            // Only remove accounts if mnemonic is successfully removed
            dispatch(
              editAccountActions.trigger({
                type: EditAccountAction.Remove,
                accounts: accountsToRemove,
              }),
            )
          })
          .catch((error) => {
            logger.error(error, {
              tags: { file: 'RemoveWalletModal', function: 'Keyring.removeMnemonic' },
            })
          })
      }
    } else {
      dispatch(
        editAccountActions.trigger({
          type: EditAccountAction.Remove,
          accounts: accountsToRemove,
        }),
      )
    }

    sendAnalyticsEvent(WalletEventName.WalletRemoved, {
      wallets_removed: accountsToRemove.map((a) => a.address),
    })

    setInProgress(false)
  }, [
    signerAccounts,
    dispatch,
    replaceMnemonic,
    hasAccountsLeftAfterRemoval,
    handleOnClose,
    accountsToRemove,
    shouldRemoveMnemonic,
  ])

  const { trigger } = useBiometricPrompt(
    () => {
      onRemoveWallet()
    },
    () => {
      setInProgress(false)
    },
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

    switch (currentStep) {
      case RemoveWalletStep.Warning:
        setCurrentStep(RemoveWalletStep.Final)
        break
      case RemoveWalletStep.Final:
        setInProgress(true)
        await onRemoveWalletPress()
        break
    }
  }

  const modalContent = useModalContent({
    account: targetAccount,
    isReplacing: replaceMnemonic,
    currentStep,
    isRemovingRecoveryPhrase: shouldRemoveMnemonic,
    associatedAccounts: signerAccounts,
  })

  if (!modalContent) {
    return null
  }

  const { title, description, Icon, iconColorLabel, actionButtonLabel, iconBackgroundColor } = modalContent

  const labelColor: ThemeKeys = iconColorLabel
  const backgroundColor: ThemeKeys = iconBackgroundColor

  return (
    <Flex gap="$spacing24" px="$spacing24" py="$spacing24">
      <Flex centered gap="$spacing16">
        <Flex
          centered
          borderRadius="$rounded12"
          p="$spacing12"
          style={{
            backgroundColor: colors[backgroundColor].val,
          }}
        >
          <Icon color={colors[labelColor].val} size="$icon.24" />
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
        {currentStep === RemoveWalletStep.Final && shouldRemoveMnemonic ? (
          <>
            <AssociatedAccountsList accounts={signerAccounts} />
            <RemoveLastMnemonicWalletFooter inProgress={inProgress} onPress={onPress} />
          </>
        ) : (
          <Flex row gap={inProgress ? '$none' : '$spacing12'} pt="$spacing12">
            <Button size="large" emphasis="tertiary" isDisabled={inProgress} onPress={handleOnClose}>
              {t('common.button.cancel')}
            </Button>

            <Button
              size="large"
              emphasis="secondary"
              loading={inProgress}
              testID={shouldRemoveMnemonic ? ElementName.Continue : ElementName.Remove}
              onPress={onPress}
            >
              {actionButtonLabel}
            </Button>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
