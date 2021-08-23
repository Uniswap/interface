import { ChainId, Currency } from '@swapr/sdk'
import { DAI, USDC, USDT, WBTC } from '../../constants'

export const MainPage = 'Governance Main Page'
export const PairPage = 'Governance Pair Page'

export const temporaryCurrencyData: Array<Currency> = [
  DAI,
  USDC[ChainId.MAINNET],
  USDT[ChainId.MAINNET],
  WBTC[ChainId.MAINNET]
]
