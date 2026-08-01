import { BigNumber } from '@ethersproject/bignumber'
import { Percent, Token, TradeType } from '@uniswap/sdk-core'
import type {
  BridgeQuoteResponse,
  ChainedQuoteResponse,
  ClassicQuoteResponse,
  DutchQuoteResponse,
  DutchV3QuoteResponse,
  PriorityQuoteResponse,
  UnwrapQuoteResponse,
  WrapQuoteResponse,
} from '@universe/api'
import { TradingApi } from '@universe/api'
import { USDC, USDC_MAINNET, USDC_UNICHAIN } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { createEarnChainedActionDisplayAmounts } from 'uniswap/src/features/earn/chainedDisplayAmounts'
import { createBridgeTrade } from 'uniswap/src/features/transactions/swap/types/bridge'
import { createChainedActionTrade } from 'uniswap/src/features/transactions/swap/types/chained'
import { createClassicTrade } from 'uniswap/src/features/transactions/swap/types/classic'
import { createIndicativeTrade } from 'uniswap/src/features/transactions/swap/types/indicative'
import { validateIndicativeQuoteResponse } from 'uniswap/src/features/transactions/swap/types/trade'
import {
  createPriorityOrderTrade,
  createUniswapXV2Trade,
  createUniswapXV3Trade,
} from 'uniswap/src/features/transactions/swap/types/uniswapx'
import { createUnwrapTrade, createWrapTrade } from 'uniswap/src/features/transactions/swap/types/wrap'
import { WETH } from 'uniswap/src/test/fixtures/lib/sdk'

const SWAPPER = '0xAAAA44272dc658575Ba38f43C438447dDED45358'
const FEE_RECIPIENT = '0xbbbb44272dc658575Ba38f43C438447dDED45358'
const DEADLINE = 1700000000

// FOT (fee-on-transfer) currencies — taxes are sourced from these, not from the quote route.
// Use values distinct from the route's `sellFeeBps`/`buyFeeBps` (250/300) to prove the route is ignored.
const WETH_WITH_SELL_TAX = new Token(
  WETH.chainId,
  WETH.address,
  WETH.decimals,
  WETH.symbol,
  WETH.name,
  /* bypassChecksum */ false,
  /* buyFeeBps */ undefined,
  /* sellFeeBps */ BigNumber.from(111),
)
const USDC_WITH_BUY_TAX = new Token(
  USDC_MAINNET.chainId,
  USDC_MAINNET.address,
  USDC_MAINNET.decimals,
  USDC_MAINNET.symbol,
  USDC_MAINNET.name,
  /* bypassChecksum */ false,
  /* buyFeeBps */ BigNumber.from(222),
  /* sellFeeBps */ undefined,
)

const DEFAULT_INPUT = {
  amount: '100',
  maximumAmount: '110',
  token: WETH.address,
}

const DEFAULT_OUTPUT = {
  amount: '200',
  minimumAmount: '190',
  token: USDC_MAINNET.address,
  recipient: SWAPPER,
}
const USDC_VAULT = new Token(
  UniverseChainId.Mainnet,
  '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0',
  18,
  'gtUSDC',
  'Gauntlet USDC',
)

function createClassicQuote(overrides: Partial<ClassicQuoteResponse['quote']> = {}): ClassicQuoteResponse {
  return {
    requestId: 'request-id',
    routing: TradingApi.Routing.CLASSIC,
    permitData: null,
    quote: {
      chainId: 1,
      input: DEFAULT_INPUT,
      output: DEFAULT_OUTPUT,
      swapper: SWAPPER,
      slippage: 1,
      tradeType: TradingApi.TradeType.EXACT_INPUT,
      quoteId: 'quote-id',
      route: [
        [
          {
            type: 'v3-pool',
            address: '0x111144272dc658575Ba38f43C438447dDED45358',
            tokenIn: { address: WETH.address, chainId: 1, decimals: '18', symbol: 'WETH', sellFeeBps: '250' },
            tokenOut: { address: USDC_MAINNET.address, chainId: 1, decimals: '6', symbol: 'USDC', buyFeeBps: '300' },
          },
        ],
      ],
      priceImpact: 0.06,
      aggregatedOutputs: [
        { amount: '195', minAmount: '190', token: USDC_MAINNET.address, recipient: SWAPPER, bps: 9750 },
        { amount: '5', minAmount: '5', token: USDC_MAINNET.address, recipient: FEE_RECIPIENT, bps: 250 },
      ],
      gasEstimates: [],
      ...overrides,
    },
  }
}

