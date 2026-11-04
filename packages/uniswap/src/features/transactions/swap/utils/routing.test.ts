import { TradingApi } from '@universe/api'
import { USDC, WBTC } from 'uniswap/src/constants/tokens'
import type {
  ClassicSwapTxAndGasInfo,
  UniswapXSwapTxAndGasInfo,
} from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import type { ClassicTrade, UniswapXTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import {
  ACROSS_DAPP_INFO,
  getBridgeDappInfo,
  isGasSponsoredExecution,
  isGasSponsoredTradeExecution,
  isSwapRouting,
  planStepTypeToTradingRoute,
  RELAY_DAPP_INFO,
} from 'uniswap/src/features/transactions/swap/utils/routing'
import { mockPermit } from 'uniswap/src/test/fixtures/permit'
import {
  createMockCurrencyAmount,
  createMockTradeWithStatus,
  createMockUniswapXTrade,
} from 'uniswap/src/test/fixtures/transactions/swap'
import type { RpcUserOperation } from 'viem/account-abstraction'

const mockTxRequest = {
  chainId: 1,
  data: '0x000',
  from: '0x123',
  to: '0x456',
  value: '0x00',
}

const mockPaymasterService: Partial<TradingApi.PaymasterServiceCapability> = {
  url: 'https://unirpc.uniswap.org/paymaster/v1/1',
}

const classicTrade = createMockTradeWithStatus(
  createMockCurrencyAmount(USDC, '1000000000000000000'),
  createMockCurrencyAmount(WBTC, '1000000000000000000'),
).trade as ClassicTrade

const uniswapXTrade = createMockUniswapXTrade(USDC, WBTC)

function createClassicContext({
  sponsorshipInfo,
  paymasterService,
  unsignedUserOperation,
}: {
  sponsorshipInfo?: TradingApi.SponsorshipInfo
  paymasterService?: Partial<TradingApi.PaymasterServiceCapability>
  unsignedUserOperation?: RpcUserOperation<'0.8'>
}): ClassicSwapTxAndGasInfo {
  return {
    routing: TradingApi.Routing.CLASSIC,
    trade: {
      ...classicTrade,
      quote: { ...classicTrade.quote, ...(sponsorshipInfo ? { sponsorshipInfo } : {}) },
    } as ClassicTrade,
    approveTxRequest: undefined,
    revocationTxRequest: undefined,
    gasFee: { error: null, isLoading: false, value: '1000000000000000000' },
    gasFeeEstimation: {},
    permit: undefined,
    swapRequestArgs: undefined,
    hasUnsignedPermit: false,
    txRequests: [mockTxRequest],
    paymasterService,
    unsignedUserOperation,
  }
}

function createUniswapXContext({
  sponsorshipInfo,
  paymasterService,
}: {
  sponsorshipInfo?: TradingApi.SponsorshipInfo
  paymasterService?: Partial<TradingApi.PaymasterServiceCapability>
}): UniswapXSwapTxAndGasInfo {
  return {
    routing: TradingApi.Routing.DUTCH_V2,
    trade: {
      ...uniswapXTrade,
      quote: { ...uniswapXTrade.quote, ...(sponsorshipInfo ? { sponsorshipInfo } : {}) },
    } as UniswapXTrade,
    approveTxRequest: undefined,
    revocationTxRequest: undefined,
    gasFee: { error: null, isLoading: false, value: '1000000000000000000' },
    gasFeeEstimation: {},
    gasFeeBreakdown: {},
    permit: mockPermit,
    paymasterService,
  }
}

describe(isGasSponsoredExecution, () => {
  it('returns undefined when the quote carries no sponsorship info', () => {
    expect(isGasSponsoredExecution(createClassicContext({ paymasterService: mockPaymasterService }))).toBeUndefined()
  })

  it('returns true for a sponsored quote executed through a paymaster', () => {
    const context = createClassicContext({
      sponsorshipInfo: { sponsored: true },
      paymasterService: mockPaymasterService,
    })
    expect(isGasSponsoredExecution(context)).toBe(true)
  })

  it('returns true for a sponsored quote executed as a 4337 userOp', () => {
    const context = createClassicContext({
      sponsorshipInfo: { sponsored: true },
      unsignedUserOperation: {} as RpcUserOperation<'0.8'>,
    })
    expect(isGasSponsoredExecution(context)).toBe(true)
  })

  it('returns false for a sponsored quote executed without a paymaster (plain EOA)', () => {
    expect(isGasSponsoredExecution(createClassicContext({ sponsorshipInfo: { sponsored: true } }))).toBe(false)
  })

  it('returns false when the quote was not sponsored, even with a paymaster', () => {
    const context = createClassicContext({
      sponsorshipInfo: { sponsored: false, rejectionReason: 'not eligible' },
      paymasterService: mockPaymasterService,
    })
    expect(isGasSponsoredExecution(context)).toBe(false)
  })

  it('returns false for UniswapX orders even when the quote is sponsored (filler pays fill gas)', () => {
    const context = createUniswapXContext({
      sponsorshipInfo: { sponsored: true },
      paymasterService: mockPaymasterService,
    })
    expect(isGasSponsoredExecution(context)).toBe(false)
  })
})

describe(isGasSponsoredTradeExecution, () => {
  const sponsoredClassicTrade = {
    ...classicTrade,
    quote: { ...classicTrade.quote, sponsorshipInfo: { sponsored: true } },
  } as ClassicTrade

  it('returns undefined when the quote carries no sponsorship info', () => {
    expect(isGasSponsoredTradeExecution({ trade: classicTrade, executesViaPaymaster: true })).toBeUndefined()
  })

  it('gates the sponsorship offer on actual paymaster execution', () => {
    expect(isGasSponsoredTradeExecution({ trade: sponsoredClassicTrade, executesViaPaymaster: true })).toBe(true)
    expect(isGasSponsoredTradeExecution({ trade: sponsoredClassicTrade, executesViaPaymaster: false })).toBe(false)
  })

  it('returns false for UniswapX orders even when sponsored and flagged as paymaster-executed', () => {
    const trade = {
      ...uniswapXTrade,
      quote: { ...uniswapXTrade.quote, sponsorshipInfo: { sponsored: true } },
    } as UniswapXTrade
    expect(isGasSponsoredTradeExecution({ trade, executesViaPaymaster: true })).toBe(false)
  })
})

describe('isSwapRouting', () => {
  it.each([
    TradingApi.Routing.CLASSIC,
    TradingApi.Routing.DUTCH_V2,
    TradingApi.Routing.DUTCH_V3,
    TradingApi.Routing.DUTCH_LIMIT,
    TradingApi.Routing.PRIORITY,
    TradingApi.Routing.JUPITER,
    TradingApi.Routing.CHAINED,
  ])('should treat %s as a swap', (routing) => {
    expect(isSwapRouting({ routing })).toBe(true)
  })

  it.each([TradingApi.Routing.BRIDGE, TradingApi.Routing.WRAP, TradingApi.Routing.UNWRAP])(
    'should not treat %s as a swap',
    (routing) => {
      expect(isSwapRouting({ routing })).toBe(false)
    },
  )
})

describe(planStepTypeToTradingRoute, () => {
  it.each(Object.values(TradingApi.PlanStepType))('does not throw for PlanStepType.%s', (stepType) => {
    expect(() => planStepTypeToTradingRoute(stepType)).not.toThrow()
  })

  it.each([
    TradingApi.PlanStepType.MARGIN_PRE_SWAP,
    TradingApi.PlanStepType.MARGIN_OPEN,
    TradingApi.PlanStepType.MARGIN_CLOSE,
    TradingApi.PlanStepType.MARGIN_BRIDGE,
    TradingApi.PlanStepType.MARGIN_ADJUST,
  ])('maps %s to Routing.CHAINED, same as VAULT_DEPOSIT/VAULT_WITHDRAW', (stepType) => {
    expect(planStepTypeToTradingRoute(stepType)).toBe(TradingApi.Routing.CHAINED)
  })

  it('throws for an unmapped step type', () => {
    expect(() => planStepTypeToTradingRoute('NOT_A_REAL_STEP_TYPE' as TradingApi.PlanStepType)).toThrow(
      /Unknown step type/,
    )
  })
})

describe(getBridgeDappInfo, () => {
  it.each([
    { provider: TradingApi.BridgeProvider.ACROSS, expected: ACROSS_DAPP_INFO },
    { provider: TradingApi.BridgeProvider.RELAY, expected: RELAY_DAPP_INFO },
    { provider: undefined, expected: ACROSS_DAPP_INFO },
  ])('names $expected.name for provider $provider', ({ provider, expected }) => {
    expect(getBridgeDappInfo(provider)).toBe(expected)
  })
})
