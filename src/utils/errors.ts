import { didUserReject } from './swapErrorToUserReadableMessage'

// You may throw an instance of this class when the user rejects a request in their wallet.
// The benefit is that you can distinguish this error from other errors using didUserReject().
export class UserRejectedRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UserRejectedRequestError'
  }
}

export function throwReadableError(errorText: string, error: unknown) {
  if (didUserReject(error)) {
    throw new UserRejectedRequestError(`${errorText} 👺 User rejected signature`)
  }
  if (typeof error === 'object' && error !== null) {
    const e = error as Error & { reason?: string }
    throw new Error(`${errorText} 👺 ${e.message ?? e.reason ?? 'unknown'}`)
  }
  throw new Error(`${errorText} 👺 ${error}`)
}
