import { ChainId, Currency } from 'dxswap-sdk'
import { DAI, USDC, USDT, COMP, MKR, AMPL, WBTC } from '../../constants'

export const MainPage = 'Governance Main Page'
export const PairPage = 'Governance Pair Page'

export const temporaryCurrencyData: Array<Currency> = [
  DAI[ChainId.MAINNET],
  USDC[ChainId.MAINNET],
  USDT[ChainId.MAINNET],
  COMP,
  MKR,
  AMPL,
  WBTC
]
