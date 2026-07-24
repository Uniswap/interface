import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { AuctionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type {
  AuctionCreateAnalyticsProperties,
  AuctionCreateFailedProperties,
  AuctionCreateFailedStep,
} from 'uniswap/src/features/telemetry/types'
import type { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import {
  type AuctionLaunchTransactionInfo,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import type { EVMAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { isSignerMnemonicAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useAuctionLaunch } from '~/hooks/useAuctionLaunch'
import { LaunchProgressStep } from '~/pages/Liquidity/CreateAuction/components/LaunchAuctionProgressIndicator'
import type { CreateAuctionSubmitResult } from '~/pages/Liquidity/CreateAuction/hooks/useCreateAuctionSubmit'
import { useTransactionByHashOrBatchId } from '~/state/transactions/hooks'
import { coerceUnknownToError } from '~/utils/coerceUnknownToError'
import { getChainUrlParam } from '~/utils/params/chainParams'
import { didUserReject } from '~/utils/swapErrorToUserReadableMessage'

interface UseLaunchAuctionFlowParams {
  evmAccount: EVMAccountDetails | undefined
  chainId: UniverseChainId
  /** Launch token symbol, used to label the approval step's activity toast (existing-token path). */
  tokenSymbol?: string
  /** Launch token name, shown in the launch activity toast. */
  tokenName?: string
  /** Launch token logo URL, shown in the launch activity toast (uploaded image for new tokens). */
  tokenLogoUrl?: string
  launchSubmit: {
    onLaunch: () => Promise<CreateAuctionSubmitResult | undefined>
    error?: Error
  }
  /**
   * Builds the `Auction Create Submitted` analytics properties once the CreateAuction endpoint
   * returns the predicted addresses.
   */
  getLaunchAnalyticsProperties?: (addresses: {
    predictedAuctionAddress: string
    predictedTokenAddress: string
  }) => AuctionCreateAnalyticsProperties
  /**
   * Builds `Auction Create Failed` properties for the wallet / launch-transaction failure surface.
   * Called in onFailure after user rejections are filtered out, so cancellations aren't counted.
   */
  getCreateFailedProperties?: (args: {
    failedStep: AuctionCreateFailedStep
    errorCode?: string | number
  }) => AuctionCreateFailedProperties
  /**
   * Config snapshot (Datadog only) attached to the launch-failure log, mirroring the two
   * pre-submission paths in `useCreateAuctionSubmit` so all three failure points group by the
   * same inputs. Launch reverts can be config-driven (e.g. the target pool already exists).
   */
  getFailedDiagnostics?: () => Record<string, unknown>
}

interface LaunchSuccess {
  hash: string
  auctionAddress: string
}

export interface LaunchAuctionFlow {
  isReviewModalVisible: boolean
  openReviewModal: () => void
  closeReviewModal: () => void
  handleLaunchToken: () => Promise<void>
  progressSteps: LaunchProgressStep[]
  currentProgressStepIndex: number
  currentStepPending: boolean
  isLaunching: boolean
  /** True while CreateAuction is prefetching after the review modal opens (drives the launch button spinner). */
  isPreparing: boolean
  isErrorModalOpen: boolean
  /** The error behind the error modal, so it can map known errors to specific copy. */
  launchError?: Error
  handleCloseErrorModal: () => void
  handleRetry: () => void
  launchSuccess?: LaunchSuccess
  /** Real on-chain launch tx hash for explorer links; undefined until known (atomic batches resolve with a batch id). */
  launchTxHash?: string
  isSuccessModalOpen: boolean
  handleCloseSuccessModal: () => void
  handleViewAuction: () => void
}

export function useLaunchAuctionFlow({
  evmAccount,
  chainId,
  tokenSymbol,
  tokenName,
  tokenLogoUrl,
  launchSubmit,
  getLaunchAnalyticsProperties,
  getCreateFailedProperties,
  getFailedDiagnostics,
}: UseLaunchAuctionFlowParams): LaunchAuctionFlow {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const submitLaunchTransactions = useAuctionLaunch()

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [isLaunching, setIsLaunching] = useState(false)
  // CreateAuction is prefetched when the review modal opens so the calldata + transaction count are
  // ready by the time the user confirms; the modal shows a pending spinner while this is true.
  const [isPreparing, setIsPreparing] = useState(false)
  const [preparedResult, setPreparedResult] = useState<CreateAuctionSubmitResult | undefined>(undefined)
  const [currentStep, setCurrentLaunchStep] = useState<{ step: TransactionStep; accepted: boolean } | undefined>(
    undefined,
  )
  const [launchWalletError, setLaunchWalletError] = useState<Error | undefined>(undefined)
  const [isErrorDismissed, setIsErrorDismissed] = useState(false)
  const [launchSuccess, setLaunchSuccess] = useState<LaunchSuccess | undefined>(undefined)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  // Set when the user dismisses the success modal before the launch has confirmed: the watcher
  // below redirects to the auction once the transaction lands, instead of navigating immediately.
  const [awaitingConfirmationRedirect, setAwaitingConfirmationRedirect] = useState(false)

  const launchError = launchWalletError ?? launchSubmit.error
  const isErrorModalOpen = Boolean(launchError) && !isErrorDismissed

  // Non-atomic launches resolve onSuccess only after confirmation, but atomic-batch wallets resolve
  // it while the launch is still pending — so track the real on-chain status before redirecting.
  // Batch-aware lookup: confirmed batch records are rekeyed from batch id to on-chain hash.
  const launchTransaction = useTransactionByHashOrBatchId(launchSuccess?.hash)
  const isLaunchConfirmed = launchTransaction?.status === TransactionStatus.Success

  // Explorer-safe hash: a 5792 batch id is not a tx hash, so for batches only expose the record's
  // hash once it diverges from the batch id (CAIP-345 at submit, or the batch poller on confirmation).
  const launchTxHash = useMemo(() => {
    const hash = launchTransaction?.hash
    if (hash === undefined || hash === launchTransaction?.batchInfo?.batchId) {
      return undefined
    }
    return hash
  }, [launchTransaction])

  const resetProgress = useCallback(() => {
    setIsLaunching(false)
    setCurrentLaunchStep(undefined)
  }, [])

  // Kicks off CreateAuction (an idempotent calldata build — no on-chain side effects) as the review
  // modal opens so the result is ready when the user confirms. Re-runs on every open/retry, picking
  // up any config edits made after a previous open.
  const prepareLaunch = useEvent(async () => {
    setLaunchWalletError(undefined)
    setIsErrorDismissed(false)
    setLaunchSuccess(undefined)
    setIsSuccessModalOpen(false)
    setAwaitingConfirmationRedirect(false)
    setCurrentLaunchStep(undefined)
    setIsLaunching(false)
    setPreparedResult(undefined)

    setIsPreparing(true)
    const result = await launchSubmit.onLaunch()
    setIsPreparing(false)

    // On failure, launchSubmit.error drives the error modal and preparedResult stays undefined, so
    // the launch button remains disabled.
    if (result) {
      setPreparedResult(result)
    }
  })

  const handleLaunchToken = useEvent(async () => {
    if (!evmAccount || !isSignerMnemonicAccountDetails(evmAccount)) {
      setLaunchWalletError(new Error(t('toucan.createAuction.walletRequired')))
      return
    }

    // Reuse the CreateAuction result captured when the modal opened. If it isn't ready (still
    // preparing) or the prefetch failed, there's nothing to submit — the button is disabled in
    // both of those states.
    const result = preparedResult
    if (!result) {
      return
    }

    setIsLaunching(true)

    const analyticsProperties = getLaunchAnalyticsProperties?.({
      predictedAuctionAddress: result.predictedAuctionAddress,
      predictedTokenAddress: result.predictedTokenAddress,
    })
    if (analyticsProperties) {
      sendAnalyticsEvent(AuctionEventName.AuctionCreateSubmitted, analyticsProperties)
    }

    const info: AuctionLaunchTransactionInfo = {
      type: TransactionType.AuctionLaunch,
      requestId: result.requestId,
      predictedAuctionAddress: result.predictedAuctionAddress,
      predictedTokenAddress: result.predictedTokenAddress,
      tokenName,
      tokenSymbol,
      tokenLogoUrl,
      dappInfo: {
        name: 'Uniswap',
        icon: 'https://protocol-icons.s3.amazonaws.com/icons/uniswap-v4.jpg',
      },
      // Persisted on the transaction so the activity updater fires `Auction Create Completed`
      // with the same values once the launch confirms, regardless of whether this flow is mounted.
      analytics: analyticsProperties,
    }

    submitLaunchTransactions({
      account: evmAccount,
      transactions: result.transactions,
      atomicallyBundleable: result.atomicallyBundleable,
      info,
      tokenSymbol,
      setCurrentStep: (step) => setCurrentLaunchStep(step),
      onSuccess: (hash: string) => {
        setLaunchWalletError(undefined)
        setLaunchSuccess({ hash, auctionAddress: result.predictedAuctionAddress })
        setIsSuccessModalOpen(true)
        setAwaitingConfirmationRedirect(false)
        setIsReviewModalOpen(false)
        resetProgress()
      },
      onFailure: (error: Error) => {
        resetProgress()
        const err = coerceUnknownToError(error, 'Create auction launch failed')
        // A user rejecting the wallet prompt isn't a launch failure: keep the review modal open with
        // the prepared result intact so they can retry without re-fetching.
        if (didUserReject(err)) {
          return
        }
        const failedProps = getCreateFailedProperties?.({ failedStep: 'launch' })
        if (failedProps) {
          sendAnalyticsEvent(AuctionEventName.AuctionCreateFailed, failedProps)
        }
        // Wallet/launch failures are shown in the error modal but never reach Datadog otherwise.
        logger.error(err, {
          tags: { file: 'useLaunchAuctionFlow', function: 'handleLaunchToken' },
          extra: { failedStep: 'launch', errorMessage: err.message, ...failedProps, ...getFailedDiagnostics?.() },
        })
        setLaunchWalletError(err)
      },
    })
  })

  const openReviewModal = useEvent(() => {
    setIsReviewModalOpen(true)
    void prepareLaunch()
  })
  const closeReviewModal = useEvent(() => {
    setIsReviewModalOpen(false)
    setPreparedResult(undefined)
    setIsPreparing(false)
    resetProgress()
  })

  const handleCloseErrorModal = useCallback(() => {
    setIsErrorDismissed(true)
    setLaunchWalletError(undefined)
  }, [])

  const handleRetry = useEvent(() => {
    // prepareLaunch clears the dismissed/error state and re-fetches a fresh CreateAuction result.
    setIsReviewModalOpen(true)
    void prepareLaunch()
  })

  const navigateToAuction = useEvent(() => {
    if (!launchSuccess) {
      return
    }
    const chainUrlParam = getChainUrlParam(chainId)
    if (chainUrlParam) {
      navigate(`/explore/auctions/${chainUrlParam}/${launchSuccess.auctionAddress}`)
    }
  })

  // Tapping "View auction" is an explicit request to leave now, so navigate immediately.
  const handleViewAuction = navigateToAuction

  const handleCloseSuccessModal = useEvent(() => {
    setIsSuccessModalOpen(false)
    if (isLaunchConfirmed) {
      // Already on-chain — send the user straight to the auction.
      navigateToAuction()
    } else {
      // Still pending (e.g. atomic-batch wallets): keep the user on the review step and let the
      // watcher below redirect once the launch lands, rather than opening an auction page that
      // doesn't exist yet.
      setAwaitingConfirmationRedirect(true)
    }
  })

  // Watches the launch transaction (mirrors the LP flow's usePendingLPTransactionsChangeListener):
  // after a pending dismiss, redirect to the auction once the transaction confirms.
  useEffect(() => {
    if (awaitingConfirmationRedirect && isLaunchConfirmed) {
      navigateToAuction()
    }
  }, [awaitingConfirmationRedirect, isLaunchConfirmed, navigateToAuction])

  const progressSteps = useMemo<LaunchProgressStep[]>(() => {
    // The launch multicall is always last; any earlier txs are ERC20 approvals (existing-token path).
    const txs = preparedResult?.transactions ?? []
    return txs.map((_, index) =>
      index === txs.length - 1 ? LaunchProgressStep.PendingConfirmation : LaunchProgressStep.ApproveToken,
    )
  }, [preparedResult])

  const currentProgressStepIndex = useMemo<number>(() => {
    // Each step wraps the exact tx we passed in (createApprovalTransactionStep / createSwapTransactionStep),
    // so match currentStep.step.txRequest by reference to find which step is active.
    const step = currentStep?.step
    if (!step || !('txRequest' in step)) {
      return -1
    }
    return (preparedResult?.transactions ?? []).findIndex((tx) => tx === step.txRequest)
  }, [currentStep, preparedResult])

  return {
    isReviewModalVisible: isReviewModalOpen && !isErrorModalOpen,
    openReviewModal,
    closeReviewModal,
    handleLaunchToken,
    progressSteps,
    currentProgressStepIndex,
    currentStepPending: currentStep?.accepted ?? false,
    isLaunching,
    isPreparing,
    isErrorModalOpen,
    launchError,
    handleCloseErrorModal,
    handleRetry,
    launchSuccess,
    launchTxHash,
    isSuccessModalOpen,
    handleCloseSuccessModal,
    handleViewAuction,
  }
}
