import { Currency } from '@uniswap/sdk-core'
import { JupiterOrderResponse } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { createSolanaTrade } from 'uniswap/src/features/transactions/swap/types/solana'

// Constants
const SOL_MINT = 'So11111111111111111111111111111111111111112'
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

// Mock currencies for testing
const mockInputToken: Currency = {
  chainId: UniverseChainId.Solana,
  decimals: 9,
  symbol: 'SOL',
  name: 'Solana',
  isNative: true,
  isToken: false,
  equals(other: Currency) {
    return this === other
  },
  wrapped: {} as Currency,
} as Currency

const mockOutputToken: Currency = {
  chainId: UniverseChainId.Solana,
  decimals: 6,
  symbol: 'USDC',
  name: 'USD Coin',
  isNative: false,
  isToken: true,
  equals(other: Currency) {
    return this === other
  },
  wrapped: {} as Currency,
  address: USDC_MINT,
} as Currency

// Helper function to create mock quotes with defaults
function createMockQuote(overrides: Partial<JupiterOrderResponse> = {}): JupiterOrderResponse {
  return {
    inputMint: SOL_MINT,
    outputMint: USDC_MINT,
    inAmount: '1000000000', // 1 SOL
    outAmount: '100000000', // 100 USDC
    otherAmountThreshold: '99000000', // Default for ExactIn
    swapMode: 'ExactIn',
    slippageBps: 50,
    priceImpactPct: '0.01',
    routePlan: [],
    feeBps: 50,
    prioritizationFeeLamports: 0,
    swapType: 'aggregator',
    transaction: '',
    gasless: false,
    requestId: 'test-request-id',
    ...overrides,
  }
}

describe('createSolanaTrade', () => {
  describe('fee handling', () => {
    it('should not adjust output amount when fee is on input token', () => {
      const quote = createMockQuote({
        feeMint: SOL_MINT, // Fee on input (SOL)
        platformFee: {
          amount: '5000000', // 0.005 SOL fee
          feeBps: 50,
        },
      })

      const trade = createSolanaTrade({
        quote,
        inputToken: mockInputToken,
        outputToken: mockOutputToken,
      })

      // Output amount should remain unchanged (100 USDC)
      expect(trade.outputAmount.quotient.toString()).toBe('100000000')
      expect(trade.minAmountOut.quotient.toString()).toBe('99000000')
    })

    it('should adjust output amount when fee is on output token', () => {
      const quote = createMockQuote({
        feeMint: USDC_MINT, // Fee on output (USDC)
        platformFee: {
          amount: '500000', // 0.5 USDC fee
          feeBps: 50,
        },
      })

      const trade = createSolanaTrade({
        quote,
        inputToken: mockInputToken,
        outputToken: mockOutputToken,
      })

      // Output amount should be adjusted (100 - 0.5 = 99.5 USDC)
      expect(trade.outputAmount.quotient.toString()).toBe('99500000')
      // Min amount out should also be adjusted (99 - 0.5 = 98.5 USDC)
      expect(trade.minAmountOut.quotient.toString()).toBe('98500000')
    })

    it('should handle ExactOut mode with fee on output token', () => {
      const quote = createMockQuote({
        swapMode: 'ExactOut',
        otherAmountThreshold: '1100000000', // 1.1 SOL max
        feeMint: USDC_MINT, // Fee on output (USDC)
        platformFee: {
          amount: '500000', // 0.5 USDC fee
          feeBps: 50,
        },
      })

      const trade = createSolanaTrade({
        quote,
        inputToken: mockInputToken,
        outputToken: mockOutputToken,
      })

      // In ExactOut mode, output amount should be adjusted (100 - 0.5 = 99.5 USDC)
      expect(trade.outputAmount.quotient.toString()).toBe('99500000')
      // Min amount out equals output amount in ExactOut mode
      expect(trade.minAmountOut.quotient.toString()).toBe('99500000')
      // Max amount in should remain unchanged
      expect(trade.maxAmountIn.quotient.toString()).toBe('1100000000')
    })

    it('should handle no platform fee', () => {
      const quote = createMockQuote({
        feeBps: 0,
        // No platformFee field
      })

      const trade = createSolanaTrade({
        quote,
        inputToken: mockInputToken,
        outputToken: mockOutputToken,
      })

      // Output amount should remain unchanged
      expect(trade.outputAmount.quotient.toString()).toBe('100000000')
      expect(trade.minAmountOut.quotient.toString()).toBe('99000000')
    })

    it('should handle fee on input token with ExactOut mode', () => {
      const quote = createMockQuote({
        swapMode: 'ExactOut',
        otherAmountThreshold: '1100000000', // 1.1 SOL max
        feeMint: SOL_MINT, // Fee on input (SOL)
        platformFee: {
          amount: '5000000', // 0.005 SOL fee
          feeBps: 50,
        },
      })

      const trade = createSolanaTrade({
        quote,
        inputToken: mockInputToken,
        outputToken: mockOutputToken,
      })

      // Output amount should remain unchanged in ExactOut when fee is on input
      expect(trade.outputAmount.quotient.toString()).toBe('100000000')
      expect(trade.minAmountOut.quotient.toString()).toBe('100000000')
      expect(trade.maxAmountIn.quotient.toString()).toBe('1100000000')
    })
  })

  describe('getter methods', () => {
    it('should return the same value for quoteOutputAmount and quoteOutputAmountUserWillReceive', () => {
      const quote = createMockQuote({
        feeMint: USDC_MINT,
        platformFee: {
          amount: '500000',
          feeBps: 50,
        },
      })

      const trade = createSolanaTrade({
        quote,
        inputToken: mockInputToken,
        outputToken: mockOutputToken,
      })

      // Both getters should return the same adjusted amount
      expect(trade.quoteOutputAmount.quotient.toString()).toBe('99500000')
      expect(trade.quoteOutputAmountUserWillReceive.quotient.toString()).toBe('99500000')
    })
  })

  describe('edge cases', () => {
    it('should handle zero fee amount', () => {
      const quote = createMockQuote({
        feeMint: USDC_MINT,
        feeBps: 0,
        platformFee: {
          amount: '0',
          feeBps: 0,
        },
      })

      const trade = createSolanaTrade({
        quote,
        inputToken: mockInputToken,
        outputToken: mockOutputToken,
      })

      // With zero fee, output should remain unchanged
      expect(trade.outputAmount.quotient.toString()).toBe('100000000')
      expect(trade.minAmountOut.quotient.toString()).toBe('99000000')
    })

    it('should handle missing feeMint field', () => {
      const quote = createMockQuote({
        // feeMint is missing - remove it from the created quote
        platformFee: {
          amount: '500000',
          feeBps: 50,
        },
      })
      // Remove feeMint to simulate it being missing
      delete quote.feeMint

      const trade = createSolanaTrade({
        quote,
        inputToken: mockInputToken,
        outputToken: mockOutputToken,
      })

      // Without feeMint, cannot determine which token fee is on, so no adjustment
      expect(trade.outputAmount.quotient.toString()).toBe('100000000')
      expect(trade.minAmountOut.quotient.toString()).toBe('99000000')
    })
  })
})
