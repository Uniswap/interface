import { BigNumber } from '@ethersproject/bignumber'

export interface IBond extends IBondCore, IMetadata, ITerms {
  index: number
  displayName: string
  priceUSD: BigNumber
  priceToken: number
  priceTokenBigNumber: BigNumber
  discount: BigNumber
  duration: string
  expiration: string
  isLP: boolean
  lpUrl: string
  marketPrice: BigNumber
  soldOut: boolean
  capacityInBaseToken: string
  capacityInQuoteToken: string
  maxPayoutInBaseToken: string
  maxPayoutInQuoteToken: string
  maxPayoutOrCapacityInQuote: string
  maxPayoutOrCapacityInBase: string
  bondIconSvg: string
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
