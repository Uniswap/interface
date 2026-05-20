import { Result, TaggedError } from 'better-result'

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

export class AuthError extends TaggedError('AuthError')<{
  message: string
}>() {}

export type CliError = OktaError | NetworkError | KeychainError | AuthError

type TaggedLike = { _tag: string; message: string }

type ErrorContext = {
  error: (input: { code: string; message: string; retryable?: boolean }) => never
}

const RETRYABLE_TAGS = new Set(['NetworkError'])

export async function unwrap<T, E extends TaggedLike>(
  promise: Result<T, E> | Promise<Result<T, E>>,
  c: ErrorContext,
): Promise<T> {
  const result = await promise
  if (result.isErr()) {
    return c.error({
      code: result.error._tag,
      message: result.error.message,
      retryable: RETRYABLE_TAGS.has(result.error._tag),
    })
  }
  return result.value
}
