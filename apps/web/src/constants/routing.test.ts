import { COMMON_BASES } from 'constants/routing'
import { UniverseChainId } from 'uniswap/src/types/chains'

describe('Routing', () => {
  describe('COMMON_BASES', () => {
    it('contains all coins for mainnet', () => {
      const symbols = COMMON_BASES[UniverseChainId.Mainnet].map((coin) => coin.currency.symbol)
      expect(symbols).toEqual(['ETH', 'GRG', 'USDC', 'USDT', 'WBTC', 'WETH'])
    })
    it('contains all coins for arbitrum', () => {
      const symbols = COMMON_BASES[UniverseChainId.ArbitrumOne].map((coin) => coin.currency.symbol)
      expect(symbols).toEqual(['ETH', 'ARB', 'GRG', 'USDC', 'USDT', 'WBTC', 'WETH'])
    })
    it('contains all coins for optimism', () => {
      const symbols = COMMON_BASES[UniverseChainId.Optimism].map((coin) => coin.currency.symbol)
      expect(symbols).toEqual(['ETH', 'OP', 'GRG', 'USDC', 'USDT', 'WBTC', 'WETH'])
    })
    it('contains all coins for polygon', () => {
      const symbols = COMMON_BASES[UniverseChainId.Polygon].map((coin) => coin.currency.symbol)
      expect(symbols).toEqual(['MATIC', 'WETH', 'USDC', 'GRG', 'USDT', 'WBTC'])
    })
    it('contains all coins for celo', () => {
      const symbols = COMMON_BASES[UniverseChainId.Celo].map((coin) => coin.currency.symbol)
      expect(symbols).toEqual(['CELO', 'cEUR', 'cUSD', 'ETH', 'USDC', 'WBTC'])
    })
    it('contains all coins for bsc', () => {
      const symbols = COMMON_BASES[UniverseChainId.Bnb].map((coin) => coin.currency.symbol)
      expect(symbols).toEqual(['BNB', 'GRG', 'USDC', 'USDT', 'ETH', 'BTCB', 'BUSD'])
    })
  })
})