function createBridgeQuote(overrides: Partial<BridgeQuoteResponse['quote']> = {}): BridgeQuoteResponse {
  const legacyFeeFields = {
    portionAmount: '5',
    portionBips: 250,
    portionRecipient: FEE_RECIPIENT,
  }

  return {
    requestId: 'request-id',
    routing: TradingApi.Routing.BRIDGE,
    permitData: null,
    quote: {
      chainId: 1,
      destinationChainId: 1,
      input: DEFAULT_INPUT,
      output: DEFAULT_OUTPUT,
      swapper: SWAPPER,
      tradeType: TradingApi.TradeType.EXACT_INPUT,
      ...legacyFeeFields,
      ...overrides,
    },
  }
}

function createWrapQuote(routing: TradingApi.Routing.WRAP): WrapQuoteResponse
function createWrapQuote(routing: TradingApi.Routing.UNWRAP): UnwrapQuoteResponse
function createWrapQuote(
  routing: TradingApi.Routing.WRAP | TradingApi.Routing.UNWRAP,
): WrapQuoteResponse | UnwrapQuoteResponse {
  return {
    requestId: 'request-id',
    routing,
    permitData: null,
    quote: {
      chainId: 1,
      input: DEFAULT_INPUT,
      output: DEFAULT_OUTPUT,
      swapper: SWAPPER,
      tradeType: TradingApi.TradeType.EXACT_INPUT,
    },
  }
}

function createChainedQuote(overrides: Partial<ChainedQuoteResponse['quote']> = {}): ChainedQuoteResponse {
  return {
    requestId: 'request-id',
    routing: TradingApi.Routing.CHAINED,
    permitData: null,
    quote: {
      swapper: SWAPPER,
      input: DEFAULT_INPUT,
      output: DEFAULT_OUTPUT,
      tokenInChainId: 1,
      tokenOutChainId: 1,
      tradeType: TradingApi.TradeType.EXACT_INPUT,
      quoteId: 'quote-id',
      gasStrategies: [],
      steps: [{ stepType: TradingApi.PlanStepType.WRAP, slippage: 1 }],
      ...overrides,
    },
  }
}

function createEarnChainedActionTrade(
  params: Parameters<typeof createChainedActionTrade>[0] & { earnIntent: TradingApi.EarnIntent },
): ReturnType<typeof createChainedActionTrade> {
  const earnDisplayAmounts = createEarnChainedActionDisplayAmounts({
    quote: params.quote,
    currencyIn: params.currencyIn,
    currencyOut: params.currencyOut,
    earnIntent: params.earnIntent,
  })

  return earnDisplayAmounts ? createChainedActionTrade({ ...params, displayAmountsOverride: earnDisplayAmounts }) : null
}

function createDutchQuote(): DutchQuoteResponse {
  return {
    requestId: 'request-id',
    routing: TradingApi.Routing.DUTCH_V2,
    permitData: null,
    quote: {
      encodedOrder: '0x00',
      orderId: 'order-id',
      orderInfo: {
        chainId: 1,
        reactor: '0x00000011F84B9aa48e5f8aA8B9897600006289Be',
        swapper: SWAPPER,
        nonce: '1',
        deadline: DEADLINE,
        input: { token: WETH.address, startAmount: '100', endAmount: '110' },
        outputs: [{ token: USDC_MAINNET.address, startAmount: '200', endAmount: '190', recipient: SWAPPER }],
      },
      input: DEFAULT_INPUT,
      output: DEFAULT_OUTPUT,
      slippageTolerance: 0.5,
      aggregatedOutputs: [
        { amount: '195', minAmount: '190', token: USDC_MAINNET.address, recipient: SWAPPER, bps: 9750 },
      ],
    },
  }
}

