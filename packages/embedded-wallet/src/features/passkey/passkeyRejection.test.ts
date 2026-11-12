import type { WebAuthnErrorCode } from '@simplewebauthn/browser'
import {
  logPasskeyFlowError,
  logPasskeyRejection,
  normalizePasskeyRejection,
  PasskeyRejectionKind,
  WebAuthnUnsupportedError,
} from '@universe/embedded-wallet/src/features/passkey/passkeyRejection'
import { UnsupportedPasskeyRegistrationError } from '@universe/embedded-wallet/src/features/passkey/unsupportedPasskeyError'
import { logger } from 'utilities/src/logger/logger'

// Shape of react-native-passkey's rejections (shared module constants, not Errors).
const nativeRejection = (error: string): { error: string; message: string } => ({ error, message: `${error} message` })

const context = { file: 'test.ts', function: 'testFn' }

// Stand-in for SimpleWebAuthn's WebAuthnError, which keeps the DOMException's name and adds a code.
const webAuthnError = (code: WebAuthnErrorCode, name = 'SecurityError'): Error =>
  Object.assign(new Error(`${code} message`), { name, code })

describe(normalizePasskeyRejection, () => {
  it.each([
    ['NotAllowedError', new DOMException('The operation either timed out or was not allowed.', 'NotAllowedError')],
    ['AbortError', new DOMException('The operation was aborted.', 'AbortError')],
    ['UserCancelled', nativeRejection('UserCancelled')],
    ['NoCredentials', nativeRejection('NoCredentials')],
  ])('classifies %s as a user cancel', (name, error) => {
    expect(normalizePasskeyRejection(error)).toEqual(
      expect.objectContaining({ kind: PasskeyRejectionKind.UserCancelled, name }),
    )
  })

  it('classifies an Error subclass named NotAllowedError as a user cancel', () => {
    const error = Object.assign(new Error('cancelled'), { name: 'NotAllowedError' })
    expect(normalizePasskeyRejection(error).kind).toBe(PasskeyRejectionKind.UserCancelled)
  })

  it('classifies unsupported WebAuthn and native NotSupported as unsupported', () => {
    expect(normalizePasskeyRejection(new WebAuthnUnsupportedError()).kind).toBe(PasskeyRejectionKind.Unsupported)
    expect(normalizePasskeyRejection(nativeRejection('NotSupported')).kind).toBe(PasskeyRejectionKind.Unsupported)
  })

  it('classifies a registration without a public key as unsupported', () => {
    expect(normalizePasskeyRejection(new UnsupportedPasskeyRegistrationError(), 'registration')).toEqual({
      kind: PasskeyRejectionKind.Unsupported,
      name: 'UnsupportedPasskeyRegistrationError',
      message: 'Passkey registration produced a credential without a public key',
    })
  })

  const unsupportedCreationCodes: WebAuthnErrorCode[] = [
    'ERROR_AUTHENTICATOR_MISSING_DISCOVERABLE_CREDENTIAL_SUPPORT',
    'ERROR_AUTHENTICATOR_MISSING_USER_VERIFICATION_SUPPORT',
    'ERROR_AUTHENTICATOR_NO_SUPPORTED_PUBKEYCREDPARAMS_ALG',
    'ERROR_INVALID_RP_ID',
    'ERROR_INVALID_DOMAIN',
    'ERROR_AUTHENTICATOR_GENERAL_ERROR',
  ]

  it.each(unsupportedCreationCodes)('classifies registration WebAuthn code %s as unsupported', (code) => {
    expect(normalizePasskeyRejection(webAuthnError(code), 'registration')).toEqual({
      kind: PasskeyRejectionKind.Unsupported,
      name: code,
      message: `${code} message`,
    })
  })

  it.each(['ERROR_INVALID_RP_ID', 'ERROR_INVALID_DOMAIN', 'ERROR_AUTHENTICATOR_GENERAL_ERROR'] as const)(
    'classifies sign-in WebAuthn code %s as a failure',
    (code) => {
      expect(normalizePasskeyRejection(webAuthnError(code)).kind).toBe(PasskeyRejectionKind.Failed)
    },
  )

  it('keeps registration aborts and already-registered errors out of unsupported', () => {
    expect(normalizePasskeyRejection(webAuthnError('ERROR_CEREMONY_ABORTED', 'AbortError'), 'registration').kind).toBe(
      PasskeyRejectionKind.UserCancelled,
    )
    expect(
      normalizePasskeyRejection(
        webAuthnError('ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED', 'InvalidStateError'),
        'registration',
      ).kind,
    ).toBe(PasskeyRejectionKind.Failed)
  })

  it('classifies everything else as a failure and keeps the native error code and message', () => {
    expect(normalizePasskeyRejection(new Error('boom'))).toEqual({
      kind: PasskeyRejectionKind.Failed,
      name: 'Error',
      message: 'boom',
    })
    expect(normalizePasskeyRejection(nativeRejection('RequestFailed'))).toEqual({
      kind: PasskeyRejectionKind.Failed,
      name: 'RequestFailed',
      message: 'RequestFailed message',
    })
    expect(normalizePasskeyRejection('boom')).toEqual({
      kind: PasskeyRejectionKind.Failed,
      name: 'unknown',
      message: 'boom',
    })
  })
})

