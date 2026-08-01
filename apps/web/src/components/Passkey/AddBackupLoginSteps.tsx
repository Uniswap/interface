import type { UseMutationResult } from '@tanstack/react-query'
import type { TFunction } from 'i18next'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { Button, Flex, Input, ModalCloseIcon, SpinningLoader, Text, TouchableArea } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { AppleLogo } from 'ui/src/components/icons/AppleLogo'
import { Envelope } from 'ui/src/components/icons/Envelope'
import { Eye } from 'ui/src/components/icons/Eye'
import { EyeOff } from 'ui/src/components/icons/EyeOff'
import { GoogleLogoGradient } from 'ui/src/components/icons/GoogleLogoGradient'
import { LockViewfinder } from 'ui/src/components/icons/LockViewfinder'
import { Person } from 'ui/src/components/icons/Person'
import { Shield } from 'ui/src/components/icons/Shield'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import {
  BackupMethodSummary,
  DigitInputRow,
  type DigitInputState,
  IconBox,
  OptionRow,
  StepHeader,
} from '~/components/Passkey/BackupLoginComponents'
import { PrivyWatermark } from '~/components/Passkey/PrivyWatermark'
import { GetHelpButton } from '~/pages/ExtensionPasskeyAuthPopUp/views'

export function MethodSelectStep({
  handleClose,
  handleInitOAuth,
  oauthLoading,
  oauthProvider,
  onSelectEmail,
  t,
}: {
  handleClose: () => void
  handleInitOAuth: (provider: 'google' | 'apple') => void
  oauthLoading: boolean
  oauthProvider: 'google' | 'apple' | null
  onSelectEmail: () => void
  t: TFunction
}) {
  return (
    <Trace logImpression modal={ModalName.AddBackupLogin}>
      <Flex width="100%" alignItems="flex-end">
        <ModalCloseIcon size="$icon.20" onClose={handleClose} />
      </Flex>
      <Flex gap="$gap16" alignItems="center" width="100%" px="$padding4">
        <IconBox>
          <Shield size="$icon.24" color="$neutral1" />
        </IconBox>
        <Flex gap="$gap8" alignItems="center" maxWidth={360}>
          <Text variant="subheading1" textAlign="center">
            {t('account.passkey.backupLogin.add.title')}
          </Text>
          <Text variant="body2" textAlign="center" color="$neutral2">
            {t('account.passkey.backupLogin.add.description')}
          </Text>
        </Flex>
      </Flex>
      <Flex width="100%" borderRadius="$rounded16" overflow="hidden" gap="$spacing2">
        <OptionRow
          icon={<AppleLogo color="$neutral1" size="$icon.20" testID="apple-logo" />}
          label={t('account.passkey.backupLogin.add.apple')}
          onPress={() => handleInitOAuth('apple')}
          element={ElementName.AddBackupLoginApple}
          loading={oauthLoading && oauthProvider === 'apple'}
          disabled={oauthLoading && oauthProvider !== 'apple'}
        />
        <OptionRow
          icon={<GoogleLogoGradient size="$icon.20" />}
          label={t('account.passkey.backupLogin.add.google')}
          onPress={() => handleInitOAuth('google')}
          element={ElementName.AddBackupLoginGoogle}
          loading={oauthLoading && oauthProvider === 'google'}
          disabled={oauthLoading && oauthProvider !== 'google'}
        />
        <OptionRow
          icon={<Envelope size="$icon.20" color="$blueBase" />}
          label={t('account.passkey.backupLogin.add.email')}
          onPress={onSelectEmail}
          element={ElementName.AddBackupLoginEmail}
          disabled={oauthLoading && oauthProvider !== null}
        />
      </Flex>
      <PrivyWatermark />
    </Trace>
  )
}

