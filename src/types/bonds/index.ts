import { BigNumber } from '@ethersproject/bignumber'
import { Currency } from '@uniswap/sdk-core'

export interface IBond extends IBondCore, IMetadata, ITerms {
  index: number
  displayName: string
  priceUSD: number
  priceToken: number
  priceTokenBigNumber: BigNumber
  discount: number
  duration: string
  expiration: string
  isLP: boolean
  lpUrl: string
  marketPrice: number
  soldOut: boolean
  capacityInBaseToken: string
  capacityInQuoteToken: string
  maxPayoutInBaseToken: string
  maxPayoutInQuoteToken: string
  maxPayoutOrCapacityInQuote: string
  maxPayoutOrCapacityInBase: string
  bondIconSvg: string
  quoteCurrency: Currency | undefined
}

export interface IBondCore {
  quoteToken: string
  capacityInQuote: boolean
  capacity: BigNumber
  totalDebt: BigNumber
  maxPayout: BigNumber
  purchased: BigNumber
  sold: BigNumber
}

export interface IMetadata {
  lastTune: number
  lastDecay: number
  length: number
  depositInterval: number
  tuneInterval: number
  quoteDecimals: number
}

export interface ITerms {
  fixedTerm: boolean
  controlVariable: BigNumber
  vesting: number
  conclusion: number
  maxDebt: BigNumber
}
