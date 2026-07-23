import { TradingApi } from '@universe/api'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type {
  SignDelegationAuthorizationFn,
  SwapDelegationInfo,
} from 'uniswap/src/features/smartWallet/delegation/types'
import { transformTradingApiUserOpToRpcUserOp } from 'uniswap/src/features/smartWallet/userOp/transformTradingApiUserOp'
import { SponsoredApprovalRejectedError } from 'uniswap/src/features/transactions/errors'
import type { ApprovalTxInfo } from 'uniswap/src/features/transactions/swap/review/hooks/useTokenApprovalInfo'
import { convertSwap5792ResponseToSwapData } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/evmSwapRepository'
import type { UniswapXSponsoredApproval } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { SponsoredApprovalType } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { ApprovalAction } from 'uniswap/src/features/transactions/swap/types/trade'
import type { UniswapXTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { validateTransactionRequests } from 'uniswap/src/features/transactions/swap/utils/trade'
import { buildUrgency, DEFAULT_URGENCY_LEVEL } from 'uniswap/src/features/transactions/swap/utils/tradingApi'

// A granted approval, or a SponsoredApprovalRejectedError on definitive non-delivery (surfaced as gasFee.error downstream).
export type FetchUniswapXSponsoredApproval = (params: {
  trade: UniswapXTrade
  approvalTxInfo: ApprovalTxInfo
}) => Promise<UniswapXSponsoredApproval | SponsoredApprovalRejectedError | undefined>

function needsPermit2Approval(approvalTxInfo: ApprovalTxInfo): boolean {
  const { action } = approvalTxInfo.tokenApprovalInfo
  return action === ApprovalAction.Permit2Approve || action === ApprovalAction.RevokeAndPermit2Approve
}

// Web (5792)
function createWebUniswapXSponsoredApprovalStrategy(ctx: {
  getCanBatchTransactions?: (chainId: UniverseChainId | undefined) => boolean
  gasOverrides?: TradingApi.UrgencyOverrides
}): FetchUniswapXSponsoredApproval {
  return async ({ trade, approvalTxInfo }) => {
    const chainId = trade.inputAmount.currency.chainId

    if (
      !trade.quote.sponsorshipInfo?.sponsored ||
      !needsPermit2Approval(approvalTxInfo) ||
      !ctx.getCanBatchTransactions?.(chainId)
    ) {
      return undefined
    }

    // Capable, so attempt sponsorship; any failure to obtain a grant is `rejected`, never a silent on-chain downgrade.
    try {
      // TODO(GasFeeOverrides): remove flag gate once the new urgency-based payload ships fully.
      const urgency = getFeatureFlag(FeatureFlags.GasFeeOverrides)
        ? buildUrgency(ctx.gasOverrides)
        : DEFAULT_URGENCY_LEVEL

      const response = await TradingApiClient.fetchSwap5792({
        quote: trade.quote.quote,
        approvalOnly: true,
        sponsorshipInfo: trade.quote.sponsorshipInfo,
        urgency,
      })

      const { transactions, paymasterService } = convertSwap5792ResponseToSwapData(response)
      const walletCallTxRequests = validateTransactionRequests(transactions)

      if (!walletCallTxRequests?.length) {
        return undefined
      }

      if (!paymasterService?.url) {
        return new SponsoredApprovalRejectedError('swap_5792 returned no paymasterService capability')
      }

      return { type: SponsoredApprovalType.WalletCall, walletCallTxRequests, paymasterService }
    } catch (error) {
      return new SponsoredApprovalRejectedError(error instanceof Error ? error.message : 'swap_5792 request failed')
    }
  }
}

// Wallet (4337): gate on delegation up front, then ask check_approval_4337 for a sponsored approval UserOp.
function createWalletUniswapXSponsoredApprovalStrategy(ctx: {
  getSwapDelegationInfo?: (chainId: UniverseChainId | undefined) => SwapDelegationInfo
  signDelegationAuthorization?: SignDelegationAuthorizationFn
}): FetchUniswapXSponsoredApproval {
  return async ({ trade, approvalTxInfo }) => {
    const chainId = trade.inputAmount.currency.chainId
    const sender = trade.quote.quote.orderInfo.swapper

    // Gate 1 (capability)
    const sponsorshipInfo = trade.quote.sponsorshipInfo
    const delegationInfo = ctx.getSwapDelegationInfo?.(chainId)
    const isDelegated = delegationInfo
      ? delegationInfo.isWalletDelegatedToUniswap || delegationInfo.delegationInclusion
      : undefined
    if (!needsPermit2Approval(approvalTxInfo) || !isDelegated || !sponsorshipInfo?.sponsored) {
      return undefined
    }

    // Capable → we attempt sponsorship. From here, any failure to obtain a grant is `rejected`, never a silent on-chain downgrade.
    try {
      // When this approval activates the delegation (first sponsored tx on an undelegated
      // account), sign the 7702 authorization up front so the backend's paymaster + bundler
      // simulation runs against a delegated account. The signed auth round-trips back on the
      // returned UserOp, so the later signUserOp step reuses it. Already-delegated accounts
      // need no auth (the code is on-chain), so we only sign on delegationInclusion.
      const eip7702Auth =
        delegationInfo?.delegationInclusion && delegationInfo.delegationAddress
          ? await ctx.signDelegationAuthorization?.({
              chainId,
              sender,
              delegationAddress: delegationInfo.delegationAddress,
            })
          : undefined

      const response = await TradingApiClient.fetchCheckApproval4337({
        sender,
        token: trade.inputAmount.currency.wrapped.address,
        amount: trade.inputAmount.quotient.toString(),
        chainId,
        tokenOut: trade.outputAmount.currency.wrapped.address,
        tokenOutChainId: trade.outputAmount.currency.chainId,
        sponsorshipInfo,
        eip7702Auth,
      })

      if (!response.userOperation) {
        return undefined
      }

      // Gate 2 (sponsorship grant): granted iff the endpoint sponsored it
      if (!response.gasSponsored) {
        return new SponsoredApprovalRejectedError(
          response.gasSponsorshipRejectionReason ?? 'check_approval_4337 did not sponsor',
        )
      }

      return {
        type: SponsoredApprovalType.UserOp,
        unsignedUserOperation: transformTradingApiUserOpToRpcUserOp(response.userOperation),
        gasSponsored: response.gasSponsored,
        paymasterServiceContext: response.paymasterServiceContext,
      }
    } catch (error) {
      return new SponsoredApprovalRejectedError(
        error instanceof Error ? error.message : 'check_approval_4337 request failed',
      )
    }
  }
}

// Picks the transport by platform capability: 5792 wallet-call where batching is supported, else a 4337 userOp where delegated.
export function createUniswapXSponsoredApprovalStrategy(ctx: {
  getCanBatchTransactions?: (chainId: UniverseChainId | undefined) => boolean
  getSwapDelegationInfo?: (chainId: UniverseChainId | undefined) => SwapDelegationInfo
  signDelegationAuthorization?: SignDelegationAuthorizationFn
  gasOverrides?: TradingApi.UrgencyOverrides
}): FetchUniswapXSponsoredApproval {
  const web = createWebUniswapXSponsoredApprovalStrategy(ctx)
  const wallet = createWalletUniswapXSponsoredApprovalStrategy(ctx)
  // Each sub-strategy only hits its endpoint after its own capability gate passes, so at most one network call fires.
  return async (params) => (await web(params)) ?? (await wallet(params))
}
