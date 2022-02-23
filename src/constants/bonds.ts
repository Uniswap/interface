import { Currency, Token } from '@uniswap/sdk-core'
import { SupportedChainId } from 'constants/chains'
import { getGenesisLiquidityTokenPrice, getTokenPrice } from 'utils/prices'

import { DAI_GEN_POLYGON_MUMBAI_PAIR, DAI_POLYGON_MUMBAI, USDC_POLYGON_MUMBAI } from './tokens'

export interface IBondDetails extends Token {
  isLP: boolean
  bondIconSvg: string
  quoteCurrency: Currency
  pricingFunction: (pairAddress?: string) => Promise<number>
}

export const BASE_TOKEN_DECIMALS = 9

export const BOND_DETAILS = {
  [SupportedChainId.POLYGON_MUMBAI]: {
    [DAI_POLYGON_MUMBAI.address.toLowerCase()]: {
      ...DAI_POLYGON_MUMBAI,
      isLP: false,
      quoteCurrency: DAI_POLYGON_MUMBAI,
      pricingFunction: async () => getTokenPrice(DAI_POLYGON_MUMBAI.address, SupportedChainId.POLYGON_MUMBAI),
      bondIconSvg:
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
    } as IBondDetails,
    [DAI_GEN_POLYGON_MUMBAI_PAIR.address.toLowerCase()]: {
      name: 'DAI-GEN',
      isLP: true,
      quoteCurrency: DAI_GEN_POLYGON_MUMBAI_PAIR,
      pricingFunction: async () =>
        getGenesisLiquidityTokenPrice(DAI_GEN_POLYGON_MUMBAI_PAIR.address.toLowerCase(), 80001),
      bondIconSvg: 'https://s2.coinmarketcap.com/static/img/coins/200x200/3408.png',
    } as IBondDetails,
    [USDC_POLYGON_MUMBAI.address.toLowerCase()]: {
      name: 'USDC',
      isLP: true,
      quoteCurrency: USDC_POLYGON_MUMBAI,
      pricingFunction: async () => getTokenPrice(USDC_POLYGON_MUMBAI.address.toLowerCase(), 80001),
      bondIconSvg: 'https://s2.coinmarketcap.com/static/img/coins/200x200/3408.png',
    } as IBondDetails,
  },
}
