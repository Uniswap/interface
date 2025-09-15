import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Input } from 'src/app/components/Input'
import { InfoModal, ModalProps } from 'src/app/components/modal/InfoModal'
import { PasswordInputWithBiometrics } from 'src/app/components/PasswordInput'
import { BiometricUnlockStorage } from 'src/app/features/biometricUnlock/BiometricUnlockStorage'
import { useUnlockWithBiometricCredentialMutation } from 'src/app/features/biometricUnlock/useUnlockWithBiometricCredentialMutation'
import { useUnlockWithPassword } from 'src/app/features/lockScreen/useUnlockWithPassword'
import { useSagaStatus } from 'src/app/hooks/useSagaStatus'
import { OnboardingRoutes, TopLevelRoutes } from 'src/app/navigation/constants'
import { focusOrCreateOnboardingTab } from 'src/app/navigation/focusOrCreateOnboardingTab'
import { Button, Flex, InputProps, Text } from 'ui/src'
import { AlertTriangleFilled, Lock } from 'ui/src/components/icons'
import { spacing, zIndexes } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'
import { LandingBackground } from 'wallet/src/components/landing/LandingBackground'
import { authSagaName } from 'wallet/src/features/auth/saga'
import { AuthSagaError } from 'wallet/src/features/auth/types'
import { EditAccountAction, editAccountActions } from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { SagaStatus } from 'wallet/src/utils/saga'

function usePasswordInput(defaultValue = ''): Pick<InputProps, 'onChangeText' | 'disabled'> & { value: string } {
  const [value, setValue] = useState(defaultValue)

  const onChangeText: InputProps['onChangeText'] = (newValue): void => {
    setValue(newValue)
  }

  return {
    value,
    disabled: !value,
    onChangeText,
  }
}

enum ForgotPasswordModalStep {
  Initial = 0,
  Speedbump = 1,
}

const CONTAINER_PADDING_TOP_MIN = 50
const CONTAINER_PADDING_TOP_MAX = 220
const BACKGROUND_CIRCLE_INNER_SIZE = 140
const BACKGROUND_CIRCLE_OUTER_SIZE = 250

