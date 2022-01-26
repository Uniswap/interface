import { BigNumber } from '@ethersproject/bignumber'
import { Token } from '@uniswap/sdk-core'
import axios from 'axios'
import { SupportedChainId } from 'constants/chains'

import { DAI_POLYGON_MUMBAI } from './tokens'

// TODO move to helpers
async function getTokenPrice(tokenId: string): Promise<number> {
  try {
    const resp = (await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`
    )) as {
      data: { [id: string]: { usd: number } }
    }
    const tokenPrice: number = resp.data[tokenId].usd
    return tokenPrice
  } catch (e) {
    console.log('coingecko api error: ', e)
    return 0
  }
}

export interface IBondDetails extends Token {
  priceUSD: BigNumber
  isLP: boolean
  bondIconSvg: string
  pricingFunction: () => Promise<number>
}

export const BASE_TOKEN_DECIMALS = 9

export const BOND_DETAILS = {
  [SupportedChainId.POLYGON_MUMBAI]: {
    [DAI_POLYGON_MUMBAI.address]: {
      ...DAI_POLYGON_MUMBAI,
      priceUSD: BigNumber.from('1'), // TODO get the actual price of DAI in USD (maybe using coingecko API)
      isLP: false,
      pricingFunction: async () => getTokenPrice('dai'),
      bondIconSvg:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
    } as IBondDetails,
  },
}