function createDutchV3Quote(): DutchV3QuoteResponse {
  return {
    ...createDutchQuote(),
    routing: TradingApi.Routing.DUTCH_V3,
    quote: {
      ...createDutchQuote().quote,
      orderInfo: {
        ...createDutchQuote().quote.orderInfo,
        input: {
          token: WETH.address,
          startAmount: '100',
          curve: { relativeBlocks: [], relativeAmounts: [] },
          maxAmount: '110',
          adjustmentPerGweiBaseFee: '0',
        },
        outputs: [
          {
            token: USDC_MAINNET.address,
            startAmount: '200',
            curve: { relativeBlocks: [], relativeAmounts: [] },
            minAmount: '190',
            adjustmentPerGweiBaseFee: '0',
            recipient: SWAPPER,
          },
        ],
      },
    },
  } as DutchV3QuoteResponse
}

function createPriorityQuote(): PriorityQuoteResponse {
  return {
    ...createDutchQuote(),
    routing: TradingApi.Routing.PRIORITY,
    quote: {
      ...createDutchQuote().quote,
      orderInfo: {
        chainId: 1,
        reactor: '0x00000011F84B9aa48e5f8aA8B9897600006289Be',
        swapper: SWAPPER,
        nonce: '1',
        deadline: DEADLINE,
        auctionStartBlock: '1',
        baselinePriorityFeeWei: '1',
        input: { token: WETH.address, amount: '100', mpsPerPriorityFeeWei: '0' },
        outputs: [{ token: USDC_MAINNET.address, amount: '190', mpsPerPriorityFeeWei: '0', recipient: SWAPPER }],
        cosigner: '0x4449Cd34d1eb1FEDCF02A1Be3834FfDe8E6A6180',
      },
    },
  } as PriorityQuoteResponse
}

