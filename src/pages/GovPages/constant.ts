import { Currency } from 'dxswap-sdk'

export const MainPage = 'Governance Main Page'
export const PairPage = 'Governance Pair Page'

const USDC: Currency = {
  decimals: 18,
  name: 'USD Coin',
  symbol: 'USDC'
}

const DXD: Currency = {
  decimals: 18,
  name: 'DXdao',
  symbol: 'DXD'
}

const DMG: Currency = {
  decimals: 18,
  name: 'DMM: Governance',
  symbol: 'DMG'
}

const SNT: Currency = {
  decimals: 18,
  name: 'Status',
  symbol: 'SNT'
}

const RARI: Currency = {
  decimals: 18,
  name: 'Rarible',
  symbol: 'RARI'
}

const DAI: Currency = {
  decimals: 18,
  name: 'Dai',
  symbol: 'DAI'
}

const USDT: Currency = {
  decimals: 18,
  name: 'Tether',
  symbol: 'USDT'
}

export const temporaryCurrencyData: Array<Currency> = [USDC, DXD, DMG, SNT, RARI, DAI, USDT]
