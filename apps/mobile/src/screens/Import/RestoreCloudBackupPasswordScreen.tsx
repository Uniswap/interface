import { useFocusEffect } from '@react-navigation/core'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInput } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { PasswordInput } from 'src/components/input/PasswordInput'
import {
  incrementPasswordAttempts,
  resetLockoutEndTime,
  resetPasswordAttempts,
  setLockoutEndTime,
} from 'src/features/CloudBackup/passwordLockoutSlice'
import { restoreMnemonicFromCloudStorage } from 'src/features/CloudBackup/RNCloudStorageBackupsManager'
import { selectLockoutEndTime, selectPasswordAttempts } from 'src/features/CloudBackup/selectors'
import { PasswordError } from 'src/features/onboarding/PasswordError'
import { SafeKeyboardOnboardingScreen } from 'src/features/onboarding/SafeKeyboardOnboardingScreen'
import { onRestoreComplete } from 'src/screens/Import/onRestoreComplete'
import { useNavigationHeader } from 'src/utils/useNavigationHeader'
import { Button, Flex, Text, TouchableArea } from 'ui/src'
import { Cloud } from 'ui/src/components/icons'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ImportType } from 'uniswap/src/types/onboarding'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { getCloudProviderName } from 'uniswap/src/utils/cloud-backup/getCloudProviderName'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { MINUTES_IN_HOUR, ONE_HOUR_MS, ONE_MINUTE_MS } from 'utilities/src/time/time'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.RestoreCloudBackupPassword>

/**
 * If the attempt count does not correspond to a lockout then returns undefined. Otherwise returns the lockout time based on attempts. The lockout time logic is as follows:
 * after 6 attempts, lock out for 5 minutes
 * after 10 attempts, lock out for 15 minutes
 * after 12 attempts and any subsequent multiple of 2, lock out for another 1hr
 */
function calculateLockoutEndTime(attemptCount: number): number | undefined {
  if (attemptCount < 6) {
    return undefined
  }
  if (attemptCount === 6) {
    return Date.now() + ONE_MINUTE_MS * 5
  }
  if (attemptCount < 10) {
    return undefined
  }
  if (attemptCount === 10) {
    return Date.now() + ONE_MINUTE_MS * 15
  }
  if (attemptCount < 12) {
    return undefined
  }
  if (attemptCount % 2 === 0) {
    return Date.now() + ONE_HOUR_MS
  }
  return undefined
}

function useLockoutTimeMessage(remainingLockoutTime: number): string {
  const { t } = useTranslation()
  const minutes = Math.ceil(remainingLockoutTime / ONE_MINUTE_MS)
  if (minutes >= MINUTES_IN_HOUR) {
    return t('account.cloud.lockout.time.hours', { count: Math.floor(minutes / MINUTES_IN_HOUR) })
  }

  return t('account.cloud.lockout.time.minutes', { count: Math.floor(minutes) })
}

export function RestoreCloudBackupPasswordScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const inputRef = useRef<TextInput>(null)
  const dispatch = useDispatch()
  const { generateImportedAccounts } = useOnboardingContext()

  const passwordAttemptCount = useSelector(selectPasswordAttempts)
  const lockoutEndTime = useSelector(selectLockoutEndTime)

  const isRestoringMnemonic = params.importType === ImportType.RestoreMnemonic

  const [isLoading, setIsLoading] = useState(false)
  const [enteredPassword, setEnteredPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)

  const remainingLockoutTime = lockoutEndTime ? Math.max(0, lockoutEndTime - Date.now()) : 0
  const isLockedOut = remainingLockoutTime > 0
  const lockoutMessage = useLockoutTimeMessage(remainingLockoutTime)

  useFocusEffect(
    useCallback(() => {
      if (isLockedOut) {
        setErrorMessage(lockoutMessage)

        const timer = setTimeout(() => {
          setErrorMessage(undefined)
          dispatch(resetLockoutEndTime())
          inputRef.current?.focus()
        }, remainingLockoutTime)

        return () => clearTimeout(timer)
      }
      return undefined
    }, [isLockedOut, lockoutMessage, remainingLockoutTime, dispatch]),
  )

  useNavigationHeader(navigation)

  const onPasswordSubmit = async (): Promise<void> => {
    if (isLockedOut || enteredPassword.length === 0) {
      return
    }

    // Attempt to restore backup with encrypted mnemonic using password
    async function checkCorrectPassword(): Promise<void> {
      try {
        setIsLoading(true)
        await restoreMnemonicFromCloudStorage(params.mnemonicId, enteredPassword)
        await generateImportedAccounts({ mnemonicId: params.mnemonicId, backupType: BackupType.Cloud })

        dispatch(resetPasswordAttempts())
        setIsLoading(false)
        onRestoreComplete({
          isRestoringMnemonic,
          dispatch,
          params,
          navigation,
          screen: OnboardingScreens.RestoreCloudBackupPassword,
        })
      } catch (_error) {
        setIsLoading(false)
        dispatch(incrementPasswordAttempts())
        const updatedLockoutEndTime = calculateLockoutEndTime(passwordAttemptCount + 1)
        if (updatedLockoutEndTime) {
          dispatch(setLockoutEndTime({ lockoutEndTime: updatedLockoutEndTime }))
        } else {
          setErrorMessage(t('account.cloud.error.password.title'))
          inputRef.current?.focus()
        }
      }
    }

    await checkCorrectPassword()
    setEnteredPassword('')
    dismissNativeKeyboard()
  }

  const navigateToEnterRecoveryPhrase = (): void => {
    navigation.replace(OnboardingScreens.SeedPhraseInput, params)
  }

  return (
    <SafeKeyboardOnboardingScreen
      Icon={Cloud}
      subtitle={t('account.cloud.password.subtitle', { cloudProviderName: getCloudProviderName() })}
      title={t('account.cloud.password.title')}
      footer={
        <Flex row>
          <Button
            isDisabled={!enteredPassword || isLockedOut || isLoading}
            testID={TestID.Continue}
            variant="branded"
            size="large"
            my="$spacing12"
            mx="$spacing16"
            onPress={onPasswordSubmit}
          >
            {t('common.button.continue')}
          </Button>
        </Flex>
      }
    >
      <Flex>
        <PasswordInput
          ref={inputRef}
          autoFocus={!isLockedOut}
          editable={!isLockedOut}
          placeholder={t('account.cloud.password.input')}
          value={enteredPassword}
          onChangeText={(newValue: string): void => {
            if (!isLockedOut) {
              setErrorMessage(undefined)
            }
            setEnteredPassword(newValue)
          }}
          onSubmitEditing={onPasswordSubmit}
        />
        {errorMessage && <PasswordError errorText={errorMessage} />}
      </Flex>
      <Flex>
        {isRestoringMnemonic && (
          <TouchableArea onPress={navigateToEnterRecoveryPhrase}>
            <Text color="$accent1" mb="$spacing12" textAlign="center" variant="buttonLabel2">
              {t('account.cloud.password.recoveryPhrase')}
            </Text>
          </TouchableArea>
        )}
      </Flex>
    </SafeKeyboardOnboardingScreen>
  )
}
