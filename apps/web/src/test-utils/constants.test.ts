import {
  DAI_ARBITRUM_INFO,
  DAI_INFO,
  ETH_MAINNET,
  ETH_SEPOLIA,
  LIMIT_ORDER_TRADE,
  NATIVE_INFO,
  PREVIEW_EXACT_IN_TRADE,
  TEST_ALLOWED_SLIPPAGE,
  TEST_DUTCH_TRADE_ETH_INPUT,
  TEST_DUTCH_V2_TRADE_ETH_INPUT,
  TEST_POOL_12,
  TEST_POOL_13,
  TEST_TOKEN_1,
  TEST_TOKEN_1_INFO,
  TEST_TOKEN_2,
  TEST_TOKEN_2_INFO,
  TEST_TOKEN_3,
  TEST_TOKEN_3_INFO,
  TEST_TRADE_EXACT_INPUT,
  TEST_TRADE_EXACT_INPUT_API,
  TEST_TRADE_EXACT_OUTPUT,
  TEST_TRADE_FEE_ON_BUY,
  TEST_TRADE_FEE_ON_SELL,
  toCurrencyAmount,
  US,
  USDC_ARBITRUM_INFO,
  USDC_INFO,
  USDT_INFO,
  USE_DISCONNECTED_ACCOUNT,
  WBTC_INFO,
  WETH_INFO,
} from 'test-utils/constants'

describe('test-utils/constants', () => {
  it('should load all token constants', () => {
    expect(TEST_TOKEN_1).toBeDefined()
    expect(TEST_TOKEN_1_INFO).toBeDefined()
    expect(TEST_TOKEN_2).toBeDefined()
    expect(TEST_TOKEN_2_INFO).toBeDefined()
    expect(TEST_TOKEN_3).toBeDefined()
    expect(TEST_TOKEN_3_INFO).toBeDefined()
  })

  it('should load native currency constants', () => {
    expect(ETH_MAINNET).toBeDefined()
    expect(ETH_SEPOLIA).toBeDefined()
    expect(NATIVE_INFO).toBeDefined()
  })

  it('should load pool constants', () => {
    expect(TEST_POOL_12).toBeDefined()
    expect(TEST_POOL_13).toBeDefined()
  })

  it('should load trade constants', () => {
    expect(TEST_TRADE_EXACT_INPUT).toBeDefined()
    expect(TEST_TRADE_EXACT_INPUT_API).toBeDefined()
    expect(TEST_TRADE_EXACT_OUTPUT).toBeDefined()
    expect(TEST_ALLOWED_SLIPPAGE).toBeDefined()
  })

  it('should load UniswapX trade constants', () => {
    expect(TEST_DUTCH_TRADE_ETH_INPUT).toBeDefined()
    expect(TEST_DUTCH_V2_TRADE_ETH_INPUT).toBeDefined()
  })

  it('should load fee-on-transfer trade constants', () => {
    expect(TEST_TRADE_FEE_ON_SELL).toBeDefined()
    expect(TEST_TRADE_FEE_ON_BUY).toBeDefined()
  })

  it('should load special trade types', () => {
    expect(PREVIEW_EXACT_IN_TRADE).toBeDefined()
    expect(LIMIT_ORDER_TRADE).toBeDefined()
  })

  it('should load currency info constants', () => {
    expect(WETH_INFO).toBeDefined()
    expect(DAI_INFO).toBeDefined()
    expect(USDC_INFO).toBeDefined()
    expect(USDT_INFO).toBeDefined()
    expect(WBTC_INFO).toBeDefined()
    expect(DAI_ARBITRUM_INFO).toBeDefined()
    expect(USDC_ARBITRUM_INFO).toBeDefined()
  })

  it('should load account constants', () => {
    expect(USE_DISCONNECTED_ACCOUNT).toBeDefined()
  })

  it('should load utility functions', () => {
    expect(toCurrencyAmount).toBeDefined()
    expect(typeof toCurrencyAmount).toBe('function')
  })

  it('should load country constants', () => {
    expect(US).toBeDefined()
  })

  it('should be able to call toCurrencyAmount function', () => {
    const result = toCurrencyAmount(TEST_TOKEN_1, 1000)
    expect(result).toBeDefined()
  })
})
