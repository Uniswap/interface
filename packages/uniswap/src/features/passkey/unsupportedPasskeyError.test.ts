import type { WebAuthnErrorCode } from '@simplewebauthn/browser'
import {
  isUnsupportedPasskeyCreationError,
  UnsupportedPasskeyRegistrationError,
} from 'uniswap/src/features/passkey/unsupportedPasskeyError'

// Minimal stand-in for a real WebAuthnError; typing the code as WebAuthnErrorCode anchors it to the lib.
function webAuthnError(code: WebAuthnErrorCode): { name: string; code: WebAuthnErrorCode } {
  return { name: 'WebAuthnError', code }
}

describe('isUnsupportedPasskeyCreationError', () => {
  const unsupportedCodes: WebAuthnErrorCode[] = [
    'ERROR_AUTHENTICATOR_MISSING_DISCOVERABLE_CREDENTIAL_SUPPORT',
    'ERROR_AUTHENTICATOR_MISSING_USER_VERIFICATION_SUPPORT',
    'ERROR_AUTHENTICATOR_NO_SUPPORTED_PUBKEYCREDPARAMS_ALG',
    'ERROR_INVALID_RP_ID',
    'ERROR_INVALID_DOMAIN',
    'ERROR_AUTHENTICATOR_GENERAL_ERROR',
  ]

  it.each(unsupportedCodes)('returns true for unsupported WebAuthn code %s', (code) => {
    expect(isUnsupportedPasskeyCreationError(webAuthnError(code))).toBe(true)
  })

  // Aborts, user-cancel, and already-registered (the device has a passkey, so sign-in works) are NOT unsupported.
  const nonUnsupportedCodes: WebAuthnErrorCode[] = [
    'ERROR_CEREMONY_ABORTED',
    'ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY',
    'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED',
  ]

  it.each(nonUnsupportedCodes)('returns false for non-unsupported code %s', (code) => {
    expect(isUnsupportedPasskeyCreationError(webAuthnError(code))).toBe(false)
  })

  it('returns true for a missing-public-key (Catalina) error', () => {
    expect(isUnsupportedPasskeyCreationError(new UnsupportedPasskeyRegistrationError())).toBe(true)
  })

  it.each([
    ['plain Error', new Error('boom')],
    ['null', null],
    ['undefined', undefined],
    ['string', 'ERROR_INVALID_DOMAIN'],
    ['non-string code', { code: 123 }],
    ['empty object', {}],
  ])('returns false for non-WebAuthn value: %s', (_label, value) => {
    expect(isUnsupportedPasskeyCreationError(value)).toBe(false)
  })
})
