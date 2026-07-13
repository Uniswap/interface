import { TradingApi } from '@universe/api'
import { USDC, WBTC } from 'uniswap/src/constants/tokens'
import type { ClassicSwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import type { ClassicTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { validateSwapTxContext } from 'uniswap/src/features/transactions/swap/types/validateSwapTxContext'
import { createMockCurrencyAmount, createMockTradeWithStatus } from 'uniswap/src/test/fixtures/transactions/swap'
import type { RpcUserOperation } from 'viem/account-abstraction'

const mockUserOp = {
  sender: '0x1111111111111111111111111111111111111111',
  nonce: '0x0',
  callData: '0x',
  callGasLimit: '0x186a0',
  verificationGasLimit: '0x186a0',
  preVerificationGas: '0x5208',
  maxFeePerGas: '0x59682f00',
  maxPriorityFeePerGas: '0x59682f00',
  signature: '0x',
} as RpcUserOperation<'0.8'>

const validGasFee = {
  value: '1000000000000000000',
  displayValue: '1000000000000000000',
  isLoading: false,
  error: null,
} as const

function createClassicContext(overrides: Partial<ClassicSwapTxAndGasInfo>): ClassicSwapTxAndGasInfo {
  const mockTrade = createMockTradeWithStatus(
    createMockCurrencyAmount(USDC, '1000000000000000000'),
    createMockCurrencyAmount(WBTC, '1000000000000000000'),
  )
  const trade = mockTrade.trade as ClassicTrade

  return {
    routing: TradingApi.Routing.CLASSIC,
    trade,
    gasFee: validGasFee,
    gasFeeEstimation: { swapEstimate: undefined, approvalEstimate: undefined },
    approveTxRequest: undefined,
    revocationTxRequest: undefined,
    permit: undefined,
    hasUnsignedPermit: false,
    includesDelegation: false,
    swapRequestArgs: undefined,
    txRequests: undefined,
    unsignedUserOperation: undefined,
    requestUniswapGasSponsorship: undefined,
    paymasterService: undefined,
    ...overrides,
  } as ClassicSwapTxAndGasInfo
}

function withQuoteSponsored(context: ClassicSwapTxAndGasInfo, sponsored: boolean): ClassicSwapTxAndGasInfo {
  if (!context.trade) {
    throw new Error('Expected a trade on the swap context')
  }
  ;(context.trade.quote as { sponsorshipInfo?: TradingApi.SponsorshipInfo }).sponsorshipInfo = {
    sponsored,
  } as TradingApi.SponsorshipInfo
  return context
}

describe('validateSwapTxContext — sponsorship delivery', () => {
  it('validates a 4337 swap when the quote promised sponsorship AND the swap delivered it', () => {
    const context = withQuoteSponsored(
      createClassicContext({
        unsignedUserOperation: mockUserOp,
        requestUniswapGasSponsorship: true,
      }),
      true,
    )

    expect(validateSwapTxContext(context)).toBeDefined()
  })

  it('validates a normal unsponsored swap when the quote did not promise sponsorship', () => {
    const context = withQuoteSponsored(
      createClassicContext({ txRequests: [{ to: '0x456', chainId: 1, data: '0x', value: '0x0' }] }),
      false,
    )

    expect(validateSwapTxContext(context)).toBeDefined()
  })

  it('blocks a 4337 swap when the quote promised sponsorship but /swap_4337 returned gasSponsored=false', () => {
    const context = withQuoteSponsored(
      createClassicContext({
        unsignedUserOperation: mockUserOp,
        requestUniswapGasSponsorship: false,
      }),
      true,
    )

    expect(validateSwapTxContext(context)).toBeUndefined()
  })

  it('blocks a 5792 swap when the quote promised sponsorship but /swap_5792 returned no paymasterService', () => {
    const context = withQuoteSponsored(
      createClassicContext({
        txRequests: [{ to: '0x456', chainId: 1, data: '0x', value: '0x0' }],
        paymasterService: undefined,
      }),
      true,
    )

    expect(validateSwapTxContext(context)).toBeUndefined()
  })
})
