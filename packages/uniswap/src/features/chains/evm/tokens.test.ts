import { Token } from '@uniswap/sdk-core'
import { buildChainTokens } from 'uniswap/src/features/chains/evm/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { buildDAI, buildUSDC, buildUSDT } from 'uniswap/src/features/tokens/stablecoin'

describe('buildChainTokens', () => {
  const chainId = UniverseChainId.Mainnet
  const usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  const usdtAddress = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
  const daiAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F'

  const expectToken = (token: Token | undefined, expected: Partial<Token>): void => {
    expect(token).toBeDefined()
    if (token) {
      expect(token.chainId).toBe(expected.chainId)
      expect(token.address).toBe(expected.address)
      expect(token.decimals).toBe(expected.decimals)
      expect(token.symbol).toBe(expected.symbol)
      expect(token.name).toBe(expected.name)
    }
  }

  describe('when building tokens with stablecoin builders', () => {
    it('should build USDC from buildUSDC', () => {
      const result = buildChainTokens({
        stables: {
          USDC: buildUSDC(usdcAddress, chainId),
        },
      })

      expectToken(result.USDC, {
        address: usdcAddress,
        chainId,
        decimals: 6,
        symbol: 'USDC',
        name: 'USD Coin',
      })
      expect(result.stablecoins[0]).toBe(result.USDC)
    })

    it('should build USDT from buildUSDT', () => {
      const result = buildChainTokens({
        stables: {
          USDT: buildUSDT(usdtAddress, chainId),
        },
      })

      expectToken(result.USDT, {
        address: usdtAddress,
        chainId,
        decimals: 6,
        symbol: 'USDT',
        name: 'Tether USD',
      })
      expect(result.stablecoins[0]).toBe(result.USDT)
    })

    it('should build DAI from buildDAI', () => {
      const result = buildChainTokens({
        stables: {
          DAI: buildDAI(daiAddress, chainId),
        },
      })

      expectToken(result.DAI, {
        address: daiAddress,
        chainId,
        decimals: 18,
        symbol: 'DAI',
        name: 'Dai Stablecoin',
      })
      expect(result.stablecoins[0]).toBe(result.DAI)
    })

    it('should build multiple stablecoins and sort them correctly', () => {
      const result = buildChainTokens({
        stables: {
          USDC: buildUSDC(usdcAddress, chainId),
          USDT: buildUSDT(usdtAddress, chainId),
          DAI: buildDAI(daiAddress, chainId),
        },
      })

      expect(result.stablecoins).toHaveLength(3)
      expect(result.stablecoins[0]).toBe(result.USDC) // USDC should be first
      expect(result.stablecoins[1]).toBe(result.USDT) // USDT should be second
      expect(result.stablecoins[2]).toBe(result.DAI) // DAI should be third
    })
  })

  describe('when using custom Token instances', () => {
    it('should use custom USDC token with non-standard properties', () => {
      const customUSDC = new Token(chainId, usdcAddress, 18, 'USDC', 'USD Coin')
      const result = buildChainTokens({
        stables: {
          USDC: customUSDC,
        },
      })

      expect(result.USDC).toBe(customUSDC)
      expect(result.stablecoins[0]).toBe(customUSDC)
      expect(customUSDC.decimals).toBe(18) // Non-standard decimals
    })

    it('should use custom USDT token with non-standard properties', () => {
      const customUSDT = new Token(chainId, usdtAddress, 18, 'USDT', 'Tether USD')
      const result = buildChainTokens({
        stables: {
          USDT: customUSDT,
        },
      })

      expect(result.USDT).toBe(customUSDT)
      expect(result.stablecoins[0]).toBe(customUSDT)
      expect(customUSDT.decimals).toBe(18) // Non-standard decimals
    })

    it('should use custom non-standard stablecoin (e.g., USDB)', () => {
      const customUSDB = new Token(chainId, '0x4300000000000000000000000000000000000003', 18, 'USDB', 'USDB')
      const result = buildChainTokens({
        stables: {
          USDB: customUSDB,
        },
      })

      expect(result.USDB).toBe(customUSDB)
      expect(result.stablecoins[0]).toBe(customUSDB)
    })

    it('should sort custom tokens correctly with standard stablecoins', () => {
      const customUSDB = new Token(chainId, '0x4300000000000000000000000000000000000003', 18, 'USDB', 'USDB')
      const result = buildChainTokens({
        stables: {
          USDC: buildUSDC(usdcAddress, chainId),
          USDT: buildUSDT(usdtAddress, chainId),
          USDB: customUSDB,
        },
      })

      expect(result.stablecoins).toHaveLength(3)
      expect(result.stablecoins[0]).toBe(result.USDC) // USDC first
      expect(result.stablecoins[1]).toBe(result.USDT) // USDT second
      expect(result.stablecoins[2]).toBe(result.USDB) // USDB third (custom)
    })
  })

  describe('when mixing stablecoin builders and custom tokens', () => {
    it('should handle mix of builders and custom tokens', () => {
      const customDAI = new Token(chainId, daiAddress, 18, 'DAI.e', 'Dai.e Token')
      const result = buildChainTokens({
        stables: {
          USDC: buildUSDC(usdcAddress, chainId),
          USDT: buildUSDT(usdtAddress, chainId),
          DAI: customDAI,
        },
      })

      expectToken(result.USDC, {
        address: usdcAddress,
        chainId,
        decimals: 6,
        symbol: 'USDC',
        name: 'USD Coin',
      })
      expectToken(result.USDT, {
        address: usdtAddress,
        chainId,
        decimals: 6,
        symbol: 'USDT',
        name: 'Tether USD',
      })
      expect(result.DAI).toBe(customDAI)
      expect(result.stablecoins).toHaveLength(3)
      expect(result.stablecoins[0]).toBe(result.USDC)
      expect(result.stablecoins[1]).toBe(result.USDT)
      expect(result.stablecoins[2]).toBe(customDAI)
    })
  })

  describe('edge cases', () => {
    it('should handle empty stables object', () => {
      expect(() => {
        buildChainTokens({
          stables: {},
        })
      }).toThrow('Must provide at least one stablecoin for each chain')
    })
  })

  describe('type safety', () => {
    it('should return correct type with stablecoins array', () => {
      const result = buildChainTokens({
        stables: {
          USDC: buildUSDC(usdcAddress, chainId),
        },
      })

      // TypeScript should infer that stablecoins is a non-empty array
      expect(Array.isArray(result.stablecoins)).toBe(true)
      expect(result.stablecoins.length).toBeGreaterThan(0)
      expect(result.stablecoins[0]).toBeInstanceOf(Token)
    })

    it('should preserve all properties from input stables', () => {
      const customToken = new Token(chainId, '0x1234567890123456789012345678901234567890', 18, 'CUSTOM', 'Custom Token')
      const result = buildChainTokens({
        stables: {
          USDC: buildUSDC(usdcAddress, chainId),
          CUSTOM: customToken,
        },
      })

      expect(result.USDC).toBeDefined()
      expect(result.CUSTOM).toBe(customToken)
      expect(result.stablecoins).toHaveLength(2)
      expect(result.stablecoins[0]).toBe(result.USDC)
      expect(result.stablecoins[1]).toBe(customToken)
    })
  })
})
