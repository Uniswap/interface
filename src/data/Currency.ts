import { Currency } from '@fuseio/fuse-swap-sdk'

class NativeCurrency extends Currency {
  // eslint-disable-next-line
  constructor(decimals: number, symbol: string, name: string) {
    super(decimals, symbol, name)
  }
}

export const BNB = new NativeCurrency(18, 'BNB', 'Binance')
