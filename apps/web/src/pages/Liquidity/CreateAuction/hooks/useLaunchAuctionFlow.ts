import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { AuctionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { AuctionCreateAnalyticsProperties } from 'uniswap/src/features/telemetry/types'
import type { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import {
  type AuctionLaunchTransactionInfo,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import type { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import type { EVMAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { isSignerMnemonicAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { useEvent } from 'utilities/src/react/hooks'
import { useAuctionLaunch } from '~/hooks/useAuctionLaunch'
import { LaunchProgressStep } from '~/pages/Liquidity/CreateAuction/components/LaunchAuctionProgressIndicator'
import type { CreateAuctionSubmitResult } from '~/pages/Liquidity/CreateAuction/hooks/useCreateAuctionSubmit'
import { useTransaction } from '~/state/transactions/hooks'
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
  isErrorModalOpen: boolean
  /** The error behind the error modal, so it can map known errors to specific copy. */
  launchError?: Error
  handleCloseErrorModal: () => void
  handleRetry: () => void
  launchSuccess?: LaunchSuccess
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
}: UseLaunchAuctionFlowParams): LaunchAuctionFlow {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const submitLaunchTransactions = useAuctionLaunch()

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [isLaunching, setIsLaunching] = useState(false)
  const [transactions, setTransactions] = useState<ValidatedTransactionRequest[]>([])
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
  const launchTransaction = useTransaction(launchSuccess?.hash)
  const isLaunchConfirmed = launchTransaction?.status === TransactionStatus.Success

  const resetProgress = useCallback(() => {
    setIsLaunching(false)
    setCurrentLaunchStep(undefined)
    setTransactions([])
  }, [])

  const handleLaunchToken = useEvent(async () => {
    setLaunchWalletError(undefined)
    setIsErrorDismissed(false)
    setLaunchSuccess(undefined)
    setIsSuccessModalOpen(false)
    setAwaitingConfirmationRedirect(false)
    setCurrentLaunchStep(undefined)
    setTransactions([])

    if (!evmAccount || !isSignerMnemonicAccountDetails(evmAccount)) {
      setLaunchWalletError(new Error(t('toucan.createAuction.walletRequired')))
      return
    }

    setIsLaunching(true)

    const result = await launchSubmit.onLaunch()
    if (!result) {
      setIsLaunching(false)
      return
    }

    setTransactions(result.transactions)

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
        // A user rejecting the wallet prompt isn't a launch failure: keep the review modal open.
        if (didUserReject(err)) {
          return
        }
        setLaunchWalletError(err)
      },
    })
  })

  const openReviewModal = useCallback(() => setIsReviewModalOpen(true), [])
  const closeReviewModal = useCallback(() => {
    setIsReviewModalOpen(false)
    resetProgress()
  }, [resetProgress])

  const handleCloseErrorModal = useCallback(() => {
    setIsErrorDismissed(true)
    setLaunchWalletError(undefined)
  }, [])

  const handleRetry = useCallback(() => {
    setIsErrorDismissed(true)
    setLaunchWalletError(undefined)
    setIsReviewModalOpen(true)
  }, [])

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

  const progressSteps = useMemo<LaunchProgressStep[]>(
    () =>
      // The launch multicall is always last; any earlier txs are ERC20 approvals (existing-token path).
      transactions.map((_, index) =>
        index === transactions.length - 1 ? LaunchProgressStep.PendingConfirmation : LaunchProgressStep.ApproveToken,
      ),
    [transactions],
  )

  const currentProgressStepIndex = useMemo<number>(() => {
    // Each step wraps the exact tx we passed in (createApprovalTransactionStep / createSwapTransactionStep),
    // so match currentStep.step.txRequest by reference to find which step is active.
    const step = currentStep?.step
    if (!step || !('txRequest' in step)) {
      return -1
    }
    return transactions.findIndex((tx) => tx === step.txRequest)
  }, [currentStep, transactions])

  return {
    isReviewModalVisible: isReviewModalOpen && !isErrorModalOpen,
    openReviewModal,
    closeReviewModal,
    handleLaunchToken,
    progressSteps,
    currentProgressStepIndex,
    currentStepPending: currentStep?.accepted ?? false,
    isLaunching,
    isErrorModalOpen,
    launchError,
    handleCloseErrorModal,
    handleRetry,
    launchSuccess,
    isSuccessModalOpen,
    handleCloseSuccessModal,
    handleViewAuction,
  }
}