export function EmailEntryStep({
  email,
  errorMessage,
  handleBack,
  handleClose,
  handleSendCode,
  isLoading,
  isValidEmail,
  setEmail,
  t,
}: {
  email: string
  errorMessage: string | undefined
  handleBack: () => void
  handleClose: () => void
  handleSendCode: () => void
  isLoading: boolean
  isValidEmail: boolean
  setEmail: Dispatch<SetStateAction<string>>
  t: TFunction
}) {
  return (
    <Trace logImpression modal={ModalName.AddBackupLogin}>
      <StepHeader onBack={handleBack} onClose={handleClose} />
      <Flex gap="$gap16" alignItems="center" width="100%" px="$padding4">
        <IconBox>
          <Person size="$icon.24" color="$neutral1" />
        </IconBox>
        <Flex gap="$gap8" alignItems="center" maxWidth={360}>
          <Text variant="subheading1" textAlign="center">
            {t('account.passkey.backupLogin.email.title')}
          </Text>
          <Text variant="body2" textAlign="center" color="$neutral2">
            {t('account.passkey.backupLogin.email.description')}
          </Text>
        </Flex>
      </Flex>
      <Flex width="100%" gap="$gap16">
        <Input
          placeholder={t('account.passkey.backupLogin.email.title')}
          placeholderTextColor="$neutral3"
          value={email}
          onChangeText={(v) => setEmail(v.trim())}
          onSubmitEditing={handleSendCode}
          keyboardType="email-address"
          autoComplete="email"
          autoFocus
          height={60}
          backgroundColor="$surface2"
          borderWidth={1}
          borderColor="$surface3"
          borderRadius="$rounded20"
          px="$padding20"
          color="$neutral1"
          fontSize={18}
          fontWeight="$book"
        />
        {errorMessage && (
          <Text variant="body3" color="$statusCritical" textAlign="center">
            {errorMessage}
          </Text>
        )}
        <Flex row alignSelf="stretch">
          <Button
            variant={isValidEmail ? 'branded' : 'default'}
            size="large"
            onPress={handleSendCode}
            disabled={!isValidEmail || isLoading}
          >
            {t('common.button.continue')}
          </Button>
        </Flex>
      </Flex>
    </Trace>
  )
}

export function EmailCodeStep({
  email,
  errorMessage,
  handleBack,
  handleClose,
  handleResendCode,
  otpInput,
  submitCodeMutation,
  t,
}: {
  email: string
  errorMessage: string | undefined
  handleBack: () => void
  handleClose: () => void
  handleResendCode: () => void
  otpInput: DigitInputState
  submitCodeMutation: UseMutationResult<unknown, Error, string>
  t: TFunction
}) {
  return (
    <Trace logImpression modal={ModalName.AddBackupLogin}>
      <StepHeader onBack={handleBack} onClose={handleClose} />
      <Flex gap="$gap16" alignItems="center" width="100%">
        <IconBox>
          <Envelope size="$icon.24" color="$neutral1" />
        </IconBox>
        <Flex gap="$gap8" alignItems="center" maxWidth={360}>
          <Text variant="subheading1" textAlign="center">
            {t('account.passkey.backupLogin.code.title')}
          </Text>
          <Text variant="body2" textAlign="center" color="$neutral2">
            {t('account.passkey.backupLogin.code.description', { email })}
          </Text>
        </Flex>
      </Flex>
      <DigitInputRow
        digits={otpInput.digits}
        refs={otpInput.refs}
        onChange={otpInput.handleChange}
        onKeyDown={otpInput.handleKeyDown}
        onPaste={otpInput.handlePaste}
        autoFocus
        disabled={submitCodeMutation.isPending}
      />
      {submitCodeMutation.isPending && (
        <Flex row gap="$gap8" alignItems="center" justifyContent="center">
          <SpinningLoader size={16} />
          <Text variant="body3" color="$neutral2">
            {t('account.passkey.backupLogin.code.verifying')}
          </Text>
        </Flex>
      )}
      {errorMessage && (
        <Text variant="body3" color="$statusCritical" textAlign="center">
          {errorMessage}
        </Text>
      )}
      <Trace logPress element={ElementName.AddBackupLoginResendCode}>
        <TouchableArea variant="unstyled" onPress={handleResendCode} disabled={submitCodeMutation.isPending}>
          <Text variant="buttonLabel3" color="$accent1">
            {t('account.passkey.backupLogin.code.resend')}
          </Text>
        </TouchableArea>
      </Trace>
    </Trace>
  )
}

