import { BigNumber } from '@ethersproject/bignumber'
import { Token } from '@uniswap/sdk-core'
import { SupportedChainId } from 'constants/chains'

import { DAI_POLYGON_MUMBAI } from './tokens'

export interface IBondDetails extends Token {
  priceUSD: BigNumber
  isLP: boolean
}

export const BOND_DETAILS = {
  [SupportedChainId.POLYGON_MUMBAI]: {
    [DAI_POLYGON_MUMBAI.address]: {
      ...DAI_POLYGON_MUMBAI,
      priceUSD: BigNumber.from('1'), // TODO get the actual price of DAI in USD (maybe using coingecko API)
      isLP: false,
    } as IBondDetails,
  },
}
