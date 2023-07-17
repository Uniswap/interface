import { ChainId, CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { V3Route } from '@uniswap/smart-order-router'
import { FeeAmount, Pool } from '@uniswap/v3-sdk'
import { nativeOnChain } from 'constants/tokens'
import { BigNumber } from 'ethers/lib/ethers'
import JSBI from 'jsbi'
import { ClassicTrade, DutchOrderTrade, QuoteMethod } from 'state/routing/types'

export const TEST_TOKEN_1 = new Token(1, '0x0000000000000000000000000000000000000001', 18, 'ABC', 'Abc')
export const TEST_TOKEN_2 = new Token(1, '0x0000000000000000000000000000000000000002', 18, 'DEF', 'Def')
export const TEST_TOKEN_3 = new Token(1, '0x0000000000000000000000000000000000000003', 18, 'GHI', 'Ghi')
export const TEST_RECIPIENT_ADDRESS = '0x0000000000000000000000000000000000000004'
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
      routev3: new V3Route([TEST_POOL_12], TEST_TOKEN_1, TEST_TOKEN_2),
      inputAmount: toCurrencyAmount(TEST_TOKEN_1, 1000),
      outputAmount: toCurrencyAmount(TEST_TOKEN_2, 1000),
    },
  ],
  v2Routes: [],
  tradeType: TradeType.EXACT_INPUT,
  gasUseEstimateUSD: 1.0,
  approveInfo: { needsApprove: false },
  quoteMethod: QuoteMethod.CLIENT_SIDE,
})

export const TEST_TRADE_EXACT_OUTPUT = new ClassicTrade({
  v3Routes: [
    {
      routev3: new V3Route([TEST_POOL_13], TEST_TOKEN_1, TEST_TOKEN_3),
      inputAmount: toCurrencyAmount(TEST_TOKEN_1, 1000),
      outputAmount: toCurrencyAmount(TEST_TOKEN_3, 1000),
    },
  ],
  v2Routes: [],
  tradeType: TradeType.EXACT_OUTPUT,
  quoteMethod: QuoteMethod.CLIENT_SIDE,
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
  slippageTolerance: new Percent(5, 100),
})
