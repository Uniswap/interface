import type { WebAuthnErrorCode } from '@simplewebauthn/browser'

/**
 * `WebAuthnError.code` values that mean the current OS/browser can't create a usable passkey.
 * Excludes aborts/cancellations (`ERROR_CEREMONY_ABORTED`, `ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY`) and
 * `ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED` (the device already has a passkey, so sign-in works).
 */
const UNSUPPORTED_REGISTRATION_ERROR_CODES: readonly WebAuthnErrorCode[] = [
  'ERROR_AUTHENTICATOR_MISSING_DISCOVERABLE_CREDENTIAL_SUPPORT',
  'ERROR_AUTHENTICATOR_MISSING_USER_VERIFICATION_SUPPORT',
  'ERROR_AUTHENTICATOR_NO_SUPPORTED_PUBKEYCREDPARAMS_ALG',
  'ERROR_INVALID_RP_ID',
  'ERROR_INVALID_DOMAIN',
  'ERROR_AUTHENTICATOR_GENERAL_ERROR',
]

const unsupportedRegistrationErrorCodes = new Set<string>(UNSUPPORTED_REGISTRATION_ERROR_CODES)

/** Thrown when a registration ceremony succeeds but the credential has no public key (e.g. macOS Catalina). */
export class UnsupportedPasskeyRegistrationError extends Error {
  constructor(message = 'Passkey registration produced a credential without a public key') {
    super(message)
    this.name = 'UnsupportedPasskeyRegistrationError'
  }
}

function getWebAuthnErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const { code } = error as { code: unknown }
    return typeof code === 'string' ? code : undefined
  }
  return undefined
}

/** True when a wallet-creation passkey failure means the OS/browser is unsupported. */
export function isUnsupportedPasskeyCreationError(error: unknown): boolean {
  if (error instanceof UnsupportedPasskeyRegistrationError) {
    return true
  }
  const code = getWebAuthnErrorCode(error)
  return code !== undefined && unsupportedRegistrationErrorCodes.has(code)
}
