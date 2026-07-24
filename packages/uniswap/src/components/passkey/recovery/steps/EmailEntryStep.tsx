import type { UseMutationResult } from '@tanstack/react-query'
import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import { Button, Flex, Input, Text } from 'ui/src'
import { Person } from 'ui/src/components/icons/Person'
import { IconBox } from 'uniswap/src/components/passkey/recovery/IconBox'
import { StepHeader } from 'uniswap/src/components/passkey/recovery/StepHeader'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

export function EmailEntryStep({
  email,
  setEmail,
  isValidEmail,
  isLoading,
  isReady = true,
  errorMessage,
  sendCodeMutation,
  handleBack,
  handleClose,
  headerActions,
  hideBack,
  t,
}: {
  email: string
  setEmail: (v: string) => void
  isValidEmail: boolean
  isLoading: boolean
  isReady?: boolean
  errorMessage: string | undefined
  sendCodeMutation: UseMutationResult<void, Error, void>
  handleBack: () => void
  handleClose: () => void
  headerActions?: ReactNode | null
  hideBack?: boolean
  t: TFunction
}): JSX.Element {
  const canSubmit = isValidEmail && !isLoading && isReady
  return (
    <Trace logImpression modal={ModalName.RecoverWallet}>
      <StepHeader headerActions={headerActions} hideBack={hideBack} onBack={handleBack} onClose={handleClose} />
      <Flex gap="$gap16" alignItems="center" width="100%" px="$spacing4">
        <IconBox>
          <Person size="$icon.24" color="$neutral1" />
        </IconBox>
        <Flex gap="$gap8" alignItems="center" maxWidth={320}>
          <Text variant="subheading1" textAlign="center">
            {t('account.passkey.recovery.email.title')}
          </Text>
          <Text variant="body2" textAlign="center" color="$neutral2">
            {t('account.passkey.recovery.email.description')}
          </Text>
        </Flex>
      </Flex>
      <Flex width="100%" gap="$gap16">
        <Input
          autoFocus
          placeholder={t('account.passkey.recovery.email.title')}
          placeholderTextColor="$neutral3"
          value={email}
          keyboardType="email-address"
          autoComplete="email"
          height={60}
          backgroundColor="$surface2"
          borderWidth={1}
          borderColor="$surface3"
          borderRadius="$rounded20"
          px="$spacing20"
          color="$neutral1"
          fontSize={18}
          fontWeight="$book"
          disabled={isLoading}
          onChangeText={(v) => setEmail(v.trim())}
          onSubmitEditing={() => {
            if (canSubmit) {
              sendCodeMutation.mutate()
            }
          }}
        />
        {errorMessage && (
          <Text variant="body3" color="$statusCritical" textAlign="center">
            {errorMessage}
          </Text>
        )}
        <Trace logPress element={ElementName.RecoverWalletEmail}>
          <Flex row alignSelf="stretch">
            <Button
              variant={isValidEmail ? 'branded' : 'default'}
              size="large"
              disabled={!canSubmit}
              onPress={() => sendCodeMutation.mutate()}
            >
              {t('common.button.continue')}
            </Button>
          </Flex>
        </Trace>
      </Flex>
    </Trace>
  )
}
