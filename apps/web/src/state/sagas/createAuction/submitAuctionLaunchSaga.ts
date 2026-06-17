import { call, select } from 'typed-redux-saga'
import { createApprovalTransactionStep } from 'uniswap/src/features/transactions/steps/approve'
import {
  createSwapTransactionStep,
  createSwapTransactionStepWalletCall,
} from 'uniswap/src/features/transactions/swap/steps/swap'
import { parseERC20ApproveCalldata } from 'uniswap/src/utils/approvals'
import { createSaga } from 'uniswap/src/utils/saga'
import { logger } from 'utilities/src/logger/logger'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'
import type { SubmitAuctionLaunchParams } from '~/state/sagas/createAuction/types'
import { handleAtomicSendCalls } from '~/state/sagas/transactions/5792'
import { getDisplayableError, handleApprovalTransactionStep, handleOnChainStep } from '~/state/sagas/transactions/utils'
import { selectIsAtomicBatchingSupportedByChainId } from '~/state/walletCapabilities/reducer'
import { coerceUnknownToError } from '~/utils/coerceUnknownToError'

// approve(address,uint256) calldata: '0x' + 4-byte selector + 32-byte spender + 32-byte amount.
const ERC20_APPROVE_CALLDATA_LENGTH = 2 + 8 + 64 + 64

export function* submitAuctionLaunch(params: SubmitAuctionLaunchParams) {
  const {
    account,
    selectChain,
    transactions,
    atomicallyBundleable,
    info,
    tokenSymbol,
    setCurrentStep,
    onSuccess,
    onFailure,
  } = params

  if (transactions.length === 0) {
    onFailure(new Error('No transactions to submit'))
    return
  }

  const firstChainId = transactions[0].chainId
  const sameChain = transactions.every((tx) => tx.chainId === firstChainId)
  if (!sameChain) {
    onFailure(new Error('Create auction transactions must share the same chain'))
    return
  }

  try {
    const chainSwitched = yield* call(selectChain, firstChainId)
    if (!chainSwitched) {
      onFailure(new Error('Failed to switch networks for create auction'))
      return
    }

    const atomicSupport = yield* select(selectIsAtomicBatchingSupportedByChainId)
    const walletSupportsAtomicBatch = atomicSupport(firstChainId) === true
    const shouldSendAtomicBundle = atomicallyBundleable && walletSupportsAtomicBatch

    if (shouldSendAtomicBundle) {
      const batchId = yield* call(handleAtomicSendCalls, {
        address: account.address,
        info,
        step: createSwapTransactionStepWalletCall(transactions),
        setCurrentStep,
        ignoreInterrupt: true,
        shouldWaitForConfirmation: false,
      })
      onSuccess(batchId)
      return
    }

    // The launch multicall is always last; any earlier txs are ERC20 approval steps (existing-token path).
    const launchStepIndex = transactions.length - 1
    let launchHash: string | undefined

    for (const [index, tx] of transactions.entries()) {
      if (index !== launchStepIndex) {
        // Approval (existing-token path): handle it as a real approval step so we wait for it to
        // confirm before prompting the launch tx, and it renders in the review-modal progress
        // indicator. Mirrors the bid saga — no separate activity toast for the approval.
        const data = typeof tx.data === 'string' ? tx.data : ''
        const decoded = data.length >= ERC20_APPROVE_CALLDATA_LENGTH ? parseERC20ApproveCalldata(data) : undefined
        const approvalStep = createApprovalTransactionStep({
          amount: decoded?.amount.toString(),
          txRequest: tx,
          tokenAddress: tx.to,
          chainId: tx.chainId,
          tokenSymbol,
        })
        if (!approvalStep) {
          throw new Error('Auction approval transaction is not a valid ERC20 approval')
        }
        yield* call(handleApprovalTransactionStep, { address: account.address, step: approvalStep, setCurrentStep })
        continue
      }

      // Wait for the launch to confirm so onSuccess (and the success modal) only fire once the
      // auction actually exists on-chain; a revert routes to onFailure instead.
      launchHash = yield* call(handleOnChainStep, {
        address: account.address,
        step: createSwapTransactionStep(tx),
        info,
        setCurrentStep,
        shouldWaitForConfirmation: true,
        ignoreInterrupt: true,
        allowDuplicativeTx: true,
      })

      // Surface the launch activity toast. The atomic-batch path above adds its popup inside
      // handleAtomicSendCalls.
      popupRegistry.addPopup({ type: PopupType.Transaction, hash: launchHash }, launchHash)
    }

    if (launchHash) {
      onSuccess(launchHash)
    } else {
      onFailure(new Error('Create auction submission did not return a transaction hash'))
    }
  } catch (error) {
    const err = coerceUnknownToError(error, 'Create auction launch failed')
    const displayable = getDisplayableError({ error: err, flow: 'auctionLaunch' })
    if (displayable) {
      logger.error(displayable, {
        tags: { file: 'submitAuctionLaunchSaga', function: 'submitAuctionLaunch' },
      })
    }
    onFailure(err)
  }
}

export const submitAuctionLaunchSaga = createSaga(submitAuctionLaunch, 'submitAuctionLaunchSaga')
