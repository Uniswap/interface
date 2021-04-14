import { BigNumber } from '@ethersproject/bignumber'

import { FarmConfig } from 'constants/types'

export interface Farm extends FarmConfig {
  amp: number
  reserveUSD: string
  tokenAmount?: BigNumber
  quoteTokenAmount?: BigNumber
  lpTotalInQuoteToken?: BigNumber
  tokenPriceVsQuote?: BigNumber
  poolWeight?: BigNumber
  userData?: {
    allowance: BigNumber
    tokenBalance: BigNumber
    stakedBalance: BigNumber
    earnings: BigNumber
  }
}