describe('trade factories', () => {
  it('creates classic trades with amounts, taxes, fees, and recipient output amounts', () => {
    const trade = createClassicTrade({
      quote: createClassicQuote(),
      currencyIn: WETH_WITH_SELL_TAX,
      currencyOut: USDC_WITH_BUY_TAX,
      tradeType: TradeType.EXACT_INPUT,
      deadline: DEADLINE,
    })

    expect(trade?.routing).toBe(TradingApi.Routing.CLASSIC)
    expect(trade?.inputAmount.quotient.toString()).toBe('100')
    expect(trade?.outputAmount.quotient.toString()).toBe('200')
    expect(trade?.maxAmountIn.quotient.toString()).toBe('110')
    expect(trade?.minAmountOut.quotient.toString()).toBe('190')
    expect(trade?.swapFee?.amount).toBe('5')
    // Taxes come from the input/output currencies, not the quote route (which carries 250/300).
    expect(trade?.inputTax.equalTo(new Percent(111, 10000))).toBe(true)
    expect(trade?.outputTax.equalTo(new Percent(222, 10000))).toBe(true)
    expect(trade?.quoteOutputAmount.quotient.toString()).toBe('200')
    expect(trade?.quoteOutputAmountUserWillReceive.quotient.toString()).toBe('190')
  })

  it('creates exact-output classic trades with backend maximum input and minimum output amounts', () => {
    const trade = createClassicTrade({
      quote: createClassicQuote({ tradeType: TradingApi.TradeType.EXACT_OUTPUT }),
      currencyIn: WETH,
      currencyOut: USDC_MAINNET,
      tradeType: TradeType.EXACT_OUTPUT,
      deadline: DEADLINE,
    })

    expect(trade?.tradeType).toBe(TradeType.EXACT_OUTPUT)
    expect(trade?.maxAmountIn.quotient.toString()).toBe('110')
    expect(trade?.minAmountOut.quotient.toString()).toBe('190')
  })

  it('falls back to the exact input/output amounts when backend min/max fields are missing', () => {
    const trade = createClassicTrade({
      quote: createClassicQuote({
        input: { ...DEFAULT_INPUT, maximumAmount: undefined },
        output: { ...DEFAULT_OUTPUT, minimumAmount: undefined },
      }),
      currencyIn: WETH,
      currencyOut: USDC_MAINNET,
      tradeType: TradeType.EXACT_INPUT,
      deadline: DEADLINE,
    })

    expect(trade?.maxAmountIn.quotient.toString()).toBe('100')
    expect(trade?.minAmountOut.quotient.toString()).toBe('200')
  })

  it('returns null when required input/output amounts are missing', () => {
    const trade = createClassicTrade({
      quote: createClassicQuote({ output: { ...DEFAULT_OUTPUT, amount: undefined } }),
      currencyIn: WETH,
      currencyOut: USDC_MAINNET,
      tradeType: TradeType.EXACT_INPUT,
      deadline: DEADLINE,
    })

    expect(trade).toBeNull()
  })

  it('creates UniswapX trades for all order variants', () => {
    const dutchV2Trade = createUniswapXV2Trade({
      quote: createDutchQuote(),
      currencyIn: WETH,
      currencyOut: USDC_MAINNET,
      tradeType: TradeType.EXACT_INPUT,
    })
    const dutchV3Trade = createUniswapXV3Trade({
      quote: createDutchV3Quote(),
      currencyIn: WETH,
      currencyOut: USDC_MAINNET,
      tradeType: TradeType.EXACT_INPUT,
    })
    const priorityTrade = createPriorityOrderTrade({
      quote: createPriorityQuote(),
      currencyIn: WETH,
      currencyOut: USDC_MAINNET,
      tradeType: TradeType.EXACT_INPUT,
    })

    expect(dutchV2Trade?.routing).toBe(TradingApi.Routing.DUTCH_V2)
    expect(dutchV3Trade?.routing).toBe(TradingApi.Routing.DUTCH_V3)
    expect(priorityTrade?.routing).toBe(TradingApi.Routing.PRIORITY)
    expect(dutchV2Trade?.deadline).toBe(DEADLINE)
    expect(dutchV2Trade?.quoteOutputAmountUserWillReceive.quotient.toString()).toBe('190')
  })

  it('creates bridge trades and preserves the pre-fee output amount the user receives', () => {
    const trade = createBridgeTrade({
      quote: createBridgeQuote(),
      currencyIn: WETH,
      currencyOut: USDC_MAINNET,
      tradeType: TradeType.EXACT_INPUT,
    })

    expect(trade?.routing).toBe(TradingApi.Routing.BRIDGE)
    expect(trade?.quoteOutputAmount.quotient.toString()).toBe('200')
    expect(trade?.quoteOutputAmountUserWillReceive.quotient.toString()).toBe('205')
  })

  it('falls back to exact amounts for no-slippage bridge quotes without min/max fields', () => {
    const trade = createBridgeTrade({
      quote: createBridgeQuote({
        input: { ...DEFAULT_INPUT, maximumAmount: undefined },
        output: { ...DEFAULT_OUTPUT, minimumAmount: undefined },
      }),
      currencyIn: WETH,
      currencyOut: USDC_MAINNET,
      tradeType: TradeType.EXACT_INPUT,
    })

    expect(trade?.maxAmountIn.quotient.toString()).toBe('100')
    expect(trade?.minAmountOut.quotient.toString()).toBe('200')
  })

  it('creates wrap and unwrap trades', () => {
    const wrapTrade = createWrapTrade({
      quote: createWrapQuote(TradingApi.Routing.WRAP),
      currencyIn: WETH,
      currencyOut: USDC_MAINNET,
      tradeType: TradeType.EXACT_INPUT,
    })
    const unwrapTrade = createUnwrapTrade({
      quote: createWrapQuote(TradingApi.Routing.UNWRAP),
      currencyIn: USDC_MAINNET,
      currencyOut: WETH,
      tradeType: TradeType.EXACT_INPUT,
    })

    expect(wrapTrade?.routing).toBe(TradingApi.Routing.WRAP)
    expect(unwrapTrade?.routing).toBe(TradingApi.Routing.UNWRAP)
    expect(wrapTrade?.slippageTolerance).toBe(0)
    expect(unwrapTrade?.swapFee).toBeUndefined()
  })

  it('creates chained action trades with compound slippage', () => {
    const trade = createChainedActionTrade({
      quote: createChainedQuote({
        steps: [
          { stepType: TradingApi.PlanStepType.WRAP, slippage: 1 },
          { stepType: TradingApi.PlanStepType.CLASSIC, slippage: 2 },
        ],
      }),
      currencyIn: WETH,
      currencyOut: USDC_MAINNET,
    })

    expect(trade?.routing).toBe(TradingApi.Routing.CHAINED)
    expect(trade?.tradeType).toBe(TradeType.EXACT_INPUT)
    expect(trade?.slippageTolerance).toBe(2.98)
    expect(trade?.minAmountOut.quotient.toString()).toBe('190')
  })

  it('returns null instead of throwing when a chained quote is malformed', () => {
    const malformedQuote = createChainedQuote({
      input: undefined as unknown as ChainedQuoteResponse['quote']['input'],
    })

    expect(
      createChainedActionTrade({
        quote: malformedQuote,
        currencyIn: WETH,
        currencyOut: USDC_MAINNET,
      }),
    ).toBeNull()
  })

  it('uses earnPreview deposit asset amount for Earn quote display', () => {
    const earnIntent: TradingApi.EarnIntent = {
      action: TradingApi.EarnAction.DEPOSIT,
      vault: '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0',
      chainId: UniverseChainId.Mainnet as unknown as TradingApi.ChainId,
    }
    const depositAssetAmount = '2000000'
    const vaultShareAmount = '2800994864966439066'

    const trade = createEarnChainedActionTrade({
      quote: createChainedQuote({
        input: { amount: '1000000', token: USDC_UNICHAIN.address },
        output: { amount: vaultShareAmount, token: earnIntent.vault, recipient: SWAPPER },
        tokenInChainId: UniverseChainId.Unichain as unknown as TradingApi.ChainId,
        tokenOutChainId: UniverseChainId.Mainnet as unknown as TradingApi.ChainId,
        earnPreview: {
          type: TradingApi.EarnDepositPreview.type.DEPOSIT,
          depositAssets: [
            {
              token: USDC.address,
              chainId: UniverseChainId.Mainnet as unknown as TradingApi.ChainId,
              amount: depositAssetAmount,
            },
          ],
          estimatedSharesOut: vaultShareAmount,
        },
      }),
      currencyIn: USDC_UNICHAIN,
      currencyOut: USDC_UNICHAIN,
      earnIntent,
    })

    expect(trade?.outputAmount.quotient.toString()).toBe(depositAssetAmount)
    expect(trade?.outputAmount.currency.equals(USDC)).toBe(true)
    expect(trade?.earnIntent).toBe(earnIntent)
  })

  it('uses known preview asset decimals when Earn deposit output currency differs', () => {
    const earnIntent: TradingApi.EarnIntent = {
      action: TradingApi.EarnAction.DEPOSIT,
      vault: '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0',
      chainId: UniverseChainId.Mainnet as unknown as TradingApi.ChainId,
    }
    const sourceOutputCurrency = new Token(
      UniverseChainId.Unichain,
      '0x111144272dc658575ba38f43c438447dded45358',
      18,
      'SRC',
      'Source Token',
    )
    const depositAssetAmount = '2000000'
    const vaultShareAmount = '2800994864966439066'

    const trade = createEarnChainedActionTrade({
      quote: createChainedQuote({
        input: { amount: '1000000000000000000', token: USDC_UNICHAIN.address },
        output: { amount: vaultShareAmount, token: earnIntent.vault, recipient: SWAPPER },
        tokenInChainId: UniverseChainId.Unichain as unknown as TradingApi.ChainId,
        tokenOutChainId: UniverseChainId.Mainnet as unknown as TradingApi.ChainId,
        earnPreview: {
          type: TradingApi.EarnDepositPreview.type.DEPOSIT,
          depositAssets: [
            {
              token: USDC.address,
              chainId: UniverseChainId.Mainnet as unknown as TradingApi.ChainId,
              amount: depositAssetAmount,
            },
          ],
          estimatedSharesOut: vaultShareAmount,
        },
      }),
      currencyIn: USDC_UNICHAIN,
      currencyOut: sourceOutputCurrency,
      earnIntent,
    })

    expect(trade?.outputAmount.currency.equals(USDC)).toBe(true)
    expect(trade?.outputAmount.toExact()).toBe('2')
  })

  it('returns null instead of a share-denominated display amount when the Earn deposit preview asset is unresolvable', () => {
    const earnIntent: TradingApi.EarnIntent = {
      action: TradingApi.EarnAction.DEPOSIT,
      vault: '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0',
      chainId: UniverseChainId.Base as unknown as TradingApi.ChainId,
    }
    const vaultShareAmount = '2800994864966439066'

    // Future vault on a non-mainnet chain: the deposit asset is not in the launch allowlist and does
    // not match currencyOut, so there is no currency with known decimals to display the preview in.
    // The old fallback paired the vault-share raw amount with currencyOut's decimals (inflating the
    // displayed amount by 10^Δdecimals); now the trade fails to build → quote unavailable.
    const trade = createEarnChainedActionTrade({
      quote: createChainedQuote({
        input: { amount: '1000000', token: USDC_UNICHAIN.address },
        output: { amount: vaultShareAmount, token: earnIntent.vault, recipient: SWAPPER },
        tokenInChainId: UniverseChainId.Unichain as unknown as TradingApi.ChainId,
        tokenOutChainId: UniverseChainId.Base as unknown as TradingApi.ChainId,
        earnPreview: {
          type: TradingApi.EarnDepositPreview.type.DEPOSIT,
          depositAssets: [
            {
              token: '0x999944272dc658575ba38f43c438447dded45999',
              chainId: UniverseChainId.Base as unknown as TradingApi.ChainId,
              amount: '2000000',
            },
          ],
          estimatedSharesOut: vaultShareAmount,
        },
      }),
      currencyIn: USDC_UNICHAIN,
      currencyOut: USDC_UNICHAIN,
      earnIntent,
    })

    expect(trade).toBeNull()
  })

  it('returns null for an Earn deposit quote that is missing its preview entirely', () => {
    const earnIntent: TradingApi.EarnIntent = {
      action: TradingApi.EarnAction.DEPOSIT,
      vault: '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0',
      chainId: UniverseChainId.Mainnet as unknown as TradingApi.ChainId,
    }
    const vaultShareAmount = '2800994864966439066'

    const trade = createEarnChainedActionTrade({
      quote: createChainedQuote({
        input: { amount: '1000000', token: USDC_UNICHAIN.address },
        output: { amount: vaultShareAmount, token: earnIntent.vault, recipient: SWAPPER },
        tokenInChainId: UniverseChainId.Unichain as unknown as TradingApi.ChainId,
        tokenOutChainId: UniverseChainId.Mainnet as unknown as TradingApi.ChainId,
      }),
      currencyIn: USDC_UNICHAIN,
      currencyOut: USDC_UNICHAIN,
      earnIntent,
    })

    expect(trade).toBeNull()
  })

  it('uses exact-assets withdraw preview amount for Earn quote display', () => {
    const earnIntent: TradingApi.EarnIntent = {
      action: TradingApi.EarnAction.WITHDRAW,
      vault: '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0',
      chainId: UniverseChainId.Mainnet as unknown as TradingApi.ChainId,
      withdrawMode: TradingApi.EarnWithdrawMode.EXACT_ASSETS,
    }
    const requestedAssetsOut = '2000000'
    const estimatedSharesIn = '2800994864966439066'

    const trade = createEarnChainedActionTrade({
      quote: createChainedQuote({
        input: { amount: requestedAssetsOut, token: earnIntent.vault },
        output: { amount: estimatedSharesIn, token: USDC.address, recipient: SWAPPER },
        earnPreview: {
          type: TradingApi.EarnExactAssetsWithdrawPreview.type.EXACT_ASSETS_WITHDRAW,
          requestedAssetsOut,
          estimatedSharesIn,
        },
      }),
      currencyIn: USDC_VAULT,
      currencyOut: USDC,
      earnIntent,
    })

    expect(trade?.inputAmount.quotient.toString()).toBe(estimatedSharesIn)
    expect(trade?.inputAmount.currency.equals(USDC_VAULT)).toBe(true)
    expect(trade?.outputAmount.quotient.toString()).toBe(requestedAssetsOut)
    expect(trade?.outputAmount.currency.equals(USDC)).toBe(true)
    expect(trade?.maxAmountIn.quotient.toString()).toBe('2829004813616103456')
    expect(trade?.minAmountOut.quotient.toString()).toBe(requestedAssetsOut)
  })

  it('uses max-shares withdraw preview amount for Earn quote display', () => {
    const earnIntent: TradingApi.EarnIntent = {
      action: TradingApi.EarnAction.WITHDRAW,
      vault: '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0',
      chainId: UniverseChainId.Mainnet as unknown as TradingApi.ChainId,
      withdrawMode: TradingApi.EarnWithdrawMode.MAX_SHARES,
    }
    const maxRedeemableSharesIn = '2800994864966439066'
    const previewAssetsOut = '2000000'

    const trade = createEarnChainedActionTrade({
      quote: createChainedQuote({
        input: { amount: maxRedeemableSharesIn, token: earnIntent.vault },
        output: { amount: maxRedeemableSharesIn, token: USDC.address, recipient: SWAPPER },
        earnPreview: {
          type: TradingApi.EarnMaxSharesWithdrawPreview.type.MAX_SHARES_WITHDRAW,
          maxRedeemableSharesIn,
          previewAssetsOut,
        },
      }),
      currencyIn: USDC_VAULT,
      currencyOut: USDC,
      earnIntent,
    })

    expect(trade?.inputAmount.quotient.toString()).toBe(maxRedeemableSharesIn)
    expect(trade?.inputAmount.currency.equals(USDC_VAULT)).toBe(true)
    expect(trade?.outputAmount.quotient.toString()).toBe(previewAssetsOut)
    expect(trade?.outputAmount.currency.equals(USDC)).toBe(true)
    expect(trade?.maxAmountIn.quotient.toString()).toBe(maxRedeemableSharesIn)
    expect(trade?.minAmountOut.quotient.toString()).toBe('1980000')
  })

  it('creates indicative trades from validated quote responses', () => {
    const quote = validateIndicativeQuoteResponse(createClassicQuote())

    expect(quote).toBeDefined()

    const trade = quote
      ? createIndicativeTrade({
          quote,
          currencyIn: WETH,
          currencyOut: USDC_MAINNET,
          slippageTolerance: 1,
          tradeType: TradeType.EXACT_INPUT,
        })
      : null

    expect(trade?.indicative).toBe(true)
    expect(trade?.maxAmountIn.quotient.toString()).toBe('110')
    expect(trade?.minAmountOut.quotient.toString()).toBe('190')
    expect(trade?.quoteOutputAmountUserWillReceive.quotient.toString()).toBe('200')
  })
})
