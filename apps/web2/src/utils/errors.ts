import { t } from '@lingui/macro'
import { v4 as uuid } from 'uuid'

// You may throw an instance of this class when the user rejects a request in their wallet.
// The benefit is that you can distinguish this error from other errors using didUserReject().
export class UserRejectedRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UserRejectedRequestError'
  }
}

export function toReadableError(errorText: string, error: unknown) {
  if (typeof error === 'object' && error !== null) {
    const e = error as Error & { reason?: string }
    return new Error(`${errorText} 👺 ${e.message ?? e.reason ?? 'unknown'}`)
  }
  return new Error(`${errorText} 👺 ${error}`)
}

export class WrongChainError extends Error {
  constructor() {
    super(t`Your wallet is connected to the wrong network.`)
  }
}

export class SignatureExpiredError extends Error {
  private _id: string
  constructor() {
    super(t`Your signature has expired.`)
    this.name = 'SignatureExpiredError'
    this._id = `SignatureExpiredError-${uuid()}`
  }

  get id(): string {
    return this._id
  }
}
