import type { TFunction } from 'i18next'
import { Anchor, Button, Flex, ModalCloseIcon, Text, TouchableArea } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { Person } from 'ui/src/components/icons/Person'
import { Shield } from 'ui/src/components/icons/Shield'
import { WalletFilled } from 'ui/src/components/icons/WalletFilled'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
import { BackupMethodSummary } from 'uniswap/src/components/passkey/recovery/BackupMethodSummary'
import { IconBox } from 'uniswap/src/components/passkey/recovery/IconBox'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { OverflowMenu } from '~/components/Passkey/OverflowMenu'

// Canonical location for these steps: `uniswap/src/components/passkey/recovery/steps/*`.
// Re-exported here so existing web imports keep resolving; prefer the canonical path
// in new code.
export { EmailCodeStep } from 'uniswap/src/components/passkey/recovery/steps/EmailCodeStep'
export { EmailEntryStep } from 'uniswap/src/components/passkey/recovery/steps/EmailEntryStep'
export { EnterPinStep } from 'uniswap/src/components/passkey/recovery/steps/EnterPinStep'
export { OAuthLoadingStep } from 'uniswap/src/components/passkey/recovery/steps/OAuthLoadingStep'
export { RecoveringStep } from 'uniswap/src/components/passkey/recovery/steps/RecoveringStep'

