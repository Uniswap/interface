/**
 * Public API of @universe/embedded-wallet.
 *
 * Embedded wallet lifecycle: passkey authentication, signing, device sessions,
 * recovery (PIN/OAuth), and authenticator management.
 *
 * The export list is the observed-usage inventory across web/mobile/extension/wallet.
 * Add exports deliberately - they cannot be removed without breaking consumers.
 */

// Core wallet lifecycle: create, sign in, sign, disconnect, recover
export {
  Action,
  AuthenticationTypes,
  AuthenticatorAttachment,
  AuthenticatorNameType,
  RecoveryMethod,
  RecoveryOprfError,
  authenticateWithPasskey,
  authenticateWithPasskeyForWalletSignin,
  authorizeAndCompleteRecovery,
  deleteAuthenticatorWithPasskey,
  deleteRecoveryMethod,
  disconnectWallet,
  encryptAndStoreRecovery,
  listAuthenticators,
  registerNewAuthenticator,
  registerNewPasskey,
  startAddAuthenticatorSession,
  toRecoveryAuthMethodType,
} from '@universe/embedded-wallet/src/features/passkey/embeddedWallet'
export type {
  Authenticator,
  EncryptedRecoveryState,
  GetExportCredentialFn,
} from '@universe/embedded-wallet/src/features/passkey/embeddedWallet'

// WebAuthn ceremony (platform-split)
export { authenticatePasskey } from '@universe/embedded-wallet/src/features/passkey/passkey'

// Device session (NECK)
export { hasActiveNeckKey } from '@universe/embedded-wallet/src/features/passkey/deviceSession'

// EIP-7702 delegation
export { deriveEmbeddedWalletDelegationResult } from '@universe/embedded-wallet/src/features/passkey/embeddedWalletDelegation'
export type { EthTransactionParams } from '@universe/embedded-wallet/src/features/passkey/embeddedWalletDelegation'

// Recovery: PIN crypto, execution, availability
export { checkPinReuse } from '@universe/embedded-wallet/src/features/passkey/checkPinReuse'
export { checkRecoveryAvailability } from '@universe/embedded-wallet/src/features/passkey/checkRecoveryAvailability'
export { hashAuthMethodId } from '@universe/embedded-wallet/src/features/passkey/pinCrypto'
export { validatePin } from '@universe/embedded-wallet/src/features/passkey/pinValidation'
export { fetchEncryptedBlob } from '@universe/embedded-wallet/src/features/passkey/privyBlobStore'
export {
  attemptPinDecryption,
  executeRecovery,
  executeRecoveryExport,
} from '@universe/embedded-wallet/src/features/passkey/recoveryExecute'
export type { RecoveryPrivyAuth } from '@universe/embedded-wallet/src/features/passkey/recoveryPrivyAuth'
export { RecoveryStep, useRecoveryFlow } from '@universe/embedded-wallet/src/features/passkey/useRecoveryFlow'

// Seed phrase export (platform-split)
export {
  decryptHpkeCiphertext,
  exportSeedPhraseWithRecovery,
  generateHpkeKeypair,
} from '@universe/embedded-wallet/src/features/passkey/hpkeExport'
export { exportSeedPhrase } from '@universe/embedded-wallet/src/features/passkey/utils'

// REST client + config
export { EmbeddedWalletApiClient } from '@universe/embedded-wallet/src/data/rest/embeddedWallet/requests'
export { useEmbeddedWalletBaseUrl } from '@universe/embedded-wallet/src/features/passkey/hooks/useEmbeddedWalletBaseUrl'
export { useGetPasskeyAuthStatus } from '@universe/embedded-wallet/src/features/passkey/hooks/useGetPasskeyAuthStatus'
export { EXTENSION_PASSKEY_AUTH_PATH } from '@universe/embedded-wallet/src/features/passkey/constants'

// Management UI
export { PasskeyManagementModal } from '@universe/embedded-wallet/src/features/passkey/PasskeyManagementModal'
export type { PasskeyManagementModalState } from '@universe/embedded-wallet/src/features/passkey/PasskeyManagementModal'

// Recovery wizard UI
export { PasskeyImportConfirm } from '@universe/embedded-wallet/src/components/passkey/PasskeyImportConfirm'
export { BackupMethodSummary } from '@universe/embedded-wallet/src/components/passkey/recovery/BackupMethodSummary'
export { DigitInputRow } from '@universe/embedded-wallet/src/components/passkey/recovery/DigitInputRow'
export { IconBox } from '@universe/embedded-wallet/src/components/passkey/recovery/IconBox'
export { OptionRow } from '@universe/embedded-wallet/src/components/passkey/recovery/OptionRow'
export { StepHeader } from '@universe/embedded-wallet/src/components/passkey/recovery/StepHeader'
export { useDigitInput } from '@universe/embedded-wallet/src/components/passkey/recovery/useDigitInput'
export type { DigitInputState } from '@universe/embedded-wallet/src/components/passkey/recovery/useDigitInput'
export { EmailCodeStep } from '@universe/embedded-wallet/src/components/passkey/recovery/steps/EmailCodeStep'
export { EmailEntryStep } from '@universe/embedded-wallet/src/components/passkey/recovery/steps/EmailEntryStep'
export { EnterPinStep } from '@universe/embedded-wallet/src/components/passkey/recovery/steps/EnterPinStep'
export { NoWalletFoundStep } from '@universe/embedded-wallet/src/components/passkey/recovery/steps/NoWalletFoundStep'
export { OAuthLoadingStep } from '@universe/embedded-wallet/src/components/passkey/recovery/steps/OAuthLoadingStep'
export { RecoveringStep } from '@universe/embedded-wallet/src/components/passkey/recovery/steps/RecoveringStep'
export { RecoveryLoginStep } from '@universe/embedded-wallet/src/components/passkey/recovery/steps/RecoveryLoginStep'

// Web protocol layer (platform-stubbed; real implementations live in .web files).
// Contract types (deps interfaces, provider API) are exported on demand - nothing
// external names them today, so they stay internal.
export { embeddedWallet } from '@universe/embedded-wallet/src/connection/EmbeddedWalletConnector'
export { createEmbeddedWalletProvider } from '@universe/embedded-wallet/src/connection/createEmbeddedWalletProvider'

// Embedded wallet session store (web-only)
export { getEmbeddedWalletState, useEmbeddedWalletState } from '@universe/embedded-wallet/src/state/embeddedWalletStore'

// Lifecycle hooks (web-only; app wiring is injected via each hook's deps)
export { useOnCompleteEmbeddedWalletLogin } from '@universe/embedded-wallet/src/hooks/useOnCompleteEmbeddedWalletLogin'
export { useSignInWithPasskey } from '@universe/embedded-wallet/src/hooks/useSignInWithPasskey'
export { useSignOutWithPasskey } from '@universe/embedded-wallet/src/hooks/useSignOutWithPasskey'
export type {
  CompleteEmbeddedWalletLoginInput,
  SignInWithPasskeyOptions,
  SignOutWithPasskeyOptions,
} from '@universe/embedded-wallet/src/hooks/types'
