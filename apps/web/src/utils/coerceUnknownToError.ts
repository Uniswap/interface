/**
 * Wallets sometimes reject with a plain object `{ code, message, ... }` instead of `Error`.
 * `error instanceof Error ? error : new Error(...)` drops EIP-1193 fields and breaks
 * `didUserReject()` in the launch UI — preserve them on a real Error instance.
 */
export function coerceUnknownToError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof Error) {
    return error
  }
  if (typeof error === 'string') {
    return new Error(error)
  }
  if (typeof error === 'object' && error !== null) {
    const obj = error as Record<string, unknown>
    const message =
      typeof obj.message === 'string' ? obj.message : typeof obj.reason === 'string' ? obj.reason : fallbackMessage
    const err = new Error(message)
    const ext = err as Error & Record<string, unknown>
    if ('code' in obj) {
      ext.code = obj.code
    }
    if ('data' in obj) {
      ext.data = obj.data
    }
    if ('reason' in obj) {
      ext.reason = obj.reason
    }
    if ('shortMessage' in obj && typeof obj.shortMessage === 'string') {
      ext.shortMessage = obj.shortMessage
    }
    if ('cause' in obj && obj.cause !== undefined) {
      ext.cause = obj.cause as Error
    }
    if ('details' in obj) {
      ext.details = obj.details
    }
    return err
  }
  return new Error(fallbackMessage)
}
