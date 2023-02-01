import { TransactionRequest } from '@ethersproject/abstract-provider'
import { captureException } from '@sentry/react'
import { Deferrable } from 'ethers/lib/utils'

export enum ErrorName {
  SwappError = 'SwapError',
  RemoveElasticLiquidityError = 'RemoveElasticLiquidityError',
  RemoveClassicLiquidityError = 'RemoveClassicLiquidityError',
}

export function captureSwapError(error: TransactionError) {
  const e = new Error('Swap failed', { cause: error })
  e.name = ErrorName.SwappError

  const tmp = JSON.stringify(error)
  const tag = tmp.includes('minTotalAmountOut')
    ? 'minTotalAmountOut'
    : tmp.includes('ERR_LIMIT_OUT')
    ? 'ERR_LIMIT_OUT'
    : tmp.toLowerCase().includes('1inch')
    ? 'call1InchFailed'
    : tmp.toLowerCase().includes('return amount is not enough')
    ? 'returnAmountIsNotEnough'
    : 'other'

  captureException(e, {
    level: 'fatal',
    extra: error.rawData,
    tags: {
      type: tag,
    },
  })
}

export class TransactionError extends Error {
  rawData: Deferrable<TransactionRequest>

  constructor(message: string, rawData: Deferrable<TransactionRequest>, options?: ErrorOptions) {
    super(message, options)
    this.rawData = rawData
  }
}
