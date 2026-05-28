import { Dispatch, SetStateAction } from 'react'
import { LimitInfo } from 'state/limit/hooks'
import { LimitsExpiry } from 'uniswap/src/types/limits'

export interface LimitState {
  readonly inputAmount: string
  readonly outputAmount: string
  readonly expiry: LimitsExpiry
  readonly limitPrice: string
  readonly limitPriceInverted: boolean

  // The form should autofill in the market price between two currencies unless the user has
  // already manually edited the price for that currency pair
  readonly limitPriceEdited: boolean

  // The limit form has 3 fields, but only two of them can be independent at a time.
  // Always prefer `marketPrice` be independent, so either derive the input amount or the output amount
  readonly isInputAmountFixed: boolean
}

export type LimitContextType = {
  limitState: LimitState
  derivedLimitInfo: LimitInfo
  setLimitState: Dispatch<SetStateAction<LimitState>>
}
