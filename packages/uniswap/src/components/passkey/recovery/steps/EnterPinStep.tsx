import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import { Flex, SpinningLoader, Text, TouchableArea } from 'ui/src'
import { Eye } from 'ui/src/components/icons/Eye'
import { EyeOff } from 'ui/src/components/icons/EyeOff'
import { DigitInputRow } from 'uniswap/src/components/passkey/recovery/DigitInputRow'
import { StepHeader } from 'uniswap/src/components/passkey/recovery/StepHeader'
import type { DigitInputState } from 'uniswap/src/components/passkey/recovery/useDigitInput'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

export function EnterPinStep({
  recoveryWalletAddress,
  passcodeInput,
  showPasscode,
  setShowPasscode,
  pinError,
  cooldown,
  isDecrypting,
  handleBack,
  handleClose,
  headerActions,
  t,
}: {
  recoveryWalletAddress: string | undefined
  passcodeInput: DigitInputState
  showPasscode: boolean
  setShowPasscode: (v: boolean) => void
  pinError: string | undefined
  cooldown: { isActive: boolean; formattedTime: string }
  isDecrypting: boolean
  handleBack: () => void
  handleClose: () => void
  headerActions?: ReactNode | null
  t: TFunction
}): JSX.Element {
  return (
    <Trace logImpression modal={ModalName.RecoverWallet}>
      <StepHeader headerActions={headerActions} onBack={handleBack} onClose={handleClose} />
      <Flex gap="$gap16" alignItems="center" width="100%" px="$spacing4">
        <AccountIcon address={recoveryWalletAddress} size={48} />
        <Flex gap="$gap8" alignItems="center" maxWidth={360}>
          <Text variant="subheading1" textAlign="center">
            {t('account.passkey.recovery.pin.title')}
          </Text>
          <Text variant="body2" textAlign="center" color="$neutral2">
            {t('account.passkey.recovery.pin.description')}
          </Text>
        </Flex>
      </Flex>
      <Flex gap="$gap12" alignSelf="stretch">
        <DigitInputRow
          autoFocus
          digits={passcodeInput.digits}
          refs={passcodeInput.refs}
          inputType={showPasscode ? 'text' : 'password'}
          disabled={cooldown.isActive || isDecrypting}
          onChange={passcodeInput.handleChange}
          onKeyDown={passcodeInput.handleKeyDown}
          onPaste={passcodeInput.handlePaste}
        />
        {pinError && !cooldown.isActive && (
          <Text variant="body3" color="$statusCritical" textAlign="center">
            {pinError}
          </Text>
        )}
        {cooldown.isActive && (
          <Text variant="body3" color="$neutral2" textAlign="center">
            {t('account.passkey.recovery.cooldown', { time: cooldown.formattedTime })}
          </Text>
        )}
        {isDecrypting && (
          <Flex alignItems="center">
            <SpinningLoader size={16} />
          </Flex>
        )}
        <Flex alignItems="center">
          <TouchableArea variant="unstyled" onPress={() => setShowPasscode(!showPasscode)}>
            <Flex row gap="$gap4" alignItems="center">
              {showPasscode ? <EyeOff size="$icon.16" color="$neutral2" /> : <Eye size="$icon.16" color="$neutral2" />}
              <Text variant="buttonLabel3" color="$neutral2">
                {showPasscode ? t('common.hide.button') : t('common.show.button')}
              </Text>
            </Flex>
          </TouchableArea>
        </Flex>
      </Flex>
    </Trace>
  )
}
