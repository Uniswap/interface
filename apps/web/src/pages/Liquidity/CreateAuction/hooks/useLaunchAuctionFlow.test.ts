import { act, renderHook } from '@testing-library/react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { AuctionEventName } from 'uniswap/src/features/telemetry/constants'
import type { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import {
  type AuctionLaunchTransactionInfo,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import type { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import type { EVMAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LaunchProgressStep } from '~/pages/Liquidity/CreateAuction/components/LaunchAuctionProgressIndicator'
import type { CreateAuctionSubmitResult } from '~/pages/Liquidity/CreateAuction/hooks/useCreateAuctionSubmit'
import { useLaunchAuctionFlow } from '~/pages/Liquidity/CreateAuction/hooks/useLaunchAuctionFlow'

const WALLET = '0xF570F45f598fD48AF83FABD692629a2caFe899ec'

// The params the saga-dispatch hook is called with, captured so tests can drive the
// setCurrentStep / onSuccess / onFailure callbacks the way the saga would.
type SubmitArgs = {
  setCurrentStep: (step: { step: TransactionStep; accepted: boolean }) => void
  onSuccess: (hash: string) => void
  onFailure: (error: Error) => void
  tokenSymbol?: string
  info: AuctionLaunchTransactionInfo
}
let lastSubmit: SubmitArgs | undefined
const mockSubmitLaunchTransactions = vi.fn((args: SubmitArgs) => {
  lastSubmit = args
})
vi.mock('~/hooks/useAuctionLaunch', () => ({
  useAuctionLaunch: () => mockSubmitLaunchTransactions,
}))

const mockNavigate = vi.fn()
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}))

vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({ t: (key: string) => key }),
}))

const mockIsSigner = vi.fn((..._args: unknown[]) => true)
vi.mock('uniswap/src/features/wallet/types/AccountDetails', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/wallet/types/AccountDetails')>()),
  isSignerMnemonicAccountDetails: (...args: unknown[]) => mockIsSigner(...args),
}))

const mockDidUserReject = vi.fn((..._args: unknown[]) => false)
vi.mock('~/utils/swapErrorToUserReadableMessage', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/utils/swapErrorToUserReadableMessage')>()),
  didUserReject: (...args: unknown[]) => mockDidUserReject(...args),
}))

const mockSendAnalyticsEvent = vi.fn()
vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: (...args: unknown[]) => mockSendAnalyticsEvent(...args),
}))

/** Minimal stand-in for the `Auction Create Failed` props the Review step would build. */
const FAILED_PROPS = { token_source: 'new', chain_id: 1, failed_step: 'launch' } as NonNullable<
  ReturnType<NonNullable<Parameters<typeof useLaunchAuctionFlow>[0]['getCreateFailedProperties']>>
>

vi.mock('~/utils/params/chainParams', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/utils/params/chainParams')>()),
  getChainUrlParam: () => 'ethereum',
}))

// Drives the launch transaction's on-chain status so we can exercise the confirmed vs. pending paths.
const mockUseTransaction = vi.fn<(hash?: string) => { status: TransactionStatus } | undefined>()
vi.mock('~/state/transactions/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/state/transactions/hooks')>()),
  useTransaction: (hash?: string) => mockUseTransaction(hash),
}))

function tx(overrides: Partial<ValidatedTransactionRequest> = {}): ValidatedTransactionRequest {
  return { chainId: 1, to: '0xto', from: WALLET, data: '0x' as const, ...overrides } as ValidatedTransactionRequest
}

function submitResult(transactions: ValidatedTransactionRequest[]): CreateAuctionSubmitResult {
  return {
    transactions,
    predictedTokenAddress: '0xToken',
    predictedAuctionAddress: '0xAuction',
    atomicallyBundleable: false,
    requestId: 'req-1',
  }
}

function setup(
  launchSubmitOverride: Partial<{ onLaunch: () => Promise<CreateAuctionSubmitResult | undefined>; error?: Error }> = {},
  tokenMetadata: Partial<Pick<AuctionLaunchTransactionInfo, 'tokenName' | 'tokenSymbol' | 'tokenLogoUrl'>> = {},
  extra: Partial<Pick<Parameters<typeof useLaunchAuctionFlow>[0], 'getCreateFailedProperties'>> = {},
) {
  const onLaunch = vi.fn<() => Promise<CreateAuctionSubmitResult | undefined>>().mockResolvedValue(undefined)
  const launchSubmit = { onLaunch, ...launchSubmitOverride }
  const utils = renderHook(() =>
    useLaunchAuctionFlow({
      evmAccount: { address: WALLET } as unknown as EVMAccountDetails,
      chainId: UniverseChainId.Mainnet,
      tokenSymbol: 'TKN',
      ...tokenMetadata,
      launchSubmit,
      ...extra,
    }),
  )
  return { ...utils, onLaunch: launchSubmit.onLaunch }
}

