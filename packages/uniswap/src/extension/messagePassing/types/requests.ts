import { MessageSchema } from 'uniswap/src/extension/messagePassing/messageTypes'
import { z } from 'zod'

// Requests from the Extension to the Interface (Web App) and vice versa
export enum ExtensionToInterfaceRequestType {
  PasskeyRequest = 'PasskeyRequest',
  RecoveryHpkeKey = 'RecoveryHpkeKey',
}

// Handshake response: the popup owns both passkey ceremonies AND the EW RPC calls (so
// Origin matches clientDataJSON.origin natively). Extension generates an ephemeral HPKE
// keypair, sends the SPKI public key here, and holds the private key for decrypt — the
// plaintext seed phrase never transits the message channel. Popup posts back ciphertext
// via `RecoveryExportResult`.
export const PasskeyRequestSchema = MessageSchema.extend({
  type: z.literal(ExtensionToInterfaceRequestType.PasskeyRequest),
  requestId: z.string(),
  encryptionKey: z.string(),
})
export type PasskeyRequest = z.infer<typeof PasskeyRequestSchema>

// Sent from Extension to the recovery pop-up as a sync response to `RecoveryFlowOpened`.
// Carries the ephemeral HPKE public key (base64 SPKI) the pop-up passes to the backend —
// the extension owns the keypair so plaintext mnemonic never transits the message channel.
export const RecoveryHpkeKeySchema = MessageSchema.extend({
  type: z.literal(ExtensionToInterfaceRequestType.RecoveryHpkeKey),
  requestId: z.string(),
  encryptionKey: z.string(),
  walletAddress: z.string().optional(),
})
export type RecoveryHpkeKey = z.infer<typeof RecoveryHpkeKeySchema>

// Requests from the Interface (Web App) to the Extension
export enum InterfaceToExtensionRequestType {
  PasskeySignInFlowOpened = 'PasskeySignInFlowOpened',
  RecoveryFlowOpened = 'RecoveryFlowOpened',
  RecoveryExportResult = 'RecoveryExportResult',
  RecoveryExportError = 'RecoveryExportError',
}
export const PasskeySignInFlowOpenedSchema = MessageSchema.extend({
  type: z.literal(InterfaceToExtensionRequestType.PasskeySignInFlowOpened),
  requestId: z.string(),
})
export type PasskeySignInFlowOpened = z.infer<typeof PasskeySignInFlowOpenedSchema>

// Pop-up asks the extension for its HPKE public key (sent before invoking the backend
// recovery export RPC). Extension responds synchronously with `RecoveryHpkeKey`.
export const RecoveryFlowOpenedSchema = MessageSchema.extend({
  type: z.literal(InterfaceToExtensionRequestType.RecoveryFlowOpened),
  requestId: z.string(),
})
export type RecoveryFlowOpened = z.infer<typeof RecoveryFlowOpenedSchema>

// Pop-up forwards the backend-returned HPKE ciphertext to the extension for decrypt.
// Shared by passkey graduation and recovery-based graduation — both paths converge on
// ciphertext-out + local-decrypt, so the message stays agnostic to which authentication
// branch produced it.
export const RecoveryExportResultSchema = MessageSchema.extend({
  type: z.literal(InterfaceToExtensionRequestType.RecoveryExportResult),
  requestId: z.string(),
  ciphertext: z.string(),
  encapsulatedKey: z.string(),
})
export type RecoveryExportResult = z.infer<typeof RecoveryExportResultSchema>

// Pop-up-side failure (user abandoned, backend error, etc.) — extension transitions out
// of the loading state and surfaces an error to the user.
export const RecoveryExportErrorSchema = MessageSchema.extend({
  type: z.literal(InterfaceToExtensionRequestType.RecoveryExportError),
  requestId: z.string(),
  error: z.string(),
})
export type RecoveryExportError = z.infer<typeof RecoveryExportErrorSchema>
