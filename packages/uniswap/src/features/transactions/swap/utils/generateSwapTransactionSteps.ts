import { permit2Address } from '@uniswap/permit2-sdk'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  createApprovalTransactionStep,
  createApprovalUserOpStep,
  createApprovalWalletCallStep,
  type TokenApprovalUserOpStep,
  type TokenApprovalWalletCallStep,
} from 'uniswap/src/features/transactions/steps/approve'
import { createPermit2SignatureStep } from 'uniswap/src/features/transactions/steps/permit2Signature'
import { createPermit2TransactionStep } from 'uniswap/src/features/transactions/steps/permit2Transaction'
import { createRevocationTransactionStep } from 'uniswap/src/features/transactions/steps/revoke'
import { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { orderClassicSwapSteps } from 'uniswap/src/features/transactions/swap/steps/classicSteps'
import { createSignUniswapXOrderStep } from 'uniswap/src/features/transactions/swap/steps/signOrder'
import {
  createSwapTransactionAsyncStep,
  createSwapTransactionStep,
  createSwapTransactionStepWalletCall,
} from 'uniswap/src/features/transactions/swap/steps/swap'
import { orderUniswapXSteps } from 'uniswap/src/features/transactions/swap/steps/uniswapxSteps'
import {
  isValidSwapTxContext,
  SponsoredApprovalType,
  SwapTxAndGasInfo,
  type UniswapXSponsoredApproval,
} from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { isBridge, isClassic, isUniswapX, isUserOpSwap } from 'uniswap/src/features/transactions/swap/utils/routing'
import { parseERC20ApproveCalldata } from 'uniswap/src/utils/approvals'

function createSponsoredApprovalStep({
  sponsoredApproval,
  tokenAddress,
  chainId,
  amount,
}: {
  sponsoredApproval: UniswapXSponsoredApproval
  tokenAddress: Address
  chainId: UniverseChainId
  amount: string
}): TokenApprovalWalletCallStep | TokenApprovalUserOpStep | undefined {
  if (sponsoredApproval.type === SponsoredApprovalType.WalletCall) {
    const { walletCallTxRequests, paymasterService } = sponsoredApproval
    if (walletCallTxRequests.length === 0) {
      return undefined
    }
    const approveData = walletCallTxRequests[0].data
    const spender = approveData ? parseERC20ApproveCalldata(approveData.toString()).spender : permit2Address(chainId)
    return createApprovalWalletCallStep({
      txRequests: walletCallTxRequests,
      paymasterService,
      tokenAddress,
      chainId,
      amount,
      spender,
    })
  }

  return createApprovalUserOpStep({
    unsignedUserOp: sponsoredApproval.unsignedUserOperation,
    gasSponsored: sponsoredApproval.gasSponsored,
    paymasterServiceContext: sponsoredApproval.paymasterServiceContext,
    tokenAddress,
    chainId,
    amount,
    // Permit2 is the only approval target for sponsored UniswapX; userOp calldata isn't parseable.
    spender: permit2Address(chainId),
  })
}

export function generateSwapTransactionSteps(txContext: SwapTxAndGasInfo): TransactionStep[] {
  // Swaps with already-encoded UserOps don't happen here; they happen in separate 4337 flow
  const isValidSwap = isValidSwapTxContext(txContext) && !isUserOpSwap(txContext)

  if (isValidSwap) {
    const { trade, approveTxRequest, revocationTxRequest } = txContext

    const requestFields = {
      tokenAddress: trade.inputAmount.currency.wrapped.address,
      chainId: trade.inputAmount.currency.chainId,
    }
    const revocation = createRevocationTransactionStep({
      ...requestFields,
      txRequest: revocationTxRequest,
    })
    const approval = createApprovalTransactionStep({
      ...requestFields,
      txRequest: approveTxRequest,
      amount: trade.inputAmount.quotient.toString(),
    })

    if (isClassic(txContext)) {
      const { swapRequestArgs } = txContext
      const isSponsored = txContext.trade.quote.sponsorshipInfo?.sponsored && txContext.paymasterService

      if (txContext.hasUnsignedPermit) {
        return orderClassicSwapSteps({
          revocation,
          approval,
          permit: createPermit2SignatureStep(txContext.permit.typedData),
          swap: createSwapTransactionAsyncStep(swapRequestArgs),
        })
      }
      if (txContext.txRequests.length > 1 || isSponsored) {
        return orderClassicSwapSteps({
          permit: undefined,
          swap: createSwapTransactionStepWalletCall(txContext.txRequests, txContext.paymasterService),
        })
      }

      const permit = txContext.permit
        ? createPermit2TransactionStep({
            txRequest: txContext.permit.txRequest,
            amountIn: trade.inputAmount,
          })
        : undefined

      return orderClassicSwapSteps({
        revocation,
        approval,
        permit,
        swap: createSwapTransactionStep(txContext.txRequests[0]),
      })
    } else if (isUniswapX(txContext)) {
      const sponsoredApprovalStep = txContext.sponsoredApproval
        ? createSponsoredApprovalStep({
            sponsoredApproval: txContext.sponsoredApproval,
            ...requestFields,
            amount: trade.inputAmount.quotient.toString(),
          })
        : undefined

      return orderUniswapXSteps({
        revocation,
        approval: sponsoredApprovalStep ?? approval,
        signOrder: createSignUniswapXOrderStep(txContext.permit.typedData, txContext.trade.quote.quote),
      })
    } else if (isBridge(txContext)) {
      const isSponsored = txContext.trade.quote.sponsorshipInfo?.sponsored && txContext.paymasterService
      if (txContext.txRequests.length > 1 || isSponsored) {
        return orderClassicSwapSteps({
          permit: undefined,
          swap: createSwapTransactionStepWalletCall(txContext.txRequests, txContext.paymasterService),
        })
      }
      return orderClassicSwapSteps({
        revocation,
        approval,
        permit: undefined,
        swap: createSwapTransactionStep(txContext.txRequests[0]),
      })
    }
  }

  return []
}
