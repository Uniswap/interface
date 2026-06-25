import { Code, ConnectError } from '@connectrpc/connect'

/**
 * Backend `InputValidationError`s come back as ConnectError messages prefixed with
 * `InputValidationError:` — e.g. `InputValidationError: Unsupported fee tier: 10001`. The part
 * after the prefix is human-readable and worth surfacing; the prefix itself is not.
 */
const INPUT_VALIDATION_ERROR_PREFIX = /^InputValidationError:\s*/i

/**
 * Extracts a user-facing reason from a CreateAuction launch failure when the backend rejected the
 * request with a validation error. Only `Code.InvalidArgument` ConnectErrors carry a message that's
 * meaningful to the user (e.g. an unsupported fee tier); for any other error this returns undefined
 * so callers fall back to their generic copy.
 *
 * The trailing period is dropped because the reason is interpolated into a sentence template that
 * supplies its own — keeping it would produce a doubled `..`.
 */
export function getCreateAuctionErrorMessage(error: unknown): string | undefined {
  if (!(error instanceof ConnectError) || error.code !== Code.InvalidArgument) {
    return undefined
  }

  const message = error.rawMessage
    .replace(INPUT_VALIDATION_ERROR_PREFIX, '')
    .replace(/[\s.]+$/, '')
    .trim()
  return message.length > 0 ? message : undefined
}
