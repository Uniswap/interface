import { isUnsupportedPasskeyCreationError } from '@universe/embedded-wallet/src/features/passkey/unsupportedPasskeyError'
import { logger } from 'utilities/src/logger/logger'

/** Thrown before the WebAuthn prompt when the browser has no WebAuthn API. */
export class WebAuthnUnsupportedError extends Error {
  constructor() {
    super('WebAuthn is not supported in this browser')
    this.name = 'WebAuthnUnsupportedError'
  }
}

export enum PasskeyRejectionKind {
  UserCancelled = 'user_cancelled',
  Unsupported = 'unsupported',
  Failed = 'failed',
}

export interface PasskeyRejection {
  kind: PasskeyRejectionKind
  name: string
  message: string
}

// WebAuthn reports a dismissed prompt (and "no matching credential") as NotAllowedError.
const WEB_CANCEL_NAMES = new Set(['NotAllowedError', 'AbortError'])
// react-native-passkey rejects with plain `{ error, message }` objects rather than Errors.
const NATIVE_CANCEL_CODES = new Set(['UserCancelled', 'NoCredentials'])
const NATIVE_UNSUPPORTED_CODE = 'NotSupported'

function readStringField(value: unknown, field: string): string | undefined {
  if (typeof value !== 'object' || value === null || !(field in value)) {
    return undefined
  }
  const fieldValue = (value as Record<string, unknown>)[field]
  return typeof fieldValue === 'string' ? fieldValue : undefined
}

function stringifyRejection(error: unknown): string {
  if (typeof error !== 'object' || error === null) {
    return String(error)
  }
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

export type PasskeyCeremony = 'registration' | 'authentication'

/**
 * Classifies a rejection from the web or native passkey prompt. Creation-only "unsupported" errors are
 * scoped to registration: sign-in can raise the same WebAuthn codes (e.g. ERROR_INVALID_RP_ID,
 * ERROR_AUTHENTICATOR_GENERAL_ERROR), but there they're real failures for a user who already has a passkey.
 */
export function normalizePasskeyRejection(
  error: unknown,
  ceremony: PasskeyCeremony = 'authentication',
): PasskeyRejection {
  if (
    error instanceof WebAuthnUnsupportedError ||
    (ceremony === 'registration' && isUnsupportedPasskeyCreationError(error))
  ) {
    return {
      kind: PasskeyRejectionKind.Unsupported,
      name: readStringField(error, 'code') ?? readStringField(error, 'name') ?? 'unknown',
      message: readStringField(error, 'message') ?? stringifyRejection(error),
    }
  }

  const message = readStringField(error, 'message') ?? stringifyRejection(error)
  const nativeCode = error instanceof Error ? undefined : readStringField(error, 'error')
  if (nativeCode !== undefined) {
    const kind = NATIVE_CANCEL_CODES.has(nativeCode)
      ? PasskeyRejectionKind.UserCancelled
      : nativeCode === NATIVE_UNSUPPORTED_CODE
        ? PasskeyRejectionKind.Unsupported
        : PasskeyRejectionKind.Failed
    return { kind, name: nativeCode, message }
  }

  const name = readStringField(error, 'name') ?? 'unknown'
  const kind = WEB_CANCEL_NAMES.has(name) ? PasskeyRejectionKind.UserCancelled : PasskeyRejectionKind.Failed
  return { kind, name, message }
}

// The same Error instance bubbles through several layers (prompt, sign-in, mutation onError); only the
// first one to report it should log. Plain-object rejections from react-native-passkey are shared
// module constants, so they can't be tracked this way.
const loggedErrors = new WeakSet<Error>()

type LogContext = { file: string; function: string; ceremony?: PasskeyCeremony; extra?: Record<string, unknown> }

/**
 * Logs an error thrown by the passkey prompt once, at a level that matches its cause: user cancels at
 * debug, unsupported devices/browsers at warn, everything else at error.
 */
export function logPasskeyRejection(error: unknown, context: LogContext): void {
  if (error instanceof Error) {
    if (loggedErrors.has(error)) {
      return
    }
    loggedErrors.add(error)
  }

  const { kind, name, message } = normalizePasskeyRejection(error, context.ceremony)
  const extra = { ...context.extra, errName: name, errMessage: message }

  switch (kind) {
    case PasskeyRejectionKind.UserCancelled:
      logger.debug(context.file, context.function, `Passkey prompt cancelled (${name})`, extra)
      return
    case PasskeyRejectionKind.Unsupported:
      logger.warn(context.file, context.function, `Passkeys unsupported: ${message}`, extra)
      return
    case PasskeyRejectionKind.Failed:
      logger.error(
        error instanceof Error ? error : new Error(`Passkey request failed: ${name}: ${message}`, { cause: error }),
        {
          tags: { file: context.file, function: context.function },
          extra,
        },
      )
  }
}

/**
 * Logs an error from a passkey flow at error, unless the prompt already reported it via
 * {@link logPasskeyRejection}. Unlike that helper it does not treat AbortError as a cancel, since in
 * a flow it can also come from an aborted fetch.
 */
export function logPasskeyFlowError(error: unknown, context: LogContext): void {
  if (!(error instanceof Error)) {
    // Only the native prompt rejects with a non-Error, and those can't be deduplicated.
    logPasskeyRejection(error, context)
    return
  }
  if (loggedErrors.has(error)) {
    return
  }
  loggedErrors.add(error)
  logger.error(error, {
    tags: { file: context.file, function: context.function },
    extra: { ...context.extra, errName: error.name, errMessage: error.message },
  })
}
