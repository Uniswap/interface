import { argon2id } from '@noble/hashes/argon2.js'
import { ARGON2_PARAMS } from 'uniswap/src/features/passkey/pinCrypto'

// oxlint-disable-next-line no-restricted-globals -- Web Worker global is the standard API
const workerSelf = self

workerSelf.onmessage = (e: MessageEvent<{ type: 'derive'; pin: string; salt1: Uint8Array }>): void => {
  try {
    const pinBytes = new TextEncoder().encode(e.data.pin)
    // Reconstruct Uint8Array from transferred data (structured clone converts to plain object)
    const salt1 = new Uint8Array(e.data.salt1)
    const pinKey = argon2id(pinBytes, salt1, ARGON2_PARAMS)
    workerSelf.postMessage({ type: 'result', pinKey })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Argon2id derivation failed'
    workerSelf.postMessage({ type: 'error', message })
  }
}
