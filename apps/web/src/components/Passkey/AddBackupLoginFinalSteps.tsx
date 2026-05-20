import type { TFunction } from 'i18next'
import { Button, Flex, SpinningLoader, Text, TouchableArea } from 'ui/src'
import { Lock } from 'ui/src/components/icons/Lock'
import { ShieldCheck } from 'ui/src/components/icons/ShieldCheck'
import { X } from 'ui/src/components/icons/X'
import type { EncryptedRecoveryState } from 'uniswap/src/features/passkey/embeddedWallet'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { BackupMethodSummary, IconBox } from '~/components/Passkey/BackupLoginComponents'

export function ConfirmPasscodeExtra({
  cryptoResult,
  handleSignInWithPasskey,
  isSigningIn,
  t,
}: {
  cryptoResult: EncryptedRecoveryState | null
  handleSignInWithPasskey: () => void
  isSigningIn: boolean
  t: TFunction
}) {
  if (!cryptoResult) {
    return null
  }
  return (
    <Flex row alignSelf="stretch" pt="$spacing4">
      <Button variant="branded" size="medium" onPress={handleSignInWithPasskey} isDisabled={isSigningIn}>
        {isSigningIn ? <SpinningLoader size={20} /> : t('swap.button.submitting.passkey')}
      </Button>
    </Flex>
  )
}

export function SuccessStep({
  email,
  handleClose,
  handleDone,
  oauthEmail,
  oauthProvider,
  t,
}: {
  email: string
  handleClose: () => void
  handleDone: () => void
  oauthEmail: string | undefined
  oauthProvider: 'google' | 'apple' | null
  t: TFunction
}) {
  return (
    <Trace logImpression modal={ModalName.AddBackupLogin}>
      <Flex width="100%" alignItems="flex-end">
        <TouchableArea variant="unstyled" onPress={handleClose}>
          <X size="$icon.20" color="$neutral2" />
        </TouchableArea>
      </Flex>
      <Flex gap="$gap16" alignItems="center" width="100%" px="$padding4">
        <IconBox background="$statusSuccess2">
          <ShieldCheck size="$icon.24" color="$statusSuccess" />
        </IconBox>
        <Flex gap="$gap8" alignItems="center" maxWidth={360}>
          <Text variant="subheading1" textAlign="center">
            {t('account.passkey.backupLogin.success.title')}
          </Text>
          <Text variant="body2" textAlign="center" color="$neutral2">
            {oauthProvider
              ? t('account.passkey.backupLogin.success.description.oauth', {
                  provider: oauthProvider === 'google' ? 'Google' : 'Apple',
                })
              : t('account.passkey.backupLogin.success.description')}
          </Text>
        </Flex>
      </Flex>
      <Flex
        width="100%"
        borderWidth={1}
        borderColor="$surface3"
        borderRadius="$rounded20"
        p="$padding16"
        gap="$gap12"
        shadowColor="rgba(0,0,0,0.03)"
        shadowOffset={{ width: 0, height: 1 }}
        shadowRadius={6}
      >
        <BackupMethodSummary provider={oauthProvider} email={oauthProvider ? oauthEmail : email} size="lg" />
        <Flex
          row
          gap="$gap16"
          alignItems="center"
          height={40}
          p="$padding12"
          backgroundColor="$statusSuccess2"
          borderRadius="$rounded12"
        >
          <Lock size="$icon.24" color="$statusSuccess" />
          <Text variant="body3" color="$statusSuccess" flex={1}>
            {t('account.passkey.backupLogin.success.secured')}
          </Text>
        </Flex>
      </Flex>
      <Trace logPress element={ElementName.AddBackupLoginDone}>
        <Flex row alignSelf="stretch">
          <Button variant="default" size="medium" onPress={handleDone}>
            {t('common.done')}
          </Button>
        </Flex>
      </Trace>
    </Trace>
  )
}