function getMethodLabel(provider: 'google' | 'apple' | null, t: TFunction): string {
  if (provider === 'google') {
    return t('account.passkey.backupLogin.alreadyInUse.method.google')
  }
  if (provider === 'apple') {
    return t('account.passkey.backupLogin.alreadyInUse.method.apple')
  }
  return t('account.passkey.backupLogin.alreadyInUse.method.email')
}

export function AlreadyInUseStep({
  handleClose,
  handleSignOut,
  handleTryAgain,
  oauthProvider,
  t,
}: {
  handleClose: () => void
  handleSignOut: () => void
  handleTryAgain: () => void
  oauthProvider: 'google' | 'apple' | null
  t: TFunction
}) {
  const methodLabel = getMethodLabel(oauthProvider, t)
  return (
    <Trace logImpression modal={ModalName.AddBackupLogin}>
      <Flex gap={0}>
        <Flex row width="100%" justifyContent="flex-end" alignItems="center" gap="$gap12">
          <GetHelpButton t={t} />
          <ModalCloseIcon size="$icon.20" onClose={handleClose} />
        </Flex>
        <Flex gap="$gap16" alignItems="center" width="100%" px="$padding4" mt={0}>
          <IconBox>
            <AlertTriangleFilled size="$icon.24" color="$neutral1" />
          </IconBox>
          <Flex gap="$gap8" alignItems="center" maxWidth={360}>
            <Text variant="subheading1" textAlign="center">
              {t('account.passkey.backupLogin.alreadyInUse.title')}
            </Text>
            <Text variant="body2" textAlign="center" color="$neutral2">
              {t('account.passkey.backupLogin.alreadyInUse.body', { methodLabel })}
            </Text>
            <Text variant="body2" textAlign="center" color="$neutral2">
              {t('account.passkey.backupLogin.alreadyInUse.suffix')}
            </Text>
          </Flex>
        </Flex>
      </Flex>
      <Flex row width="100%" gap="$gap8">
        <Trace logPress element={ElementName.AddBackupLoginAlreadyInUseSignOut}>
          <Flex row flex={1} alignSelf="stretch">
            <Button variant="default" emphasis="tertiary" size="medium" onPress={handleSignOut}>
              {t('common.button.signOut')}
            </Button>
          </Flex>
        </Trace>
        <Trace logPress element={ElementName.AddBackupLoginAlreadyInUseTryAgain}>
          <Flex row flex={1} alignSelf="stretch">
            <Button variant="default" emphasis="secondary" size="medium" onPress={handleTryAgain}>
              {t('common.button.tryAgain')}
            </Button>
          </Flex>
        </Trace>
      </Flex>
    </Trace>
  )
}

export function PasscodeIntroStep({
  email,
  handleClose,
  oauthEmail,
  oauthProvider,
  onSetPasscode,
  t,
  title,
  description,
}: {
  email: string
  handleClose: () => void
  oauthEmail: string | undefined
  oauthProvider: 'google' | 'apple' | null
  onSetPasscode: () => void
  t: TFunction
  // Reconnect (rotation) overrides; default to the add-backup-login copy.
  title?: string
  description?: string
}) {
  return (
    <Trace logImpression modal={ModalName.AddBackupLogin}>
      <Flex width="100%" alignItems="flex-end">
        <ModalCloseIcon size="$icon.20" onClose={handleClose} />
      </Flex>
      <Flex gap="$gap16" alignItems="center" width="100%" px="$padding4">
        <IconBox>
          <Shield size="$icon.24" color="$neutral1" />
        </IconBox>
        <Flex gap="$gap8" alignItems="center" maxWidth={360}>
          <Text variant="subheading1" textAlign="center">
            {title ?? t('account.passkey.backupLogin.passcodeIntro.title')}
          </Text>
          <Text variant="body2" textAlign="center" color="$neutral2">
            {description ?? t('account.passkey.backupLogin.passcodeIntro.description')}
          </Text>
        </Flex>
      </Flex>
      <Flex
        width="100%"
        borderWidth={1}
        borderColor="$surface3"
        borderRadius="$rounded20"
        p="$padding16"
        shadowColor="rgba(0,0,0,0.03)"
        shadowOffset={{ width: 0, height: 1 }}
        shadowRadius={6}
      >
        <BackupMethodSummary provider={oauthProvider} email={oauthProvider ? oauthEmail : email} size="lg" />
      </Flex>
      <Trace logPress element={ElementName.AddBackupLoginSetPasscode}>
        <Flex row alignSelf="stretch">
          <Button variant="default" size="medium" onPress={onSetPasscode}>
            {t('common.button.continue')}
          </Button>
        </Flex>
      </Trace>
    </Trace>
  )
}