describe(logPasskeyRejection, () => {
  beforeEach(() => {
    vi.spyOn(logger, 'debug').mockImplementation(() => undefined)
    vi.spyOn(logger, 'warn').mockImplementation(() => undefined)
    vi.spyOn(logger, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logs a user cancel at debug', () => {
    logPasskeyRejection(nativeRejection('UserCancelled'), context)

    expect(logger.debug).toHaveBeenCalledWith(
      'test.ts',
      'testFn',
      'Passkey prompt cancelled (UserCancelled)',
      expect.objectContaining({ errName: 'UserCancelled' }),
    )
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('logs an unsupported browser at warn', () => {
    logPasskeyRejection(new WebAuthnUnsupportedError(), context)

    expect(logger.warn).toHaveBeenCalledWith(
      'test.ts',
      'testFn',
      'Passkeys unsupported: WebAuthn is not supported in this browser',
      expect.any(Object),
    )
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('logs a registration without a public key at warn', () => {
    logPasskeyRejection(new UnsupportedPasskeyRegistrationError(), { ...context, ceremony: 'registration' })

    expect(logger.warn).toHaveBeenCalledWith(
      'test.ts',
      'testFn',
      'Passkeys unsupported: Passkey registration produced a credential without a public key',
      expect.objectContaining({ errName: 'UnsupportedPasskeyRegistrationError' }),
    )
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('logs an unsupported registration WebAuthn code at warn with the code as errName', () => {
    logPasskeyRejection(webAuthnError('ERROR_INVALID_DOMAIN'), { ...context, ceremony: 'registration' })

    expect(logger.warn).toHaveBeenCalledWith(
      'test.ts',
      'testFn',
      'Passkeys unsupported: ERROR_INVALID_DOMAIN message',
      expect.objectContaining({ errName: 'ERROR_INVALID_DOMAIN' }),
    )
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('logs a real failure at error with the name and message', () => {
    const error = new Error('boom')

    logPasskeyRejection(error, { ...context, extra: { action: 'WALLET_SIGNIN' } })

    expect(logger.error).toHaveBeenCalledWith(error, {
      tags: { file: 'test.ts', function: 'testFn' },
      extra: { action: 'WALLET_SIGNIN', errName: 'Error', errMessage: 'boom' },
    })
  })

  it('wraps a plain-object failure in an Error that carries its code and message', () => {
    logPasskeyRejection(nativeRejection('RequestFailed'), context)

    const [loggedError] = vi.mocked(logger.error).mock.calls[0] ?? []
    expect(loggedError).toEqual(new Error('Passkey request failed: RequestFailed: RequestFailed message'))
    expect((loggedError as Error).cause).toEqual(nativeRejection('RequestFailed'))
  })

  it('logs the same Error instance only once as it bubbles through layers', () => {
    const error = new Error('boom')

    logPasskeyRejection(error, context)
    logPasskeyRejection(error, { file: 'embeddedWallet.ts', function: 'signInWithPasskey' })
    logPasskeyRejection(error, { file: 'useSignInWithPasskey', function: 'onError' })

    expect(logger.error).toHaveBeenCalledTimes(1)
  })

  it('logs every plain-object rejection, since the library reuses the same object', () => {
    const rejection = nativeRejection('UserCancelled')

    logPasskeyRejection(rejection, context)
    logPasskeyRejection(rejection, context)

    expect(logger.debug).toHaveBeenCalledTimes(2)
  })
})

describe(logPasskeyFlowError, () => {
  beforeEach(() => {
    vi.spyOn(logger, 'debug').mockImplementation(() => undefined)
    vi.spyOn(logger, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('skips an error the prompt already reported, including a debug-level cancel', () => {
    const cancel = Object.assign(new Error('cancelled'), { name: 'NotAllowedError' })

    logPasskeyRejection(cancel, context)
    logPasskeyFlowError(cancel, { file: 'useSignInWithPasskey', function: 'onError' })

    expect(logger.debug).toHaveBeenCalledTimes(1)
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('logs an unreported AbortError at error, since in a flow it can come from an aborted fetch', () => {
    const error = Object.assign(new Error('The operation was aborted.'), { name: 'AbortError' })

    logPasskeyFlowError(error, context)

    expect(logger.error).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ tags: { file: 'test.ts', function: 'testFn' } }),
    )
  })

  it('classifies a native plain-object rejection instead of logging it at error', () => {
    logPasskeyFlowError(nativeRejection('UserCancelled'), context)

    expect(logger.debug).toHaveBeenCalledTimes(1)
    expect(logger.error).not.toHaveBeenCalled()
  })
})
