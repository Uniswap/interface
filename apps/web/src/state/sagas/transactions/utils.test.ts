import { datadogRum } from '@datadog/browser-rum'
import { TradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { runSaga } from 'redux-saga'
import { USDC, WBTC } from 'uniswap/src/constants/tokens'
import { TransactionStepFailedError } from 'uniswap/src/features/transactions/errors'
import { addTransaction } from 'uniswap/src/features/transactions/slice'
import type { HandleOnChainStepParams, OnChainTransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { createBridgeTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'

const mockSendTransaction = vi.fn()
const mockSendUncheckedTransaction = vi.fn()
const mockGetTransaction = vi.fn()

vi.mock('wagmi/actions', () => ({
  getConnectorClient: vi.fn().mockResolvedValue({}),
  getTransaction: (...args: unknown[]) => mockGetTransaction(...args),
}))

vi.mock('~/connection/wagmiConfig', () => ({
  wagmiConfig: {},
}))

vi.mock('~/connection/hooks/useEthersProvider', () => ({
  clientToProvider: vi.fn().mockReturnValue({
    getSigner: vi.fn().mockResolvedValue({
      sendTransaction: (...args: unknown[]) => mockSendTransaction(...args),
      sendUncheckedTransaction: (...args: unknown[]) => mockSendUncheckedTransaction(...args),
    }),
  }),
}))

vi.mock('~/utils/signing', () => ({
  signTypedData: vi.fn(),
}))

vi.mock('~/utils/popups/registry', () => ({
  popupRegistry: { addPopup: vi.fn() },
}))

vi.mock('~/utils/popups/types', () => ({
  PopupType: { Plan: 'Plan' },
}))

vi.mock('@datadog/browser-rum', () => ({
  datadogRum: { addAction: vi.fn() },
}))

vi.mock('~/state/activity/utils', () => ({
  getRoutingForTransaction: vi.fn().mockReturnValue('CLASSIC'),
}))

vi.mock('@universe/gating', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/gating')>()
  return {
    ...actual,
    getDynamicConfigValue: vi.fn().mockReturnValue([]),
  }
})

describe('handleOnChainStep', () => {
  const hash = '0xabc123' as `0x${string}`
  const address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as `0x${string}`
  const chainId = UniverseChainId.Mainnet

  const step = {
    type: TransactionStepType.SwapTransaction,
    txRequest: {
      to: '0x0000000000000000000000000000000000000001' as `0x${string}`,
      data: '0xoriginal',
      value: '0x0',
      chainId,
    },
  } as OnChainTransactionStep

  const info = {
    type: TransactionType.Approve as const,
    tokenAddress: '0xtoken',
    spender: '0xspender',
    approvalAmount: '1000',
  }

  let handleOnChainStep: typeof import('./utils').handleOnChainStep

  beforeAll(async () => {
    const utils = await import('./utils')
    handleOnChainStep = utils.handleOnChainStep
  })

  function createParams(overrides: Partial<HandleOnChainStepParams> = {}): HandleOnChainStepParams {
    return {
      address,
      step,
      info,
      setCurrentStep: vi.fn(),
      shouldWaitForConfirmation: false,
      ignoreInterrupt: true,
      ...overrides,
    }
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    // Force sync submission path by including chainId in blocked list
    const gating = await import('@universe/gating')
    vi.mocked(gating.getDynamicConfigValue).mockReturnValue([chainId])

    mockSendUncheckedTransaction.mockResolvedValue(hash)
    // Return modified data to trigger onModification path
    mockGetTransaction.mockResolvedValue({ hash, input: '0xmodified', nonce: 1 })
  })

  it('does not dispatch addTransaction or call onModification when planId is set', async () => {
    const onModification = vi.fn()
    const params = createParams({
      planId: 'plan-123',
      onModification,
    })

    const dispatched: unknown[] = []
    await runSaga(
      {
        dispatch: (action: unknown) => dispatched.push(action),
        getState: () => ({ transactions: {} }),
      },
      handleOnChainStep,
      params,
    ).toPromise()

    const addTxActions = dispatched.filter((a: unknown) => (a as { type: string }).type === addTransaction.type)
    expect(addTxActions).toHaveLength(0)
    expect(onModification).not.toHaveBeenCalled()
  })

  it('dispatches addTransaction and calls onModification when planId is not set', async () => {
    const onModification = vi.fn()
    const params = createParams({ onModification })

    const dispatched: unknown[] = []
    await runSaga(
      {
        dispatch: (action: unknown) => dispatched.push(action),
        getState: () => ({ transactions: {} }),
      },
      handleOnChainStep,
      params,
    ).toPromise()

    const addTxActions = dispatched.filter((a: unknown) => (a as { type: string }).type === addTransaction.type)
    expect(addTxActions).toHaveLength(1)
    expect(onModification).toHaveBeenCalledWith({ hash, data: '0xmodified', nonce: 1 })
  })

  it('aborts the flow when onModification throws on the signer path', async () => {
    const editedError = new Error('approval edited in wallet')
    const onModification = vi.fn(() => {
      throw editedError
    })

    await expect(
      runSaga(
        { dispatch: vi.fn(), getState: () => ({ transactions: {} }), onError: vi.fn() },
        handleOnChainStep,
        createParams({ onModification }),
      ).toPromise(),
    ).rejects.toBe(editedError)
  })

  it('skips the modification check when the submitted tx cannot be found', async () => {
    mockGetTransaction.mockResolvedValue(null)
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const onModification = vi.fn()

    const result = await runSaga(
      { dispatch: vi.fn(), getState: () => ({ transactions: {} }) },
      handleOnChainStep,
      createParams({ onModification }),
    ).toPromise()

    expect(result).toBe(hash)
    expect(onModification).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalled()
  })

  // The signer path's modification check can outlast the tx's confirmation, so the activity updater finalizes it
  // before the step starts waiting for it.
  function waitForTxFinalizedDuringModificationCheck(status: TransactionStatus): Promise<unknown> {
    const state = { transactions: { [address]: { [chainId]: { [hash]: { id: hash, hash, status } } } } }
    return runSaga(
      { dispatch: vi.fn(), getState: () => state, onError: vi.fn() },
      handleOnChainStep,
      createParams({ shouldWaitForConfirmation: true, onModification: vi.fn() }),
    ).toPromise()
  }

  it('returns the hash and records the step complete when the tx confirmed before the step waits for it', async () => {
    await expect(waitForTxFinalizedDuringModificationCheck(TransactionStatus.Success)).resolves.toBe(hash)
    expect(datadogRum.addAction).toHaveBeenCalledWith(
      'Transaction Action',
      expect.objectContaining({ message: `${step.type} complete` }),
    )
  })

  it('fails the step when the tx failed before the step waits for it', async () => {
    await expect(waitForTxFinalizedDuringModificationCheck(TransactionStatus.Failed)).rejects.toBeInstanceOf(
      TransactionStepFailedError,
    )
  })

  describe('when a recent tx has the same info', () => {
    const earlierHash = '0xearlier'

    function runWithEarlierTx(status: TransactionStatus, overrides: Partial<HandleOnChainStepParams> = {}) {
      const earlierTx = { id: earlierHash, hash: earlierHash, from: address, chainId, status, typeInfo: info }
      const state = {
        transactions: { [address]: { [chainId]: { [earlierHash]: { ...earlierTx, addedTime: Date.now() - 5_000 } } } },
      }
      return runSaga(
        { dispatch: vi.fn(), getState: () => state },
        handleOnChainStep,
        createParams(overrides),
      ).toPromise()
    }

    it('resolves to the confirmed tx without prompting the wallet by default', async () => {
      await expect(runWithEarlierTx(TransactionStatus.Success)).resolves.toBe(earlierHash)
      expect(mockSendUncheckedTransaction).not.toHaveBeenCalled()
    })

    it('prompts the wallet for a new tx when finalized duplicates are allowed', async () => {
      await expect(runWithEarlierTx(TransactionStatus.Success, { allowDuplicativeOfFinalizedTx: true })).resolves.toBe(
        hash,
      )
      expect(mockSendUncheckedTransaction).toHaveBeenCalledWith(step.txRequest)
    })

    it('still resolves to a pending tx when finalized duplicates are allowed', async () => {
      await expect(runWithEarlierTx(TransactionStatus.Pending, { allowDuplicativeOfFinalizedTx: true })).resolves.toBe(
        earlierHash,
      )
      expect(mockSendUncheckedTransaction).not.toHaveBeenCalled()
    })
  })

  it('submits without ethers sendTransaction, which reads the block number through the wallet provider', async () => {
    await runSaga(
      { dispatch: vi.fn(), getState: () => ({ transactions: {} }) },
      handleOnChainStep,
      createParams(),
    ).toPromise()

    expect(mockSendUncheckedTransaction).toHaveBeenCalledWith(step.txRequest)
    expect(mockSendTransaction).not.toHaveBeenCalled()
  })
})

describe('getSwapTransactionInfo', () => {
  it.each([
    { provider: TradingApi.BridgeProvider.RELAY, expected: TradingApi.BridgeProvider.RELAY },
    { provider: TradingApi.BridgeProvider.ACROSS, expected: TradingApi.BridgeProvider.ACROSS },
    { provider: undefined, expected: TradingApi.BridgeProvider.ACROSS },
  ])('records the vendor of a bridge quote (provider $provider)', async ({ provider, expected }) => {
    const { getSwapTransactionInfo } = await import('./utils')
    const trade = createBridgeTrade({
      quote: {
        quote: {
          input: { amount: '1000', maximumAmount: '1000' },
          output: { amount: '990', minimumAmount: '990' },
          provider,
        },
        requestId: '123',
        routing: TradingApi.Routing.BRIDGE,
        permitData: null,
      },
      currencyIn: USDC,
      currencyOut: WBTC,
      tradeType: TradeType.EXACT_INPUT,
    })
    if (!trade) {
      throw new Error('Expected test bridge trade to be created')
    }

    expect(getSwapTransactionInfo({ trade })).toMatchObject({
      type: TransactionType.Bridge,
      bridgeProvider: expected,
    })
  })
})
