import type { UseMutationResult } from '@tanstack/react-query'
import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import { Flex, SpinningLoader, Text, TouchableArea } from 'ui/src'
import { Envelope } from 'ui/src/components/icons/Envelope'
import { DigitInputRow } from 'uniswap/src/components/passkey/recovery/DigitInputRow'
import { IconBox } from 'uniswap/src/components/passkey/recovery/IconBox'
import { StepHeader } from 'uniswap/src/components/passkey/recovery/StepHeader'
import type { DigitInputState } from 'uniswap/src/components/passkey/recovery/useDigitInput'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

export function EmailCodeStep({
  email,
  otpInput,
  submitCodeMutation,
  resendCodeMutation,
  errorMessage,
  isReady = true,
  handleBack,
  handleClose,
  headerActions,
  t,
}: {
  email: string
  otpInput: DigitInputState
  submitCodeMutation: UseMutationResult<void, Error, string>
  resendCodeMutation: UseMutationResult<void, Error, void>
  errorMessage: string | undefined
  isReady?: boolean
  handleBack: () => void
  handleClose: () => void
  headerActions?: ReactNode | null
  t: TFunction
}): JSX.Element {
  const resendDisabled = submitCodeMutation.isPending || !isReady
  return (
    <Trace logImpression modal={ModalName.RecoverWallet}>
      <StepHeader headerActions={headerActions} onBack={handleBack} onClose={handleClose} />
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
        autoFocus
        digits={otpInput.digits}
        refs={otpInput.refs}
        disabled={submitCodeMutation.isPending || !isReady}
        onChange={otpInput.handleChange}
        onKeyDown={otpInput.handleKeyDown}
        onPaste={otpInput.handlePaste}
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
      <Trace logPress element={ElementName.RecoverWalletResendCode}>
        <TouchableArea
          variant="unstyled"
          disabled={resendDisabled}
          onPress={() => {
            otpInput.reset()
            resendCodeMutation.mutate()
          }}
        >
          <Text variant="buttonLabel3" color="$accent1">
            {t('account.passkey.backupLogin.code.resend')}
          </Text>
        </TouchableArea>
      </Trace>
    </Trace>
  )
}
