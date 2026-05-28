import type { TFunction } from 'i18next'
import { Button, Flex, Text, TouchableArea } from 'ui/src'
import { Person } from 'ui/src/components/icons/Person'
import { IconBox } from 'uniswap/src/components/passkey/recovery/IconBox'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

// Canonical location for these steps: `uniswap/src/components/passkey/recovery/steps/*`.
// Re-exported here so existing web imports keep resolving; prefer the canonical path
// in new code.
export { EmailCodeStep } from 'uniswap/src/components/passkey/recovery/steps/EmailCodeStep'
export { EmailEntryStep } from 'uniswap/src/components/passkey/recovery/steps/EmailEntryStep'
export { EnterPinStep } from 'uniswap/src/components/passkey/recovery/steps/EnterPinStep'
export { OAuthLoadingStep } from 'uniswap/src/components/passkey/recovery/steps/OAuthLoadingStep'
export { RecoveringStep } from 'uniswap/src/components/passkey/recovery/steps/RecoveringStep'

// AddPasskeyStep stays web-only — it is the "register new passkey" confirmation step,
// used exclusively by the add-passkey recovery flow (not by the seed-phrase export flow).
export function AddPasskeyStep({
  addPasskeyError,
  handleAddPasskey,
  handleClose,
  t,
}: {
  addPasskeyError: string | undefined
  handleAddPasskey: () => void
  handleClose: () => void
  t: TFunction
}): JSX.Element {
  return (
    <Trace logImpression modal={ModalName.RecoverWallet}>
      <Flex height={28} />
      <Flex gap="$gap16" alignItems="center" width="100%" px="$padding4">
        <IconBox background="$accent2">
          <Person size="$icon.24" color="$accent1" />
        </IconBox>
        <Flex gap="$gap8" alignItems="center" maxWidth={360}>
          <Text variant="subheading1" textAlign="center">
            {t('account.passkey.recovery.addPasskey.title')}
          </Text>
          <Text variant="body2" textAlign="center" color="$neutral2">
            {t('account.passkey.recovery.addPasskey.description')}
          </Text>
        </Flex>
      </Flex>
      <Flex gap="$gap16" alignItems="center" width="100%">
        {addPasskeyError && (
          <Text variant="body3" color="$statusCritical" textAlign="center">
            {addPasskeyError}
          </Text>
        )}
        <Trace logPress element={ElementName.RecoverWalletAddPasskey}>
          <Flex row alignSelf="stretch">
            <Button variant="branded" size="medium" onPress={handleAddPasskey}>
              {t('account.passkey.recovery.addPasskey.button')}
            </Button>
          </Flex>
        </Trace>
        <Trace logPress element={ElementName.RecoverWalletSignOut}>
          <TouchableArea variant="unstyled" onPress={handleClose}>
            <Text variant="buttonLabel2" color="$neutral2">
              {t('account.passkey.recovery.signOut')}
            </Text>
          </TouchableArea>
        </Trace>
      </Flex>
    </Trace>
  )
}
