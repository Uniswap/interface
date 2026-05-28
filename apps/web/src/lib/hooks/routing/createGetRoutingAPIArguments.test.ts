import { Protocol } from '@uniswap/router-sdk'
import { CurrencyAmount, Ether, Token, TradeType } from '@uniswap/sdk-core'
import { createGetRoutingAPIArguments, validateRoutingAPIInput } from 'lib/hooks/routing/createGetRoutingAPIArguments'
import { INTERNAL_ROUTER_PREFERENCE_PRICE, RouterPreference, URAQuoteType } from 'state/routing/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

describe('createGetRoutingAPIArguments', () => {
  // Minimal fixtures
  const ACCOUNT = '0x1234'
  const ARBITRUM = UniverseChainId.ArbitrumOne
  const MAINNET = UniverseChainId.Mainnet
  const ETH = Ether.onChain(MAINNET)
  const USDC = new Token(MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC')
  const WETH = new Token(MAINNET, '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 18, 'WETH')
  const ARB_USDC = new Token(ARBITRUM, '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', 6, 'USDC')
  const ARB_WETH = new Token(ARBITRUM, '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', 18, 'WETH')

  // Default input with required properties for validation
  const defaultInput = {
    account: ACCOUNT,
    tokenIn: USDC,
    tokenOut: WETH,
    amount: CurrencyAmount.fromRawAmount(USDC, '10000000'),
    tradeType: TradeType.EXACT_INPUT,
    routerPreference: RouterPreference.API,
  }

  describe('input validation', () => {
    test('validates valid input', () => {
      expect(validateRoutingAPIInput(defaultInput)).toBe(true)
    })

    test('rejects when tokens are the same', () => {
      expect(
        validateRoutingAPIInput({
          ...defaultInput,
          tokenOut: USDC,
        }),
      ).toBe(false)
    })

    test('rejects when tokens have the same address on the same chain', () => {
      // Create a different token instance with the same underlying address
      const sameAddressToken = new Token(MAINNET, USDC.address, USDC.decimals, 'DUPLICATE')
      expect(
        validateRoutingAPIInput({
          ...defaultInput,
          tokenOut: sameAddressToken,
        }),
      ).toBe(false)
    })

    test('rejects when missing required fields', () => {
      expect(
        validateRoutingAPIInput({
          ...defaultInput,
          tokenIn: undefined,
        }),
      ).toBe(false)

      expect(
        validateRoutingAPIInput({
          ...defaultInput,
          tokenOut: undefined,
        }),
      ).toBe(false)

      expect(
        validateRoutingAPIInput({
          ...defaultInput,
          amount: undefined,
        }),
      ).toBe(false)
    })

    test('throws error for invalid input', () => {
      const getRoutingAPIArguments = createGetRoutingAPIArguments({
        canUseUniswapX: true,
        isPriorityOrdersEnabled: false,
        isDutchV3Enabled: false,
      })

      expect(() =>
        getRoutingAPIArguments({
          ...defaultInput,
          tokenIn: undefined,
        }),
      ).toThrow('Invalid routing API input')
    })
  })

  // Test cases for routing type determination
  const routingTypeTests = [
    {
      name: 'returns CLASSIC when UniswapX is disabled',
      context: { canUseUniswapX: false, isPriorityOrdersEnabled: false, isDutchV3Enabled: false },
      input: { ...defaultInput },
      expected: { routingType: URAQuoteType.CLASSIC },
    },
    {
      name: 'returns PRIORITY for priority orders',
      context: { canUseUniswapX: true, isPriorityOrdersEnabled: true, isDutchV3Enabled: false },
      input: { ...defaultInput, routerPreference: RouterPreference.X },
      expected: { routingType: URAQuoteType.PRIORITY },
    },
    {
      name: 'returns DUTCH_V1 on Arbitrum when Dutch V3 is disabled',
      context: { canUseUniswapX: true, isPriorityOrdersEnabled: false, isDutchV3Enabled: false },
      input: {
        ...defaultInput,
        tokenIn: ARB_USDC,
        tokenOut: ARB_WETH,
        amount: CurrencyAmount.fromRawAmount(ARB_USDC, '10000000'),
      },
      expected: { routingType: URAQuoteType.DUTCH_V1 },
    },
    {
      name: 'returns DUTCH_V3 on Arbitrum when Dutch V3 is enabled',
      context: { canUseUniswapX: true, isPriorityOrdersEnabled: false, isDutchV3Enabled: true },
      input: {
        ...defaultInput,
        tokenIn: ARB_USDC,
        tokenOut: ARB_WETH,
        amount: CurrencyAmount.fromRawAmount(ARB_USDC, '10000000'),
      },
      expected: { routingType: URAQuoteType.DUTCH_V3 },
    },
    {
      name: 'returns DUTCH_V2 on non-Arbitrum chains',
      context: { canUseUniswapX: true, isPriorityOrdersEnabled: false, isDutchV3Enabled: false },
      input: { ...defaultInput },
      expected: { routingType: URAQuoteType.DUTCH_V2 },
    },
  ]

  // Other behavior tests
  const otherTests = [
    {
      name: 'disables sendPortionEnabled for price quotes',
      context: { canUseUniswapX: true, isPriorityOrdersEnabled: false, isDutchV3Enabled: false },
      input: { ...defaultInput, routerPreference: INTERNAL_ROUTER_PREFERENCE_PRICE },
      expected: { sendPortionEnabled: false },
    },
    {
      name: 'sets needsWrapIfUniswapX for native tokens',
      context: { canUseUniswapX: true, isPriorityOrdersEnabled: false, isDutchV3Enabled: false },
      input: {
        ...defaultInput,
        tokenIn: ETH,
        tokenOut: USDC,
        amount: CurrencyAmount.fromRawAmount(ETH, '1000000000000000000'),
      },
      expected: { needsWrapIfUniswapX: true },
    },
    {
      name: 'correctly handles protocol preferences',
      context: { canUseUniswapX: true, isPriorityOrdersEnabled: false, isDutchV3Enabled: false },
      input: { ...defaultInput, protocolPreferences: [Protocol.V2, Protocol.V3] },
      expected: { protocolPreferences: [Protocol.V2, Protocol.V3] },
    },
  ]

  // Run all test cases using a single test runner
  describe('routing types', () => {
    test.each(routingTypeTests)('$name', ({ context, input, expected }) => {
      const getRoutingAPIArguments = createGetRoutingAPIArguments(context)
      const result = getRoutingAPIArguments(input)
      expect(result).toMatchObject(expected)
    })
  })

  describe('other behavior', () => {
    test.each(otherTests)('$name', ({ context, input, expected }) => {
      const getRoutingAPIArguments = createGetRoutingAPIArguments(context)
      const result = getRoutingAPIArguments(input)
      expect(result).toMatchObject(expected)
    })
  })
})
