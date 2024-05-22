import { ChainId, CurrencyAmount, Percent, Token, TradeType, WETH9 } from '@uniswap/sdk-core'
import { FeeAmount, Pool, Route } from '@uniswap/v3-sdk'
import { DAI, DAI_ARBITRUM_ONE, USDC_ARBITRUM, USDC_MAINNET, USDT, WBTC, nativeOnChain } from 'constants/tokens'
import { BigNumber } from 'ethers/lib/ethers'
import JSBI from 'jsbi'
import { expiryToDeadlineSeconds } from 'state/limit/expiryToDeadlineSeconds'
import { Expiry } from 'state/limit/types'
import { ClassicTrade, DutchOrderTrade, LimitOrderTrade, PreviewTrade, QuoteMethod } from 'state/routing/types'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

export const TEST_TOKEN_1 = new Token(1, '0x0000000000000000000000000000000000000001', 18, 'ABC', 'Abc')
export const TEST_TOKEN_1_INFO: CurrencyInfo = {
  currency: TEST_TOKEN_1,
  logoUrl:
    'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x0000000000000000000000000000000000000001/logo.png',
  currencyId: 'ABC',
  safetyLevel: SafetyLevel.Verified,
}
export const TEST_TOKEN_2 = new Token(1, '0x0000000000000000000000000000000000000002', 18, 'DEF', 'Def')
export const TEST_TOKEN_2_INFO: CurrencyInfo = {
  currency: TEST_TOKEN_2,
  logoUrl:
    'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x0000000000000000000000000000000000000002/logo.png',
  currencyId: 'DEF',
  safetyLevel: SafetyLevel.Verified,
}
export const TEST_TOKEN_3 = new Token(1, '0x0000000000000000000000000000000000000003', 18, 'GHI', 'Ghi')
export const TEST_TOKEN_3_INFO: CurrencyInfo = {
  currency: TEST_TOKEN_3,
  logoUrl:
    'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x0000000000000000000000000000000000000003/logo.png',
  currencyId: 'GHI',
  safetyLevel: SafetyLevel.Verified,
}
export const ETH_MAINNET = nativeOnChain(ChainId.MAINNET)

export const TEST_POOL_12 = new Pool(
  TEST_TOKEN_1,
  TEST_TOKEN_2,
  FeeAmount.HIGH,
  '2437312313659959819381354528',
  '10272714736694327408',
  -69633
)

export const TEST_POOL_13 = new Pool(
  TEST_TOKEN_1,
  TEST_TOKEN_3,
  FeeAmount.MEDIUM,
  '2437312313659959819381354528',
  '10272714736694327408',
  -69633
)

export const toCurrencyAmount = (token: Token, amount: number) =>
  CurrencyAmount.fromRawAmount(token, JSBI.BigInt(amount))

export const TEST_TRADE_EXACT_INPUT = new ClassicTrade({
  v3Routes: [
    {
      routev3: new Route([TEST_POOL_12], TEST_TOKEN_1, TEST_TOKEN_2),
      inputAmount: toCurrencyAmount(TEST_TOKEN_1, 1000),
      outputAmount: toCurrencyAmount(TEST_TOKEN_2, 1000),
    },
  ],
  v2Routes: [],
  tradeType: TradeType.EXACT_INPUT,
  gasUseEstimateUSD: 1.0,
  approveInfo: { needsApprove: false },
  quoteMethod: QuoteMethod.CLIENT_SIDE_FALLBACK,
})

export const TEST_TRADE_EXACT_INPUT_API = new ClassicTrade({
  v3Routes: [
    {
      routev3: new Route([TEST_POOL_12], TEST_TOKEN_1, TEST_TOKEN_2),
      inputAmount: toCurrencyAmount(TEST_TOKEN_1, 1000),
      outputAmount: toCurrencyAmount(TEST_TOKEN_2, 1000),
    },
  ],
  v2Routes: [],
  tradeType: TradeType.EXACT_INPUT,
  gasUseEstimateUSD: 1.0,
  approveInfo: { needsApprove: false },
  quoteMethod: QuoteMethod.ROUTING_API,
})

export const TEST_TRADE_EXACT_OUTPUT = new ClassicTrade({
  v3Routes: [
    {
      routev3: new Route([TEST_POOL_13], TEST_TOKEN_1, TEST_TOKEN_3),
      inputAmount: toCurrencyAmount(TEST_TOKEN_1, 1000),
      outputAmount: toCurrencyAmount(TEST_TOKEN_3, 1000),
    },
  ],
  v2Routes: [],
  tradeType: TradeType.EXACT_OUTPUT,
  quoteMethod: QuoteMethod.CLIENT_SIDE_FALLBACK,
  approveInfo: { needsApprove: false },
})

export const TEST_ALLOWED_SLIPPAGE = new Percent(2, 100)

export const TEST_DUTCH_TRADE_ETH_INPUT = new DutchOrderTrade({
  currencyIn: ETH_MAINNET.wrapped,
  currenciesOut: [TEST_TOKEN_2],
  orderInfo: {
    reactor: 'test_reactor',
    swapper: 'test_offerer',
    nonce: BigNumber.from(1),
    deadline: 1000,
    decayStartTime: 0,
    decayEndTime: 10,
    additionalValidationContract: '0x0',
    additionalValidationData: '0x0',
    exclusiveFiller: '0x3456',
    exclusivityOverrideBps: BigNumber.from(0),
    input: {
      token: ETH_MAINNET.wrapped.address,
      startAmount: BigNumber.from(1000),
      endAmount: BigNumber.from(900),
    },
    outputs: [
      {
        token: TEST_TOKEN_2.address,
        startAmount: BigNumber.from(1000),
        endAmount: BigNumber.from(900),
        recipient: '0x0',
      },
    ],
  },
  tradeType: TradeType.EXACT_INPUT,
  quoteId: '0x0000000',
  wrapInfo: { needsWrap: false },
  approveInfo: { needsApprove: false },
  classicGasUseEstimateUSD: 7.87,
  auctionPeriodSecs: 120,
  deadlineBufferSecs: 30,
  startTimeBufferSecs: 30,
  slippageTolerance: new Percent(5, 100),
})