export function Locked(): JSX.Element {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const { value: enteredPassword, onChangeText: onChangePasswordText } = usePasswordInput()
  const associatedAccounts = useSignerAccounts()

  const onChangeText = useCallback(
    (text: string) => {
      if (onChangePasswordText) {
        onChangePasswordText(text)
      }
    },
    [onChangePasswordText],
  )

  const { status, error } = useSagaStatus({ sagaName: authSagaName, resetSagaOnSuccess: false })

  const unlockWithPassword = useUnlockWithPassword()
  const onPressUnlockWithPassword = useEvent(() => unlockWithPassword({ password: enteredPassword }))

  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false)
  const [modalStep, setModalStep] = useState(ForgotPasswordModalStep.Initial)

  const openRecoveryTab = (): Promise<void> =>
    focusOrCreateOnboardingTab(`${TopLevelRoutes.Onboarding}/${OnboardingRoutes.Reset}`)

  const onStartResettingWallet = async (): Promise<void> => {
    const currAccount = associatedAccounts[0]

    if (currAccount?.mnemonicId) {
      await Keyring.removeMnemonic(currAccount.mnemonicId)
    }
    await Promise.all([Keyring.removePassword(), BiometricUnlockStorage.remove()])

    // We open the recovery tab before removing the accounts so that the proper reset route is loaded.
    // Otherwise, the main onboarding route is automatically loaded when accounts are all removed, and then a duplicate recovery tab is opened.
    // The standard onboarding open logic triggers but doesn't update the path because the generic one doesn't have a path specified.
    await openRecoveryTab()

    dispatch(
      editAccountActions.trigger({
        type: EditAccountAction.Remove,
        accounts: associatedAccounts,
      }),
    )
  }

  const isIncorrectPassword = status === SagaStatus.Failure && error === AuthSagaError.InvalidPassword

  const inputRef = useRef<Input>(null)
  const [hideInput, setHideInput] = useState(true)
  const toggleHideInput = (): void => setHideInput(!hideInput)

  useLayoutEffect(() => {
    if (isIncorrectPassword) {
      inputRef.current?.focus()
    }
  }, [isIncorrectPassword])

  const modalProps: Record<ForgotPasswordModalStep, ModalProps> = {
    [ForgotPasswordModalStep.Initial]: {
      buttonText: t('extension.lock.button.reset'),
      description: t('extension.lock.password.reset.initial.description'),
      linkText: t('extension.lock.password.reset.initial.help'),
      linkUrl: uniswapUrls.helpArticleUrls.recoveryPhraseHowToFind,
      icon: (
        <Flex backgroundColor="$surface2" borderRadius="$rounded12" p="$spacing12">
          <Lock color="$neutral1" size="$icon.24" />
        </Flex>
      ),
      isOpen: forgotPasswordModalOpen,
      name: ModalName.ForgotPassword,
      onButtonPress: (): void => setModalStep(ForgotPasswordModalStep.Speedbump),
      title: t('extension.lock.password.reset.initial.title'),
    },
    [ForgotPasswordModalStep.Speedbump]: {
      buttonText: t('common.button.continue'),
      description: t('extension.lock.password.reset.speedbump.description'),
      linkText: t('extension.lock.password.reset.speedbump.help'),
      linkUrl: uniswapUrls.helpArticleUrls.recoveryPhraseForgotten,
      icon: (
        <Flex backgroundColor="$statusCritical2" borderRadius="$rounded12" p="$spacing12">
          <AlertTriangleFilled color="$statusCritical" size="$icon.24" />
        </Flex>
      ),
      isOpen: forgotPasswordModalOpen,
      name: ModalName.ForgotPassword,
      onButtonPress: onStartResettingWallet,
      title: t('extension.lock.password.reset.speedbump.title'),
    },
  }

  const [inputHeight, setInputHeight] = useState(0)
  const [containerPaddingTop, setContainerPaddingTop] = useState(CONTAINER_PADDING_TOP_MAX)
  const [availableHeight, setAvailableHeight] = useState(0)

  useLayoutEffect(() => {
    if (availableHeight && inputHeight) {
      const containerHeight = inputHeight + spacing.spacing32
      const newPaddingTop = Math.min(
        Math.max(CONTAINER_PADDING_TOP_MIN, availableHeight - containerHeight),
        CONTAINER_PADDING_TOP_MAX,
      )

      setContainerPaddingTop(newPaddingTop)
    }
  }, [availableHeight, inputHeight])

  const { mutate: unlockWithBiometricCredential } = useUnlockWithBiometricCredentialMutation()

  return (
    <>
      <Flex fill gap="$spacing12" overflow="hidden" p="$spacing24">
        <Flex fill width="100%" onLayout={(e) => setAvailableHeight(e.nativeEvent.layout.height)}>
          <Flex pb="$spacing60" pt={containerPaddingTop}>
            <LandingBackground
              elementsStyle={{ filter: 'blur(2px)', transform: 'translate(0, 20px)' }}
              innerCircleSize={BACKGROUND_CIRCLE_INNER_SIZE}
              outerCircleSize={BACKGROUND_CIRCLE_OUTER_SIZE}
            />
          </Flex>
          <Flex
            gap="$spacing24"
            width="100%"
            zIndex={zIndexes.default}
            onLayout={(e) => setInputHeight(e.nativeEvent.layout.height)}
          >
            <Flex>
              <Text color="$neutral1" textAlign="center" variant="subheading1">
                {t('extension.lock.title')}
              </Text>

              <Text color="$neutral2" textAlign="center" variant="subheading2">
                {t('extension.lock.subtitle')}
              </Text>
            </Flex>

            <Flex alignItems="stretch" gap="$spacing12" width="100%">
              <PasswordInputWithBiometrics
                ref={inputRef}
                autoFocus
                hideInput={hideInput}
                placeholder={t('common.input.password.placeholder')}
                value={enteredPassword}
                onChangeText={onChangeText}
                onSubmitEditing={onPressUnlockWithPassword}
                onToggleHideInput={toggleHideInput}
                onPressBiometricUnlock={unlockWithBiometricCredential}
              />

              <Flex
                style={{
                  visibility: isIncorrectPassword ? 'visible' : 'hidden',
                }}
              >
                <Text color="$statusCritical" textAlign="center" variant="body3">
                  {t('extension.lock.password.error')}
                </Text>
              </Flex>
            </Flex>
          </Flex>
        </Flex>

        <Flex gap="$spacing12" justifyContent="flex-end" zIndex={zIndexes.sticky}>
          <Flex row>
            <Button size="large" variant="branded" onPress={onPressUnlockWithPassword}>
              {t('extension.lock.button.submit')}
            </Button>
          </Flex>

          <Flex row>
            <Button
              size="large"
              variant="default"
              emphasis="text-only"
              onPress={(): void => setForgotPasswordModalOpen(true)}
            >
              {t('extension.lock.button.forgot')}
            </Button>
          </Flex>
        </Flex>
      </Flex>

      <InfoModal
        showCloseButton
        buttonText={modalProps[modalStep].buttonText}
        buttonEmphasis="secondary"
        description={modalProps[modalStep].description}
        icon={modalProps[modalStep].icon}
        isOpen={forgotPasswordModalOpen}
        linkText={modalProps[modalStep].linkText}
        linkUrl={modalProps[modalStep].linkUrl}
        name={ModalName.ForgotPassword}
        title={modalProps[modalStep].title}
        onButtonPress={modalProps[modalStep].onButtonPress}
        onDismiss={(): void => {
          setModalStep(ForgotPasswordModalStep.Initial)
          setForgotPasswordModalOpen(false)
        }}
      />
    </>
  )
}
