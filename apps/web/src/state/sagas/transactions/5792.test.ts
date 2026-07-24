import { runSaga } from 'redux-saga'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { addTransaction } from 'uniswap/src/features/transactions/slice'
import type { OnChainTransactionStepWalletCall } from 'uniswap/src/features/transactions/steps/types'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import {
  type InterfaceTransactionDetails,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'
import { handleAtomicSendCalls, parseCaip345TransactionHash } from '~/state/sagas/transactions/5792'

const mockProviderSend = vi.fn()

vi.mock('@wagmi/core', () => ({
  getAccount: () => ({ connector: { id: 'test-connector' } }),
}))

vi.mock('~/connection/wagmiConfig', () => ({ wagmiConfig: {} }))
vi.mock('~/state/activity/utils', () => ({ getRoutingForTransaction: () => 'CLASSIC' }))
vi.mock('~/state/popups/registry', () => ({ popupRegistry: { addPopup: vi.fn() } }))
vi.mock('~/state/sagas/transactions/utils', () => ({
  getSigner: () => ({ provider: { send: (...args: unknown[]) => mockProviderSend(...args) } }),
  *watchForInterruption(): Generator<undefined, { throwIfInterrupted: ReturnType<typeof vi.fn> }, unknown> {
    yield undefined
    return { throwIfInterrupted: vi.fn() }
  },
}))

const address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as Address
const batchId = 'batch-id'
const step = {
  type: TransactionStepType.SwapTransactionWalletCall,
  walletCallTxRequests: [
    {
      to: '0x0000000000000000000000000000000000000001',
      data: '0x1234',
      value: '0x0',
      chainId: UniverseChainId.Mainnet,
    },
  ],
} as OnChainTransactionStepWalletCall
const info = { type: TransactionType.Unknown as const }

async function runHandleAtomicSendCalls(planId?: string): Promise<unknown[]> {
  const dispatched: unknown[] = []
  await runSaga(
    {
      dispatch: (action: unknown) => dispatched.push(action),
      getState: () => ({}),
    },
    handleAtomicSendCalls,
    {
      address,
      step,
      info,
      setCurrentStep: vi.fn(),
      ignoreInterrupt: true,
      planId,
    },
  ).toPromise()
  return dispatched
}

describe(handleAtomicSendCalls, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProviderSend.mockResolvedValue({ id: batchId })
  })

  it('stores the plan marker and skips the transaction submission popup', async () => {
    const dispatched = await runHandleAtomicSendCalls('plan-id')
    const addTransactionAction = dispatched.find(
      (action): action is ReturnType<typeof addTransaction> =>
        (action as { type?: string }).type === addTransaction.type,
    )

    expect((addTransactionAction?.payload as InterfaceTransactionDetails | undefined)?.batchInfo).toEqual({
      batchId,
      chainId: UniverseChainId.Mainnet,
      connectorId: 'test-connector',
      planId: 'plan-id',
    })
    expect(popupRegistry.addPopup).not.toHaveBeenCalled()
  })

  it('keeps the transaction submission popup for a normal batch', async () => {
    await runHandleAtomicSendCalls()

    expect(popupRegistry.addPopup).toHaveBeenCalledWith({ type: PopupType.Transaction, hash: batchId }, batchId)
  })
})

const BATCH_ID = '0x8bd8e05699e6d0fd7f7bd0dc253dbeeb0f7b62e0d64f77af8f470f04d61ac742'
const TX_HASH = '0x193acd50c25089f7cb69c383db1c2d4d3b4a53b1f5c9a3f7f00fce54f5e4b18a'

function sendCallsResult(capabilities?: unknown): unknown {
  return { id: BATCH_ID, capabilities }
}

describe('parseCaip345TransactionHash', () => {
  it('returns the first caip345 transaction hash when valid', () => {
    const result = sendCallsResult({ caip345: { caip2: 'eip155:1', transactionHashes: [TX_HASH] } })
    expect(parseCaip345TransactionHash(result)).toBe(TX_HASH)
  })

  it('returns undefined when capabilities are absent', () => {
    expect(parseCaip345TransactionHash(sendCallsResult())).toBeUndefined()
  })

  it('returns undefined when caip345 is absent', () => {
    expect(parseCaip345TransactionHash(sendCallsResult({ other: {} }))).toBeUndefined()
  })

  it('returns undefined when transactionHashes is empty', () => {
    const result = sendCallsResult({ caip345: { caip2: 'eip155:1', transactionHashes: [] } })
    expect(parseCaip345TransactionHash(result)).toBeUndefined()
  })

  it.each([
    ['too short', '0x1234'],
    ['not hex', `0x${'g'.repeat(64)}`],
    ['missing 0x prefix', 'a'.repeat(66)],
    ['too long', `0x${'a'.repeat(65)}`],
  ])('returns undefined for a malformed hash (%s)', (_label, hash) => {
    const result = sendCallsResult({ caip345: { caip2: 'eip155:1', transactionHashes: [hash] } })
    expect(parseCaip345TransactionHash(result)).toBeUndefined()
  })

  it('returns undefined for results that do not match the wallet_sendCalls schema', () => {
    expect(parseCaip345TransactionHash(undefined)).toBeUndefined()
    expect(parseCaip345TransactionHash(null)).toBeUndefined()
    expect(parseCaip345TransactionHash('0xabc')).toBeUndefined()
    expect(
      parseCaip345TransactionHash({ capabilities: { caip345: { caip2: 'eip155:1', transactionHashes: [TX_HASH] } } }),
    ).toBeUndefined()
  })
})
