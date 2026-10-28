import i18n from 'uniswap/src/i18n'
import { uuid } from 'utilities/src/primitives/uuid'

export { UserRejectedRequestError } from 'utilities/src/errors/walletRejection'

export function toReadableError(errorText: string, error: unknown) {
  if (typeof error === 'object' && error !== null) {
    const e = error as Error & { reason?: string }
    // oxlint-disable-next-line typescript/no-unnecessary-condition
    return new Error(`${errorText} 👺 ${e.message ?? e.reason ?? 'unknown'}`)
  }
  return new Error(`${errorText} 👺 ${error}`)
}

export class WrongChainError extends Error {
  constructor() {
    super(i18n.t('wallet.wrongNet'))
  }
}

export class UniswapXv2HardQuoteError extends Error {
  constructor() {
    super(i18n.t('uniswapx.v2QuoteFailed'))
    this.name = 'UniswapXv2HardQuoteError'
  }
}

export class SignatureExpiredError extends Error {
  private _id: string
  constructor() {
    super(i18n.t('common.signatureExpired'))
    this.name = 'SignatureExpiredError'
    this._id = `SignatureExpiredError-${uuid()}`
  }

  get id(): string {
    return this._id
  }
}