beforeEach(() => {
  lastSubmit = undefined
  mockSubmitLaunchTransactions.mockClear()
  mockNavigate.mockClear()
  mockIsSigner.mockReturnValue(true)
  mockDidUserReject.mockReturnValue(false)
  mockSendAnalyticsEvent.mockClear()
  mockUseTransaction.mockReturnValue({ status: TransactionStatus.Success })
})

// Opens the review modal and flushes the prefetch (CreateAuction) that openReviewModal kicks off.
async function openAndPrepare(result: { current: { openReviewModal: () => void } }): Promise<void> {
  await act(async () => {
    result.current.openReviewModal()
  })
}

describe('useLaunchAuctionFlow', () => {
  it('opens and closes the review modal', async () => {
    const { result } = setup({ onLaunch: vi.fn().mockResolvedValue(submitResult([tx()])) })
    expect(result.current.isReviewModalVisible).toBe(false)

    await openAndPrepare(result)
    expect(result.current.isReviewModalVisible).toBe(true)

    act(() => result.current.closeReviewModal())
    expect(result.current.isReviewModalVisible).toBe(false)
  })

  it('prefetches CreateAuction when the review modal opens', async () => {
    const { result, onLaunch } = setup({ onLaunch: vi.fn().mockResolvedValue(submitResult([tx()])) })

    expect(onLaunch).not.toHaveBeenCalled()

    await openAndPrepare(result)

    // The result is ready before the user confirms, so progressSteps reflects the single launch tx.
    expect(onLaunch).toHaveBeenCalledOnce()
    expect(result.current.isPreparing).toBe(false)
    expect(result.current.progressSteps).toEqual([LaunchProgressStep.PendingConfirmation])
  })

  it('reflects isPreparing while CreateAuction is in flight, then clears it', async () => {
    let resolvePrep: (r: CreateAuctionSubmitResult | undefined) => void = () => {}
    const pending = new Promise<CreateAuctionSubmitResult | undefined>((res) => {
      resolvePrep = res
    })
    const { result } = setup({ onLaunch: vi.fn().mockReturnValue(pending) })

    expect(result.current.isPreparing).toBe(false)
    act(() => result.current.openReviewModal())
    expect(result.current.isPreparing).toBe(true)

    await act(async () => {
      resolvePrep(submitResult([tx()]))
      await pending
    })
    expect(result.current.isPreparing).toBe(false)
  })

  it('re-prefetches each time the modal is reopened (picks up config edits)', async () => {
    const { result, onLaunch } = setup({ onLaunch: vi.fn().mockResolvedValue(submitResult([tx()])) })

    await openAndPrepare(result)
    act(() => result.current.closeReviewModal())
    await openAndPrepare(result)

    expect(onLaunch).toHaveBeenCalledTimes(2)
  })

  it('blocks launch and surfaces the error modal when the account cannot sign', async () => {
    mockIsSigner.mockReturnValue(false)
    const { result } = setup()

    await act(async () => {
      await result.current.handleLaunchToken()
    })

    expect(mockSubmitLaunchTransactions).not.toHaveBeenCalled()
    expect(result.current.isErrorModalOpen).toBe(true)
    expect(result.current.isLaunching).toBe(false)
  })

  it('does not dispatch a launch before a prefetched result is available', async () => {
    // No openReviewModal() -> no prefetch -> nothing to submit when launch is invoked.
    const { result } = setup({ onLaunch: vi.fn().mockResolvedValue(submitResult([tx()])) })

    await act(async () => {
      await result.current.handleLaunchToken()
    })

    expect(mockSubmitLaunchTransactions).not.toHaveBeenCalled()
    expect(result.current.isLaunching).toBe(false)
  })

  it('does not dispatch when the prefetch returns no result', async () => {
    const { result, onLaunch } = setup({ onLaunch: vi.fn().mockResolvedValue(undefined) })

    await openAndPrepare(result)
    await act(async () => {
      await result.current.handleLaunchToken()
    })

    // onLaunch ran once on open; the launch reuses the (empty) result rather than calling it again.
    expect(onLaunch).toHaveBeenCalledOnce()
    expect(mockSubmitLaunchTransactions).not.toHaveBeenCalled()
    expect(result.current.isLaunching).toBe(false)
  })

  it('reuses the prefetched result on launch without calling CreateAuction again', async () => {
    const { result, onLaunch } = setup({ onLaunch: vi.fn().mockResolvedValue(submitResult([tx()])) })

    await openAndPrepare(result)
    await act(async () => {
      await result.current.handleLaunchToken()
    })

    expect(onLaunch).toHaveBeenCalledOnce()
    expect(mockSubmitLaunchTransactions).toHaveBeenCalledOnce()
  })

  it('submits launch activity with the captured token metadata', async () => {
    const { result } = setup(
      { onLaunch: vi.fn().mockResolvedValue(submitResult([tx()])) },
      {
        tokenName: 'My New Token',
        tokenSymbol: 'MNT',
        tokenLogoUrl: 'https://gateway.pinata.cloud/ipfs/some-cid',
      },
    )

    await openAndPrepare(result)
    await act(async () => {
      await result.current.handleLaunchToken()
    })

    expect(mockSubmitLaunchTransactions).toHaveBeenCalledOnce()
    expect(lastSubmit?.info).toMatchObject({
      type: TransactionType.AuctionLaunch,
      tokenName: 'My New Token',
      tokenSymbol: 'MNT',
      tokenLogoUrl: 'https://gateway.pinata.cloud/ipfs/some-cid',
    })
  })

  it('keeps the review modal open and resets progress when the user rejects the wallet prompt', async () => {
    mockDidUserReject.mockReturnValue(true)
    const { result } = setup({ onLaunch: vi.fn().mockResolvedValue(submitResult([tx()])) })

    await openAndPrepare(result)
    await act(async () => {
      await result.current.handleLaunchToken()
    })
    expect(mockSubmitLaunchTransactions).toHaveBeenCalledOnce()

    act(() => lastSubmit?.onFailure(new Error('user rejected')))

    // A rejection is not a launch failure: no error modal, review modal stays open, progress cleared.
    expect(result.current.isErrorModalOpen).toBe(false)
    expect(result.current.isReviewModalVisible).toBe(true)
    expect(result.current.isLaunching).toBe(false)
    expect(result.current.currentProgressStepIndex).toBe(-1)
  })

  it('opens the error modal (and hides the review modal) on a non-rejection failure, then retry reopens review', async () => {
    const { result } = setup({ onLaunch: vi.fn().mockResolvedValue(submitResult([tx()])) })

    await openAndPrepare(result)
    await act(async () => {
      await result.current.handleLaunchToken()
    })

    act(() => lastSubmit?.onFailure(new Error('revert')))
    expect(result.current.isErrorModalOpen).toBe(true)
    expect(result.current.isReviewModalVisible).toBe(false)

    // Retry re-prefetches a fresh result and reopens the review modal.
    await act(async () => {
      result.current.handleRetry()
    })
    expect(result.current.isErrorModalOpen).toBe(false)
    expect(result.current.isReviewModalVisible).toBe(true)
  })

  it('fires Auction Create Failed (launch) on a non-rejection failure', async () => {
    const getCreateFailedProperties = vi.fn(() => FAILED_PROPS)
    const { result } = setup(
      { onLaunch: vi.fn().mockResolvedValue(submitResult([tx()])) },
      {},
      {
        getCreateFailedProperties,
      },
    )

    await openAndPrepare(result)
    await act(async () => {
      await result.current.handleLaunchToken()
    })
    act(() => lastSubmit?.onFailure(new Error('revert')))

    expect(getCreateFailedProperties).toHaveBeenCalledWith({ failedStep: 'launch' })
    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(AuctionEventName.AuctionCreateFailed, FAILED_PROPS)
  })

  it('does not fire Auction Create Failed when the user rejects the wallet prompt', async () => {
    mockDidUserReject.mockReturnValue(true)
    const getCreateFailedProperties = vi.fn(() => FAILED_PROPS)
    const { result } = setup(
      { onLaunch: vi.fn().mockResolvedValue(submitResult([tx()])) },
      {},
      {
        getCreateFailedProperties,
      },
    )

    await openAndPrepare(result)
    await act(async () => {
      await result.current.handleLaunchToken()
    })
    act(() => lastSubmit?.onFailure(new Error('user rejected')))

    expect(getCreateFailedProperties).not.toHaveBeenCalled()
    expect(mockSendAnalyticsEvent).not.toHaveBeenCalled()
  })

  it('records success, opens the success modal, and navigates on view or confirmed dismiss', async () => {
    const { result } = setup({ onLaunch: vi.fn().mockResolvedValue(submitResult([tx()])) })

    await openAndPrepare(result)
    await act(async () => {
      await result.current.handleLaunchToken()
    })

    act(() => lastSubmit?.onSuccess('0xlaunch'))

    expect(result.current.launchSuccess).toEqual({ hash: '0xlaunch', auctionAddress: '0xAuction' })
    expect(result.current.isSuccessModalOpen).toBe(true)
    expect(result.current.isReviewModalVisible).toBe(false)

    act(() => result.current.handleViewAuction())
    expect(mockNavigate).toHaveBeenCalledWith('/explore/auctions/ethereum/0xAuction')

    // The launch is already confirmed, so dismissing the modal also goes straight to the auction.
    mockNavigate.mockClear()
    act(() => result.current.handleCloseSuccessModal())
    expect(result.current.isSuccessModalOpen).toBe(false)
    expect(mockNavigate).toHaveBeenCalledWith('/explore/auctions/ethereum/0xAuction')
  })

  it('defers navigation when the launch is still pending on dismiss, then redirects once it confirms', async () => {
    // Atomic-batch wallets resolve onSuccess before the launch confirms.
    mockUseTransaction.mockReturnValue({ status: TransactionStatus.Pending })
    const { result, rerender } = setup({ onLaunch: vi.fn().mockResolvedValue(submitResult([tx()])) })

    await openAndPrepare(result)
    await act(async () => {
      await result.current.handleLaunchToken()
    })
    act(() => lastSubmit?.onSuccess('0xbatch'))

    // Dismissing while pending keeps the user on the review step — no navigation yet.
    act(() => result.current.handleCloseSuccessModal())
    expect(result.current.isSuccessModalOpen).toBe(false)
    expect(mockNavigate).not.toHaveBeenCalled()

    // Once the launch confirms, the watcher redirects to the auction details page.
    mockUseTransaction.mockReturnValue({ status: TransactionStatus.Success })
    rerender()
    expect(mockNavigate).toHaveBeenCalledWith('/explore/auctions/ethereum/0xAuction')
  })

  it('maps the active transaction to the correct progress step by reference (existing-token path)', async () => {
    const approveTx = tx({ to: '0xtoken' })
    const launchTx = tx({ to: '0xlauncher' })
    const { result } = setup({ onLaunch: vi.fn().mockResolvedValue(submitResult([approveTx, launchTx])) })

    // progressSteps is populated by the prefetch on open; the launch dispatch wires up setCurrentStep.
    await openAndPrepare(result)
    await act(async () => {
      await result.current.handleLaunchToken()
    })

    // Two txs -> approval first, launch (multicall) last.
    expect(result.current.progressSteps).toEqual([
      LaunchProgressStep.ApproveToken,
      LaunchProgressStep.PendingConfirmation,
    ])

    act(() =>
      lastSubmit?.setCurrentStep({ step: { txRequest: approveTx } as unknown as TransactionStep, accepted: false }),
    )
    expect(result.current.currentProgressStepIndex).toBe(0)
    expect(result.current.currentStepPending).toBe(false)

    act(() =>
      lastSubmit?.setCurrentStep({ step: { txRequest: launchTx } as unknown as TransactionStep, accepted: true }),
    )
    expect(result.current.currentProgressStepIndex).toBe(1)
    expect(result.current.currentStepPending).toBe(true)
  })

  it('surfaces the submit hook error through the error modal until dismissed', () => {
    const { result } = setup({ error: new Error('build failed'), onLaunch: vi.fn().mockResolvedValue(undefined) })

    expect(result.current.isErrorModalOpen).toBe(true)

    act(() => result.current.handleCloseErrorModal())
    expect(result.current.isErrorModalOpen).toBe(false)
  })
})
