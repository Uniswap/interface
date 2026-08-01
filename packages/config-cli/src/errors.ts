import { Result, TaggedError } from 'better-result'
import { Errors as IncurErrors } from 'incur'

export class OktaError extends TaggedError('OktaError')<{
  // Okta error code: authorization_pending, slow_down, access_denied, expired_token, invalid_grant, etc.
  code: string
  message: string
}>() {}

export class NetworkError extends TaggedError('NetworkError')<{
  message: string
}>() {}

export class KeychainError extends TaggedError('KeychainError')<{
  message: string
}>() {}

export class FileStorageError extends TaggedError('FileStorageError')<{
  message: string
}>() {}

export class AuthError extends TaggedError('AuthError')<{
  message: string
}>() {}

export class LockError extends TaggedError('LockError')<{
  message: string
}>() {}

export class ConfigServiceError extends TaggedError('ConfigServiceError')<{
  message: string
}>() {}

export class TimeoutError extends TaggedError('TimeoutError')<{
  message: string
}>() {}

export type CliError =
  | OktaError
  | NetworkError
  | KeychainError
  | FileStorageError
  | AuthError
  | LockError
  | ConfigServiceError

type TaggedLike = { _tag: string; message: string }

const RETRYABLE_TAGS = new Set(['NetworkError'])

/**
 * Await a Result and either return the success value or throw a halting IncurError.
 */
export async function unwrap<T, E extends TaggedLike>(promise: Result<T, E> | Promise<Result<T, E>>): Promise<T> {
  const result = await promise
  if (result.isErr()) {
    throw new IncurErrors.IncurError({
      code: result.error._tag,
      message: result.error.message,
      retryable: RETRYABLE_TAGS.has(result.error._tag),
    })
  }
  return result.value
}
