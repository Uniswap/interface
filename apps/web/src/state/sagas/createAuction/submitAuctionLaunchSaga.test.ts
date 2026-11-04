import { fetchGasFeeQuery } from 'uniswap/src/data/apiClients/gasService/useGasFeeQuery'
import {
  type AuctionLaunchTransactionInfo,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import type { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import type { SignerMnemonicAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { describe, expect, it, vi } from 'vitest'
import { submitAuctionLaunch } from '~/state/sagas/createAuction/submitAuctionLaunchSaga'
import type { SubmitAuctionLaunchParams } from '~/state/sagas/createAuction/types'
import { getDisplayableError } from '~/state/sagas/transactions/utils'
import { popupRegistry } from '~/utils/popups/registry'
import { PopupType } from '~/utils/popups/types'

// Mock the `~/state/*` deps so importing the saga doesn't pull in the store graph (root.ts),
// which has an eager import cycle. `call`/`select` only reference these, so driving the
// generator with fed values never invokes them.
vi.mock('~/utils/popups/registry', () => ({ popupRegistry: { addPopup: vi.fn() } }))
vi.mock('~/state/sagas/transactions/5792', () => ({ handleAtomicSendCalls: vi.fn() }))
vi.mock('~/state/sagas/transactions/utils', () => ({
  handleOnChainStep: vi.fn(),
  handleApprovalTransactionStep: vi.fn(),
  getDisplayableError: vi.fn(),
}))
vi.mock('~/state/walletCapabilities/reducer', () => ({ selectIsAtomicBatchingSupportedByChainId: vi.fn() }))
// The gas-population fallbacks warn so a broken gas service is visible in telemetry; mock the
// logger so those warns don't trip the fail-on-console test guard.
const { mockLogger } = vi.hoisted(() => ({ mockLogger: { debug: vi.fn(), warn: vi.fn(), error: vi.fn() } }))
vi.mock('utilities/src/logger/logger', () => ({ logger: mockLogger }))
// The saga fetches gas params via the gas service before each sequential send; mock the query so the
// test never touches gating/statsig, and so the gas-population helper can be exercised directly.
vi.mock('uniswap/src/data/apiClients/gasService/useGasFeeQuery', () => ({ fetchGasFeeQuery: vi.fn() }))

// approve(address,uint256): selector + left-padded spender word + max-uint256 amount word.
const APPROVE_DATA = `0x095ea7b3${'0'.repeat(24)}000000000022d473030f116ddee9f6b43ac78ba3${'f'.repeat(64)}`

function approveTx(): ValidatedTransactionRequest {
  return {
    chainId: 1,
    to: '0x2222222222222222222222222222222222222222',
    from: WALLET,
    data: APPROVE_DATA,
  } as unknown as ValidatedTransactionRequest
}

const WALLET = '0xF570F45f598fD48AF83FABD692629a2caFe899ec'

/** Narrows a manually-driven generator's yielded redux-saga CALL effect so its fn/args can be asserted. */
function asCallEffect(value: unknown): { payload: { fn: (...args: never[]) => unknown; args: unknown[] } } {
  return value as { payload: { fn: (...args: never[]) => unknown; args: unknown[] } }
}

const account = { address: WALLET } as unknown as SignerMnemonicAccountDetails

const info = {
  type: TransactionType.AuctionLaunch,
  requestId: 'request-1',
  predictedAuctionAddress: '0xAuction',
  predictedTokenAddress: '0xToken',
} as AuctionLaunchTransactionInfo

function tx(chainId: number): ValidatedTransactionRequest {
  return {
    chainId,
    to: '0x1111111111111111111111111111111111111111',
    from: WALLET,
    data: '0x',
  } as unknown as ValidatedTransactionRequest
}

function makeParams(overrides: Partial<SubmitAuctionLaunchParams> = {}): SubmitAuctionLaunchParams {
  return {
    account,
    selectChain: vi.fn(),
    transactions: [tx(1)],
    atomicallyBundleable: true,
    info,
    setCurrentStep: vi.fn(),
    onSuccess: vi.fn(),
    onFailure: vi.fn(),
    ...overrides,
  }
}

describe('submitAuctionLaunch', () => {
  it('fails when there are no transactions', () => {
    const params = makeParams({ transactions: [] })
    const result = submitAuctionLaunch(params).next()
    expect(result.done).toBe(true)
    expect(params.onFailure).toHaveBeenCalledWith(expect.objectContaining({ message: 'No transactions to submit' }))
  })

  it('fails when transactions span multiple chains', () => {
    const params = makeParams({ transactions: [tx(1), tx(10)] })
    const result = submitAuctionLaunch(params).next()
    expect(result.done).toBe(true)
    expect(params.onFailure).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Create auction transactions must share the same chain' }),
    )
  })

  it('fails when the chain switch is rejected', () => {
    const params = makeParams()
    const gen = submitAuctionLaunch(params)
    gen.next() // yields call(selectChain)
    const result = gen.next(false) // chain switch rejected
    expect(result.done).toBe(true)
    expect(params.onFailure).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Failed to switch networks for create auction' }),
    )
  })

  it('sends an atomic batch and reports the batch id when the wallet supports it', () => {
    const params = makeParams({ atomicallyBundleable: true })
    const gen = submitAuctionLaunch(params)
    gen.next() // call(selectChain)
    gen.next(true) // chain switched -> select(atomic support)
    gen.next(() => true) // atomic supported -> call(handleAtomicSendCalls)
    const result = gen.next('0xbatchid') // batch id
    expect(result.done).toBe(true)
    expect(params.onSuccess).toHaveBeenCalledWith('0xbatchid')
    expect(params.onFailure).not.toHaveBeenCalled()
  })

  it('sends sequentially and reports the last hash when atomic batching is unavailable', () => {
    vi.mocked(popupRegistry.addPopup).mockClear()
    const params = makeParams({ atomicallyBundleable: true })
    const gen = submitAuctionLaunch(params)
    gen.next() // call(selectChain)
    gen.next(true) // chain switched -> select(atomic support)
    gen.next(() => false) // atomic NOT supported -> for loop -> call(populateGasServiceParams)
    gen.next(tx(1)) // gas params resolved -> call(handleOnChainStep)
    const result = gen.next('0xhash') // first (only) tx hash
    expect(result.done).toBe(true)
    // The sequential path adds the pending activity toast itself (the atomic path does so inside handleAtomicSendCalls).
    expect(popupRegistry.addPopup).toHaveBeenCalledWith({ type: PopupType.Transaction, hash: '0xhash' }, '0xhash')
    expect(params.onSuccess).toHaveBeenCalledWith('0xhash')
    expect(params.onFailure).not.toHaveBeenCalled()
  })

  it('waits for the approval, then submits + toasts only the launch when sending approval + launch sequentially', () => {
    vi.mocked(popupRegistry.addPopup).mockClear()
    const params = makeParams({ transactions: [approveTx(), tx(1)], atomicallyBundleable: true })
    const gen = submitAuctionLaunch(params)
    gen.next() // call(selectChain)
    gen.next(true) // chain switched -> select(atomic support)
    gen.next(() => false) // atomic NOT supported -> loop -> call(populateGasServiceParams) for approval
    gen.next(approveTx()) // gas params resolved -> handleApprovalTransactionStep (approval step)
    gen.next(undefined) // approval confirmed -> advance loop -> call(populateGasServiceParams) for launch
    gen.next(tx(1)) // gas params resolved -> handleOnChainStep (launch step)
    const result = gen.next('0xlaunch') // launch toast + onSuccess
    expect(result.done).toBe(true)
    // Only the launch gets an activity toast; the approval is shown in the review-modal progress indicator.
    expect(popupRegistry.addPopup).toHaveBeenCalledTimes(1)
    expect(popupRegistry.addPopup).toHaveBeenCalledWith({ type: PopupType.Transaction, hash: '0xlaunch' }, '0xlaunch')
    expect(params.onSuccess).toHaveBeenCalledWith('0xlaunch')
    expect(params.onFailure).not.toHaveBeenCalled()
  })

  it('submits the launch step with the gas params merged by the gas service', () => {
    const launchTx = tx(1)
    const params = makeParams({ transactions: [launchTx] })
    const gen = submitAuctionLaunch(params)
    gen.next() // call(selectChain)
    gen.next(true) // chain switched -> select(atomic support)
    const gasEffect = asCallEffect(gen.next(() => false).value) // -> call(populateGasServiceParams, launchTx)
    expect(gasEffect.payload.args[0]).toBe(launchTx)
    const gasParams = { gasLimit: '500000', maxFeePerGas: '2000000000', maxPriorityFeePerGas: '1000000000' }
    const stepEffect = asCallEffect(gen.next({ ...launchTx, ...gasParams }).value) // -> call(handleOnChainStep)
    const stepParams = stepEffect.payload.args[0] as { step: { txRequest: ValidatedTransactionRequest } }
    expect(stepParams.step.txRequest).toEqual({ ...launchTx, ...gasParams })
    gen.next('0xhash')
    expect(params.onSuccess).toHaveBeenCalledWith('0xhash')
  })

  it('gas population merges gas-service params and returns the tx unchanged when the service fails', async () => {
    const launchTx = tx(1)
    const params = makeParams({ transactions: [launchTx] })
    const gen = submitAuctionLaunch(params)
    gen.next()
    gen.next(true)
    // Grab the actual populate function off the yielded call effect so its fallback paths can be exercised.
    const gasEffect = asCallEffect(gen.next(() => false).value)
    const populate = gasEffect.payload.fn as (tx: ValidatedTransactionRequest) => Promise<ValidatedTransactionRequest>

    const gasParams = { gasLimit: '500000', maxFeePerGas: '2000000000', maxPriorityFeePerGas: '1000000000' }
    vi.mocked(fetchGasFeeQuery).mockResolvedValueOnce({ value: '1', displayValue: '1', params: gasParams })
    await expect(populate(launchTx)).resolves.toEqual({ ...launchTx, ...gasParams })

    // No params (e.g. the gas service failed and only a client-side display estimate came back):
    // submit the tx untouched so ethers' own estimation stays the fallback, and warn so the
    // fallback isn't invisible in telemetry.
    vi.mocked(fetchGasFeeQuery).mockResolvedValueOnce({ value: '1', displayValue: '1' })
    await expect(populate(launchTx)).resolves.toBe(launchTx)
    expect(mockLogger.warn).toHaveBeenCalledTimes(1)

    // A thrown error must not become a new launch-failure mode, but it must be logged.
    const gasServiceError = new Error('gas service down')
    vi.mocked(fetchGasFeeQuery).mockRejectedValueOnce(gasServiceError)
    await expect(populate(launchTx)).resolves.toBe(launchTx)
    expect(mockLogger.warn).toHaveBeenCalledTimes(2)
    expect(mockLogger.warn).toHaveBeenLastCalledWith(
      'submitAuctionLaunchSaga',
      'populateGasServiceParams',
      expect.stringContaining('Gas service failed'),
      { error: gasServiceError },
    )
  })

  it('onFailure receives an Error that preserves EIP-1193 code when the wallet throws a plain object', () => {
    vi.mocked(getDisplayableError).mockReturnValue(undefined)
    const params = makeParams({ atomicallyBundleable: true })
    const gen = submitAuctionLaunch(params)
    gen.next()
    gen.next(true)
    gen.next(() => false)
    const result = gen.throw({ code: 4001, message: 'User rejected' })
    expect(result.done).toBe(true)
    expect(vi.mocked(params.onFailure)).toHaveBeenCalledTimes(1)
    const err = vi.mocked(params.onFailure).mock.calls[0][0] as Error & { code: number }
    expect(err).toBeInstanceOf(Error)
    expect(err.code).toBe(4001)
    expect(err.message).toBe('User rejected')
  })
})