export function PasscodeStep({
  children,
  description,
  digitInput,
  handleBack,
  handleClose,
  inputsLocked = false,
  isEncrypting,
  modalName = ModalName.AddBackupLogin,
  passcodeError,
  setShowPasscode,
  showPasscode,
  t,
  title,
}: {
  children?: ReactNode
  description: string
  digitInput: DigitInputState
  handleBack: () => void
  handleClose: () => void
  // Prevent digit edits after encryption succeeds while the WebAuthn prompt is pending.
  inputsLocked?: boolean
  isEncrypting: boolean
  modalName?: (typeof ModalName)[keyof typeof ModalName]
  passcodeError: string | undefined
  setShowPasscode: Dispatch<SetStateAction<boolean>>
  showPasscode: boolean
  t: TFunction
  title: string
}) {
  const inputsDisabled = isEncrypting || inputsLocked
  return (
    <Trace logImpression modal={modalName}>
      <StepHeader onBack={handleBack} onClose={handleClose} />
      <Flex gap="$gap16" alignItems="center" width="100%" px="$padding4">
        <IconBox>
          <LockViewfinder size="$icon.24" color="$neutral1" />
        </IconBox>
        <Flex gap="$gap8" alignItems="center" maxWidth={360}>
          <Text variant="subheading1" textAlign="center">
            {title}
          </Text>
          <Text variant="body2" textAlign="center" color="$neutral2">
            {description}
          </Text>
        </Flex>
      </Flex>
      <Flex gap="$gap12" alignSelf="stretch">
        <DigitInputRow
          digits={digitInput.digits}
          refs={digitInput.refs}
          onChange={digitInput.handleChange}
          onKeyDown={digitInput.handleKeyDown}
          onPaste={digitInput.handlePaste}
          inputType={showPasscode ? 'text' : 'password'}
          autoFocus
          disabled={inputsDisabled}
        />
        {passcodeError && (
          <Text variant="body3" color="$statusCritical" textAlign="center">
            {passcodeError}
          </Text>
        )}
        <Flex row alignItems="center" justifyContent="center" minHeight={28}>
          {isEncrypting ? (
            <Flex row gap="$gap8" alignItems="center">
              <SpinningLoader size={16} unstyled color="$neutral2" />
              <Text variant="buttonLabel3" color="$neutral2">
                {t('account.passkey.backupLogin.passcode.encrypting')}
              </Text>
            </Flex>
          ) : (
            <TouchableArea variant="unstyled" onPress={() => setShowPasscode(!showPasscode)} disabled={inputsDisabled}>
              <Flex row gap="$gap4" alignItems="center">
                {showPasscode ? (
                  <EyeOff size="$icon.16" color="$neutral2" />
                ) : (
                  <Eye size="$icon.16" color="$neutral2" />
                )}
                <Text variant="buttonLabel3" color="$neutral2">
                  {showPasscode ? t('common.hide.button') : t('common.show.button')}
                </Text>
              </Flex>
            </TouchableArea>
          )}
        </Flex>
      </Flex>
      {children}
    </Trace>
  )
}
