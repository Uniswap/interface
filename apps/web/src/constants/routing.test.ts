import { ChainId } from '@uniswap/sdk-core'

import { COMMON_BASES } from './routing'

describe('Routing', () => {
  describe('COMMON_BASES', () => {
    it('contains all coins for mainnet', () => {
      const symbols = COMMON_BASES[ChainId.MAINNET].map((coin) => coin.symbol)
      expect(symbols).toEqual(['ETH', 'GRG', 'USDC', 'USDT', 'WBTC', 'WETH'])
    })
    it('contains all coins for arbitrum', () => {
      const symbols = COMMON_BASES[ChainId.ARBITRUM_ONE].map((coin) => coin.symbol)
      expect(symbols).toEqual(['ETH', 'ARB', 'GRG', 'USDC', 'USDT', 'WBTC', 'WETH'])
    })
    it('contains all coins for optimism', () => {
      const symbols = COMMON_BASES[ChainId.OPTIMISM].map((coin) => coin.symbol)
      expect(symbols).toEqual(['ETH', 'OP', 'GRG', 'USDC', 'USDT', 'WBTC', 'WETH'])
    })
    it('contains all coins for polygon', () => {
      const symbols = COMMON_BASES[ChainId.POLYGON].map((coin) => coin.symbol)
      expect(symbols).toEqual(['MATIC', 'WETH', 'USDC', 'GRG', 'USDT', 'WBTC'])
    })
    it('contains all coins for celo', () => {
      const symbols = COMMON_BASES[ChainId.CELO].map((coin) => coin.currency.symbol)
      expect(symbols).toEqual(['CELO', 'cEUR', 'cUSD', 'ETH', 'USDC', 'WBTC'])
    })
    it('contains all coins for bsc', () => {
      const symbols = COMMON_BASES[ChainId.BNB].map((coin) => coin.symbol)
      expect(symbols).toEqual(['BNB', 'GRG', 'USDC', 'USDT', 'ETH', 'BTCB', 'BUSD'])
    })
  })
})