const SELL_FEE_TOKEN = new Token(
  1,
  '0x0000000000000000000000000000000000000001',
  18,
  'ABC',
  'Abc',
  false,
  undefined,
  BigNumber.from(300)
)
const TEST_POOL_FOT_1 = new Pool(
  SELL_FEE_TOKEN,
  TEST_TOKEN_2,
  FeeAmount.HIGH,
  '2437312313659959819381354528',
  '10272714736694327408',
  -69633
)
export const TEST_TRADE_FEE_ON_SELL = new ClassicTrade({
  v3Routes: [
    {
      routev3: new Route([TEST_POOL_FOT_1], SELL_FEE_TOKEN, TEST_TOKEN_2),
      inputAmount: toCurrencyAmount(SELL_FEE_TOKEN, 1000),
      outputAmount: toCurrencyAmount(TEST_TOKEN_2, 1000),
    },
  ],
  v2Routes: [],
  tradeType: TradeType.EXACT_INPUT,
  gasUseEstimateUSD: 1.0,
  approveInfo: { needsApprove: false },
  quoteMethod: QuoteMethod.ROUTING_API,
})

const BUY_FEE_TOKEN = new Token(
  1,
  '0x0000000000000000000000000000000000000002',
  18,
  'DEF',
  'Def',
  false,
  BigNumber.from(300),
  undefined
)
const TEST_POOL_FOT_2 = new Pool(
  TEST_TOKEN_1,
  BUY_FEE_TOKEN,
  FeeAmount.HIGH,
  '2437312313659959819381354528',
  '10272714736694327408',
  -69633
)
export const TEST_TRADE_FEE_ON_BUY = new ClassicTrade({
  v3Routes: [
    {
      routev3: new Route([TEST_POOL_FOT_2], TEST_TOKEN_1, BUY_FEE_TOKEN),
      inputAmount: toCurrencyAmount(TEST_TOKEN_1, 1000),
      outputAmount: toCurrencyAmount(BUY_FEE_TOKEN, 1000),
    },
  ],
  v2Routes: [],
  tradeType: TradeType.EXACT_INPUT,
  gasUseEstimateUSD: 1.0,
  approveInfo: { needsApprove: false },
  quoteMethod: QuoteMethod.ROUTING_API,
})

export const PREVIEW_EXACT_IN_TRADE = new PreviewTrade({
  inputAmount: toCurrencyAmount(TEST_TOKEN_1, 1000),
  outputAmount: toCurrencyAmount(TEST_TOKEN_2, 1000),
  tradeType: TradeType.EXACT_INPUT,
})

export const LIMIT_ORDER_TRADE = new LimitOrderTrade({
  amountIn: CurrencyAmount.fromRawAmount(DAI, 100),
  amountOut: CurrencyAmount.fromRawAmount(USDC_MAINNET, 100),
  tradeType: TradeType.EXACT_INPUT,
  wrapInfo: { needsWrap: false },
  approveInfo: { needsApprove: false },
  swapper: '0xSwapperAddress',
  deadlineBufferSecs: expiryToDeadlineSeconds(Expiry.Week),
})

export const NATIVE_INFO: CurrencyInfo = {
  currency: ETH_MAINNET,
  logoUrl: 'ethereum-logo.png',
  currencyId: 'ETH',
  safetyLevel: SafetyLevel.Verified,
}

export const WETH_INFO: CurrencyInfo = {
  currency: WETH9[ChainId.MAINNET],
  logoUrl:
    'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
  currencyId: WETH9[ChainId.MAINNET].address,
  safetyLevel: SafetyLevel.Verified,
}

export const DAI_INFO: CurrencyInfo = {
  currency: DAI,
  logoUrl:
    'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
  currencyId: DAI.address,
  safetyLevel: SafetyLevel.Verified,
}

export const USDC_INFO: CurrencyInfo = {
  currency: USDC_MAINNET,
  logoUrl:
    'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
  currencyId: USDC_MAINNET.address,
  safetyLevel: SafetyLevel.Verified,
}

export const USDT_INFO: CurrencyInfo = {
  currency: USDT,
  logoUrl:
    'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
  currencyId: USDT.address,
  safetyLevel: SafetyLevel.Verified,
}

export const WBTC_INFO: CurrencyInfo = {
  currency: WBTC,
  logoUrl:
    'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
  currencyId: WBTC.address,
  safetyLevel: SafetyLevel.Verified,
}

export const DAI_ARBITRUM_INFO: CurrencyInfo = {
  currency: DAI_ARBITRUM_ONE,
  logoUrl:
    'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/arbitrum/assets/0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1/logo.png',
  currencyId: DAI_ARBITRUM_ONE.address,
  safetyLevel: SafetyLevel.Verified,
}

export const USDC_ARBITRUM_INFO: CurrencyInfo = {
  currency: USDC_ARBITRUM,
  logoUrl:
    'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/arbitrum/assets/0xaf88d065e77c8cC2239327C5EDb3A432268e5831/logo.png',
  currencyId: USDC_ARBITRUM.address,
  safetyLevel: SafetyLevel.Verified,
}
