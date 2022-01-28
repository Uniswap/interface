import { Token } from '@uniswap/sdk-core'
import { SupportedChainId } from 'constants/chains'
import { getLpTokenPrice, getTokenPrice } from 'utils/prices'

import { DAI_POLYGON_MUMBAI, DAI_USDC_POLYGON_MUMBAI_PAIR } from './tokens'

export interface IBondDetails extends Token {
  isLP: boolean
  bondIconSvg: string
  pricingFunction: (pairAddress?: string) => Promise<number>
}

export const BASE_TOKEN_DECIMALS = 9

console.log(DAI_POLYGON_MUMBAI.address)

export const BOND_DETAILS = {
  [SupportedChainId.POLYGON_MUMBAI]: {
    [DAI_POLYGON_MUMBAI.address.toLowerCase()]: {
      ...DAI_POLYGON_MUMBAI,
      isLP: false,
      pricingFunction: async () => getTokenPrice('dai'),
      bondIconSvg:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
    } as IBondDetails,
    [DAI_USDC_POLYGON_MUMBAI_PAIR.address.toLowerCase()]: {
      name: 'DAI-USDC',
      isLP: true,
      pricingFunction: async (pairAddress: string) => getLpTokenPrice(pairAddress),
      bondIconSvg: 'https://s2.coinmarketcap.com/static/img/coins/200x200/3408.png',
      // bondIconSvg: [
      //   'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
      //   'https://s2.coinmarketcap.com/static/img/coins/200x200/3408.png',
      // ],
    } as IBondDetails,
  },
}
