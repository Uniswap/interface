import { SwapDelegationInfo } from 'uniswap/src/features/smartWallet/delegation/types'
import { createEVMSwapInstructionsService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/evmSwapInstructionsService'
import { ApprovalAction } from 'uniswap/src/features/transactions/swap/types/trade'
import { describe, expect, it, vi } from 'vitest'

// Each repository factory returns a tagged fetchSwapData so the routing decision is observable
// without real Trading API calls. The service picks a repository based on ctx + quote; the tag on
// the returned `response` tells us which /swap_* endpoint it routed to.
vi.mock('uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/evmSwapRepository', () => ({
  create5792EVMSwapRepository: vi.fn(() => ({ fetchSwapData: vi.fn().mockResolvedValue({ route: '5792' }) })),
  create4337EVMSwapRepository: vi.fn(() => ({ fetchSwapData: vi.fn().mockResolvedValue({ route: '4337' }) })),
  create7702EVMSwapRepository: vi.fn(() => ({ fetchSwapData: vi.fn().mockResolvedValue({ route: '7702' }) })),
  createLegacyEVMSwapRepository: vi.fn(() => ({ fetchSwapData: vi.fn().mockResolvedValue({ route: 'legacy' }) })),
}))

// Bypass request-param preparation; only the routing decision is under test here.
vi.mock('uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils', () => ({
  createPrepareSwapRequestParams: vi.fn(() => vi.fn(() => ({}))),
}))

type InstructionsCtx = Parameters<typeof createEVMSwapInstructionsService>[0]
type GetSwapInstructionsParams = Parameters<
  ReturnType<typeof createEVMSwapInstructionsService>['getSwapInstructions']
>[0]

const DELEGATED: SwapDelegationInfo = { delegationAddress: '0xabc', delegationInclusion: false }
const UNDELEGATED: SwapDelegationInfo = { delegationAddress: undefined, delegationInclusion: false }

function makeCtx(overrides: Partial<InstructionsCtx>): InstructionsCtx {
  return {
    v4SwapEnabled: false,
    gasStrategy: {} as unknown as InstructionsCtx['gasStrategy'],
    gasOverrides: undefined,
    ...overrides,
  }
}

function makeParams(sponsored: boolean): GetSwapInstructionsParams {
  return {
    swapQuoteResponse: {
      quote: { chainId: 1 },
      sponsorshipInfo: sponsored ? { sponsored: true } : undefined,
    },
    transactionSettings: {},
    approvalAction: ApprovalAction.None,
  } as unknown as GetSwapInstructionsParams
}

async function route(ctx: Partial<InstructionsCtx>, sponsored: boolean): Promise<string | undefined> {
  const result = await createEVMSwapInstructionsService(makeCtx(ctx)).getSwapInstructions(makeParams(sponsored))
  return (result.response as { route?: string } | null)?.route
}

describe('createEVMSwapInstructionsService routing', () => {
  it('routes a delegated web EW sponsored swap to /swap_5792 (supportsUserOpSwaps=false)', async () => {
    expect(await route({ getSwapDelegationInfo: () => DELEGATED, supportsUserOpSwaps: false }, true)).toBe('5792')
  })

  it('routes a delegated wallet EW sponsored swap to /swap_4337 (supportsUserOpSwaps=true)', async () => {
    expect(await route({ getSwapDelegationInfo: () => DELEGATED, supportsUserOpSwaps: true }, true)).toBe('4337')
  })

  it('routes delegated non-sponsored swaps to /swap_7702 regardless of userOp support', async () => {
    expect(await route({ getSwapDelegationInfo: () => DELEGATED, supportsUserOpSwaps: false }, false)).toBe('7702')
    expect(await route({ getSwapDelegationInfo: () => DELEGATED, supportsUserOpSwaps: true }, false)).toBe('7702')
  })

  it('routes non-delegated sponsored swaps to /swap_5792', async () => {
    expect(await route({ getSwapDelegationInfo: () => UNDELEGATED, supportsUserOpSwaps: false }, true)).toBe('5792')
  })

  it('routes non-delegated batchable swaps to /swap_5792', async () => {
    expect(await route({ getSwapDelegationInfo: () => UNDELEGATED, getCanBatchTransactions: () => true }, false)).toBe(
      '5792',
    )
  })

  it('routes non-delegated, non-batchable, non-sponsored swaps to the legacy endpoint', async () => {
    expect(await route({ getSwapDelegationInfo: () => UNDELEGATED }, false)).toBe('legacy')
  })
})