// AddPasskeyStep stays web-only — it is the "register new passkey" confirmation step,
// used by the add-passkey recovery flow (not by the seed-phrase export flow). `isRotation`
// switches to the post-rotation styling (Figma 12482-89550): the recovered wallet's
// AddressDisplay, dark CTA, and "add a passkey for this device" copy. Normal v2 recovery
// keeps the default look.
export function AddPasskeyStep({
  addPasskeyError,
  handleAddPasskey,
  handleClose,
  isRotation,
  walletAddress,
  t,
}: {
  addPasskeyError: string | undefined
  handleAddPasskey: () => void
  handleClose: () => void
  isRotation?: boolean
  walletAddress?: string
  t: TFunction
}): JSX.Element {
  return (
    <Trace logImpression modal={ModalName.RecoverWallet}>
      <Flex height={28} />
      <Flex gap="$gap16" alignItems="center" width="100%" px="$padding4">
        {isRotation && walletAddress ? (
          // Give AddressDisplay a definite full width so the wallet name + unitag icon stay on one
          // line (a shrink-to-content parent collapses to the name word and wraps the icon below).
          <Flex row width="100%" justifyContent="center">
            <Flex flex={1} justifyContent="center">
              <AddressDisplay
                address={walletAddress}
                size={48}
                direction="column"
                centered
                variant="body1"
                captionVariant="body3"
              />
            </Flex>
          </Flex>
        ) : (
          <IconBox background="$accent2">
            {isRotation ? (
              <WalletFilled size="$icon.24" color="$accent1" />
            ) : (
              <Person size="$icon.24" color="$accent1" />
            )}
          </IconBox>
        )}
        <Flex gap="$gap8" alignItems="center" maxWidth={360}>
          <Text variant="subheading1" textAlign="center">
            {isRotation
              ? t('account.passkey.recovery.addPasskey.rotation.title')
              : t('account.passkey.recovery.addPasskey.title')}
          </Text>
          <Text variant="body2" textAlign="center" color="$neutral2">
            {isRotation
              ? t('account.passkey.recovery.addPasskey.rotation.description')
              : t('account.passkey.recovery.addPasskey.description')}
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
            <Button variant={isRotation ? 'default' : 'branded'} size="medium" onPress={handleAddPasskey}>
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

// --- Passkey-less rotation steps (recover-with-email on a v1 backup login) ---

// "Update your passcode" alert (Figma 12482-89035): explains the security upgrade, links the
// passkey help article, and shows the affected method with an overflow menu (delete via passkey)
// plus a "new passcode required" badge. "Update passcode" continues into the set-new-passcode flow.
export function RotationIntroStep({
  provider,
  email,
  onContinue,
  onRemove,
  handleClose,
  t,
}: {
  provider: 'google' | 'apple' | null
  email: string
  onContinue: () => void
  onRemove: () => void
  handleClose: () => void
  t: TFunction
}): JSX.Element {
  return (
    <Trace logImpression modal={ModalName.RecoverWallet}>
      <Flex width="100%" alignItems="flex-end">
        <ModalCloseIcon size="$icon.20" onClose={handleClose} />
      </Flex>
      <Flex gap="$gap16" alignItems="center" width="100%" px="$padding4">
        <IconBox>
          <Shield size="$icon.24" color="$neutral1" />
        </IconBox>
        <Flex gap="$gap8" alignItems="center" maxWidth={360}>
          <Text variant="subheading1" textAlign="center">
            {t('account.passkey.reconnect.passcodeIntro.title')}
          </Text>
          <Text variant="body2" textAlign="center" color="$neutral2">
            {t('account.passkey.recovery.updatePasscode.description')}
          </Text>
          <Anchor href={UniswapHelpUrls.articles.passkeysInfo} target="_blank" textDecorationLine="none">
            <Text variant="buttonLabel3" color="$neutral1">
              {t('account.passkey.reconnect.learnMore')}
            </Text>
          </Anchor>
        </Flex>
      </Flex>

      <Flex
        width="100%"
        gap="$gap12"
        borderWidth={1}
        borderColor="$surface3"
        borderRadius="$rounded20"
        backgroundColor="$surface2"
        p="$padding16"
      >
        <Flex row alignItems="center" width="100%">
          <BackupMethodSummary provider={provider} email={email} size="lg" iconOpacity={0.5} />
          <OverflowMenu onRemove={onRemove} testID={TestID.RemoveBackupLoginOverflow} />
        </Flex>

        <Flex row gap="$gap8" alignItems="center" p="$padding12" backgroundColor="$surface3" borderRadius="$rounded12">
          <AlertTriangleFilled size="$icon.16" color="$neutral1" />
          <Text variant="body3" color="$neutral1" flex={1}>
            {t('account.passkey.recovery.newPasscodeRequired')}
          </Text>
        </Flex>
      </Flex>

      <Flex row alignSelf="stretch">
        <Button variant="default" size="medium" onPress={onContinue}>
          {t('account.passkey.recovery.updatePasscode.cta')}
        </Button>
      </Flex>
    </Trace>
  )
}

// "Backup login expired" (Figma 12482-24302): shown when v1 recovery rotation is disabled
// (the disable_v1_ew_rotation flag). Rotation is no longer offered; the user is routed to passkey sign-in.
export function RotationExpiredStep({
  onContinueWithPasskey,
  handleClose,
  t,
}: {
  onContinueWithPasskey: () => void
  handleClose: () => void
  t: TFunction
}): JSX.Element {
  return (
    <Trace logImpression modal={ModalName.RecoverWallet}>
      <Flex width="100%" alignItems="flex-end">
        <ModalCloseIcon size="$icon.20" onClose={handleClose} />
      </Flex>
      <Flex gap="$gap16" alignItems="center" width="100%" px="$padding4">
        <IconBox background="$statusWarning2">
          <AlertTriangleFilled size="$icon.24" color="$statusWarning" />
        </IconBox>
        <Flex gap="$gap8" alignItems="center" maxWidth={360}>
          <Text variant="subheading1" textAlign="center">
            {t('account.passkey.recovery.expired.title')}
          </Text>
          <Text variant="body2" textAlign="center" color="$neutral2">
            {t('account.passkey.recovery.expired.description')}
          </Text>
        </Flex>
      </Flex>
      <Flex row alignSelf="stretch">
        <Button variant="default" size="medium" onPress={onContinueWithPasskey}>
          {t('account.passkey.login.continueWithPasskey')}
        </Button>
      </Flex>
    </Trace>
  )
}
