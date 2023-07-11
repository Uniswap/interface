import { ChainId } from '@thinkincoin-libs/sdk-core'

import { COMMON_BASES } from './routing'

describe('Routing', () => {
  describe('COMMON_BASES', () => {
    it('contains all coins for mainnet', () => {
      const symbols = COMMON_BASES[ChainId.MAINNET].map((coin) => coin.symbol)
      expect(symbols).toEqual(['ETH', 'DAI', 'USDC', 'USDT', 'WBTC', 'WETH'])
    })
    it('contains all coins for arbitrum', () => {
      const symbols = COMMON_BASES[ChainId.ARBITRUM_ONE].map((coin) => coin.symbol)
      expect(symbols).toEqual(['ETH', 'ARB', 'DAI', 'USDC', 'USDT', 'WBTC', 'WETH'])
    })
    it('contains all coins for optimism', () => {
      const symbols = COMMON_BASES[ChainId.OPTIMISM].map((coin) => coin.symbol)
      expect(symbols).toEqual(['ETH', 'OP', 'DAI', 'USDC', 'USDT', 'WBTC'])
    })
    it('contains all coins for polygon', () => {
      const symbols = COMMON_BASES[ChainId.POLYGON].map((coin) => coin.symbol)
      expect(symbols).toEqual(['MATIC', 'WETH', 'USDC', 'DAI', 'USDT', 'WBTC'])
    })
    it('contains all coins for celo', () => {
      const symbols = COMMON_BASES[ChainId.CELO].map((coin) => coin.symbol)
      expect(symbols).toEqual(['CELO', 'cEUR', 'cUSD', 'ETH', 'USDCet', 'cMCO2'])
    })
    it('contains all coins for bsc', () => {
      const symbols = COMMON_BASES[ChainId.BNB].map((coin) => coin.symbol)
      expect(symbols).toEqual(['BNB', 'DAI', 'USDC', 'USDT', 'ETH', 'BTCB', 'BUSD'])
    })
  })
})
