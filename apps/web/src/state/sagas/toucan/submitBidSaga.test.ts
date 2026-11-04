import { fetchGasFeeQuery } from 'uniswap/src/data/apiClients/gasService/useGasFeeQuery'
import { type TransactionStep, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import {
  type ToucanBidTransactionInfo,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import type { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import type { SignerMnemonicAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { describe, expect, it, vi } from 'vitest'
import { submitToucanBid } from '~/state/sagas/toucan/submitBidSaga'
import type { SubmitToucanBidParams } from '~/state/sagas/toucan/types'
import { handleAtomicSendCalls } from '~/state/sagas/transactions/5792'
import {
  handleApprovalTransactionStep,
  handleOnChainStep,
  handlePermitTransactionStep,
  handleSignatureStep,
} from '~/state/sagas/transactions/utils'
import { popupRegistry } from '~/utils/popups/registry'

// Mock the popup registry and step handlers so importing the saga doesn't pull in the store graph.
// `call` only references these, so driving the generator with fed values never invokes them.
vi.mock('~/utils/popups/registry', () => ({ popupRegistry: { addPopup: vi.fn() } }))
vi.mock('~/state/sagas/transactions/utils', () => ({
  handleApprovalTransactionStep: vi.fn(),
  handleOnChainStep: vi.fn(),
  handlePermitTransactionStep: vi.fn(),
  handleSignatureStep: vi.fn(),
}))
vi.mock('~/state/sagas/transactions/5792', () => ({ handleAtomicSendCalls: vi.fn() }))
vi.mock('uniswap/src/features/telemetry/send', () => ({ sendAnalyticsEvent: vi.fn() }))
const { mockLogger } = vi.hoisted(() => ({ mockLogger: { debug: vi.fn(), warn: vi.fn(), error: vi.fn() } }))
vi.mock('utilities/src/logger/logger', () => ({ logger: mockLogger }))
vi.mock('uniswap/src/data/apiClients/gasService/useGasFeeQuery', () => ({ fetchGasFeeQuery: vi.fn() }))

const WALLET = '0xF570F45f598fD48AF83FABD692629a2caFe899ec'
const account = { address: WALLET } as unknown as SignerMnemonicAccountDetails

const info = {
  type: TransactionType.ToucanBid,
  amountRaw: '1000',
  maxPriceQ96: '79228162514264337593543950336',
  auctionContractAddress: '0x1111111111111111111111111111111111111111',
  bidTokenAddress: '0x0000000000000000000000000000000000000000',
  requestId: 'request-1',
} as ToucanBidTransactionInfo

// Literal, deliberately not derived from the saga: the bid as SubmitBid serves it, with no gas fields.
function bidTx(): ValidatedTransactionRequest {
  return {
    chainId: 8453,
    to: '0x1111111111111111111111111111111111111111',
    from: WALLET,
    data: '0xabcdef',
    value: '0x3e8',
  } as unknown as ValidatedTransactionRequest
}

const APPROVE_TX = { chainId: 8453, to: '0x3333333333333333333333333333333333333333', data: '0x095ea7b3' }
const PERMIT_TX = { chainId: 8453, to: '0x2222222222222222222222222222222222222222', data: '0x' }

function approvalStep(): TransactionStep {
  return { type: TransactionStepType.TokenApprovalTransaction, txRequest: APPROVE_TX } as unknown as TransactionStep
}

function permitStep(): TransactionStep {
  return { type: TransactionStepType.Permit2Transaction, txRequest: PERMIT_TX } as unknown as TransactionStep
}

function signatureStep(): TransactionStep {
  return { type: TransactionStepType.Permit2Signature, typedData: {} } as unknown as TransactionStep
}

type CallEffect = { payload: { fn: (...args: never[]) => unknown; args: unknown[] } }

function asCallEffect(value: unknown): CallEffect {
  return value as CallEffect
}

function makeParams(overrides: Partial<SubmitToucanBidParams> = {}): SubmitToucanBidParams {
  return {
    account,
    chainId: 8453,
    txRequest: bidTx(),
    info,
    setCurrentStep: vi.fn(),
    setSteps: vi.fn(),
    selectChain: vi.fn(),
    onSuccess: vi.fn(),
    onFailure: vi.fn(),
    ...overrides,
  }
}

function startSaga(params: SubmitToucanBidParams): Generator<unknown, void, unknown> {
  return submitToucanBid(params) as Generator<unknown, void, unknown>
}

describe('submitToucanBid', () => {
  it('re-estimates the bid gas limit before sending and sends it on the step handed to setSteps', () => {
    const params = makeParams()
    const gen = startSaga(params)
    gen.next() // call(selectChain)

    const gasEffect = asCallEffect(gen.next(true).value)
    expect(gasEffect.payload.args[0]).toEqual(bidTx())

    const sendEffect = asCallEffect(gen.next({ ...bidTx(), gasLimit: '345000' }).value)
    expect(sendEffect.payload.fn).toBe(handleOnChainStep)
    const sent = sendEffect.payload.args[0] as { step: TransactionStep & { txRequest: ValidatedTransactionRequest } }
    expect(sent.step.txRequest.gasLimit).toBe('345000')
    // The progress indicator looks the current step up by identity in the list it was given.
    const handedSteps = vi.mocked(params.setSteps!).mock.calls[0]?.[0]
    expect(handedSteps[0]).toBe(sent.step)

    gen.next('0xhash')
    expect(params.onSuccess).toHaveBeenCalledWith('0xhash')
    expect(params.onFailure).not.toHaveBeenCalled()
  })

  it('re-estimates only after the pre-bid permit step and the post-permit simulation', () => {
    const onPreBidStepsComplete = vi.fn()
    const params = makeParams({ preBidSteps: [permitStep()], onPreBidStepsComplete })
    const gen = startSaga(params)
    gen.next() // call(selectChain)

    expect(asCallEffect(gen.next(true).value).payload.fn).toBe(handlePermitTransactionStep)
    expect(asCallEffect(gen.next().value).payload.fn).toBe(onPreBidStepsComplete)

    const gasEffect = asCallEffect(gen.next(true).value)
    expect(gasEffect.payload.args[0]).toEqual(bidTx())

    const sendEffect = asCallEffect(gen.next({ ...bidTx(), gasLimit: '345000' }).value)
    expect(sendEffect.payload.fn).toBe(handleOnChainStep)
    expect(
      (sendEffect.payload.args[0] as { step: { txRequest: ValidatedTransactionRequest } }).step.txRequest.gasLimit,
    ).toBe('345000')
  })

  it('does not estimate gas when the post-permit simulation rejects the bid', () => {
    const onPreBidStepsComplete = vi.fn()
    const params = makeParams({ preBidSteps: [permitStep()], onPreBidStepsComplete })
    const gen = startSaga(params)
    gen.next()
    gen.next(true) // -> permit step
    gen.next() // -> onPreBidStepsComplete

    expect(gen.next(false).done).toBe(true)
    expect(params.onFailure).toHaveBeenCalledWith(new Error('Bid simulation failed after permit steps'))
  })

  it('sends the approvals and the bid as one atomic batch when the wallet can batch them', () => {
    vi.mocked(popupRegistry.addPopup).mockClear()
    const disableOneClickSwap = vi.fn()
    const params = makeParams({
      preBidSteps: [approvalStep(), permitStep()],
      canBatchTransactions: true,
      disableOneClickSwap,
    })
    const gen = startSaga(params)
    gen.next() // call(selectChain)

    const batchEffect = asCallEffect(gen.next(true).value)
    expect(batchEffect.payload.fn).toBe(handleAtomicSendCalls)
    const sent = batchEffect.payload.args[0] as {
      step: { walletCallTxRequests: ValidatedTransactionRequest[] }
      disableOneClickSwap?: () => void
    }
    expect(sent.step.walletCallTxRequests).toEqual([APPROVE_TX, PERMIT_TX, bidTx()])
    expect(sent.disableOneClickSwap).toBe(disableOneClickSwap)

    expect(gen.next('0xbatch').done).toBe(true)
    expect(params.onSuccess).toHaveBeenCalledWith('0xbatch')
    expect(params.onFailure).not.toHaveBeenCalled()
    // handleAtomicSendCalls adds the batch's own popup.
    expect(popupRegistry.addPopup).not.toHaveBeenCalled()
  })

  it('keeps the post-permit price check, prompting for each step, when the caller asks for one with batching', () => {
    const onPreBidStepsComplete = vi.fn()
    const gen = startSaga(
      makeParams({ preBidSteps: [approvalStep(), permitStep()], canBatchTransactions: true, onPreBidStepsComplete }),
    )
    gen.next() // call(selectChain)

    expect(asCallEffect(gen.next(true).value).payload.fn).toBe(handleApprovalTransactionStep)
    expect(asCallEffect(gen.next().value).payload.fn).toBe(handlePermitTransactionStep)
    expect(asCallEffect(gen.next().value).payload.fn).toBe(onPreBidStepsComplete)
  })

  it('sends the bid alone, with its re-estimated gas limit, when the wallet can batch but nothing needs approving', () => {
    const gen = startSaga(makeParams({ canBatchTransactions: true }))
    gen.next() // call(selectChain)

    expect(asCallEffect(gen.next(true).value).payload.args[0]).toEqual(bidTx())
    expect(asCallEffect(gen.next({ ...bidTx(), gasLimit: '345000' }).value).payload.fn).toBe(handleOnChainStep)
  })

  it('prompts for each step in turn when a pre-bid step is a signature, which cannot join a batch', () => {
    const gen = startSaga(makeParams({ preBidSteps: [signatureStep()], canBatchTransactions: true }))
    gen.next() // call(selectChain)

    expect(asCallEffect(gen.next(true).value).payload.fn).toBe(handleSignatureStep)
  })

  it('prompts for each step in turn when the wallet cannot batch', () => {
    const gen = startSaga(makeParams({ preBidSteps: [approvalStep(), permitStep()] }))
    gen.next() // call(selectChain)

    expect(asCallEffect(gen.next(true).value).payload.fn).toBe(handleApprovalTransactionStep)
    expect(asCallEffect(gen.next().value).payload.fn).toBe(handlePermitTransactionStep)
  })

  it('gas population takes only the gas limit, and leaves the tx for the wallet when there is no estimate', async () => {
    const gen = startSaga(makeParams())
    gen.next()
    const populate = asCallEffect(gen.next(true).value).payload.fn as (
      tx: ValidatedTransactionRequest,
    ) => Promise<ValidatedTransactionRequest>

    vi.mocked(fetchGasFeeQuery).mockResolvedValueOnce({
      value: '1',
      displayValue: '1',
      params: { gasLimit: '345000', maxFeePerGas: '2000000000', maxPriorityFeePerGas: '1000000000' },
    })
    await expect(populate(bidTx())).resolves.toEqual({ ...bidTx(), gasLimit: '345000' })
    expect(vi.mocked(fetchGasFeeQuery).mock.calls[0]?.[0].tx).toEqual(bidTx())

    // No params: the gas service failed over to a client-side display-only estimate.
    vi.mocked(fetchGasFeeQuery).mockResolvedValueOnce({ value: '1', displayValue: '1' })
    await expect(populate(bidTx())).resolves.toEqual(bidTx())
    expect(mockLogger.warn).toHaveBeenCalledTimes(1)

    const gasServiceError = new Error('gas service down')
    vi.mocked(fetchGasFeeQuery).mockRejectedValueOnce(gasServiceError)
    await expect(populate(bidTx())).resolves.toEqual(bidTx())
    expect(mockLogger.warn).toHaveBeenLastCalledWith('submitBidSaga', 'populateBidGasLimit', expect.any(String), {
      errorMessage: 'gas service down',
    })
  })

  it('gas population gives up on a hung estimate after 5s and leaves the tx for the wallet', async () => {
    const gen = startSaga(makeParams())
    gen.next()
    const populate = asCallEffect(gen.next(true).value).payload.fn as (
      tx: ValidatedTransactionRequest,
    ) => Promise<ValidatedTransactionRequest>

    vi.useFakeTimers()
    try {
      vi.mocked(fetchGasFeeQuery).mockReturnValueOnce(new Promise(() => {}))
      const result = populate(bidTx())
      await vi.advanceTimersByTimeAsync(4_999)
      let settled = false
      void result.then(() => {
        settled = true
      })
      await Promise.resolve()
      expect(settled).toBe(false)
      await vi.advanceTimersByTimeAsync(1)
      await expect(result).resolves.toEqual(bidTx())
    } finally {
      vi.useRealTimers()
    }
  })
})
