import { encodeAbiParameters, type Hex, pad } from 'viem'

/**
 * Calibur smart-wallet root key hash — `bytes32(0)`. Identifies the wallet's
 * root ECDSA key in the AA module's authorization scheme.
 */
export const ROOT_KEY_HASH = pad('0x0', { size: 32 })

/**
 * Encode a raw 65-byte ECDSA signature into the Calibur authorization envelope
 * the AA module expects: `abi.encode(keyHash, signature, hookData)` with
 * `keyHash = ROOT_KEY_HASH` (root key) and empty `hookData`.
 *
 * Shared by the wallet-package native UserOp signer and the web embedded-wallet
 * passkey UserOp signer — both produce the same on-chain signature envelope.
 */
export function encodeCaliburUserOpSignature(ecdsaSignature: Hex): Hex {
  return encodeAbiParameters(
    [
      { type: 'bytes32', name: 'keyHash' },
      { type: 'bytes', name: 'signature' },
      { type: 'bytes', name: 'hookData' },
    ],
    [ROOT_KEY_HASH, ecdsaSignature, '0x'],
  )
}
