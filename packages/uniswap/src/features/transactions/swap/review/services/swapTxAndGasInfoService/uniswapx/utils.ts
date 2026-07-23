import { TradingApi } from '@universe/api'
import { SponsoredApprovalRejectedError } from 'uniswap/src/features/transactions/errors'
import type { ApprovalTxInfo } from 'uniswap/src/features/transactions/swap/review/hooks/useTokenApprovalInfo'
import type { TransactionRequestInfo } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import {
  createApprovalFields,
  createGasFields,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import { PermitMethod } from 'uniswap/src/features/transactions/swap/types/permitMethod'
import type {
  UniswapXGasBreakdown,
  UniswapXSponsoredApproval,
  UniswapXSwapTxAndGasInfo,
} from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { SponsoredApprovalType } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import type { UniswapXTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { validatePermit } from 'uniswap/src/features/transactions/swap/utils/trade'

export function processUniswapXResponse({
  permitData,
}: {
  permitData: TradingApi.NullablePermit | undefined
}): TransactionRequestInfo {
  return {
    gasFeeResult: { value: '0', displayValue: '0', error: null, isLoading: false }, // There is no gas fee for UniswapX swap
    gasEstimate: {},
    txRequests: undefined,
    swapRequestArgs: undefined,
    permitData,
  }
}

function createUniswapXGasBreakdown({
  trade,
  approvalTxInfo,
  swapTxInfo,
}: {
  trade: UniswapXTrade
  approvalTxInfo: ApprovalTxInfo
  swapTxInfo: TransactionRequestInfo
}): { gasFeeBreakdown: UniswapXGasBreakdown } {
  const { approvalGasFeeResult } = approvalTxInfo
  const gasFeeBreakdown = {
    classicGasUseEstimateUSD: trade.quote.quote.classicGasUseEstimateUSD,
    approvalCost: approvalGasFeeResult.displayValue,
    wrapCost: swapTxInfo.gasFeeResult.displayValue,
    inputTokenSymbol: trade.inputAmount.currency.symbol,
  }

  return { gasFeeBreakdown }
}

export function getUniswapXSwapTxAndGasInfo({
  trade,
  swapTxInfo,
  approvalTxInfo,
  sponsoredApproval,
}: {
  trade: UniswapXTrade
  swapTxInfo: TransactionRequestInfo
  approvalTxInfo: ApprovalTxInfo
  sponsoredApproval?: UniswapXSponsoredApproval | SponsoredApprovalRejectedError
}): UniswapXSwapTxAndGasInfo {
  const permit = validatePermit(swapTxInfo.permitData)
  const sponsorshipRejection =
    sponsoredApproval instanceof SponsoredApprovalRejectedError ? sponsoredApproval : undefined
  const grantedApproval = sponsoredApproval instanceof SponsoredApprovalRejectedError ? undefined : sponsoredApproval
  const gasFields = createGasFields({ swapTxInfo, approvalTxInfo })

  return {
    routing: trade.routing,
    trade,
    ...gasFields,
    // Sponsorship promised at quote but not delivered — surface on gasFee.error to block the swap + warn.
    ...(sponsorshipRejection ? { gasFee: { ...gasFields.gasFee, error: sponsorshipRejection } } : {}),
    ...createApprovalFields({ approvalTxInfo }),
    ...createUniswapXGasBreakdown({ trade, approvalTxInfo, swapTxInfo }),
    permit: permit ? { method: PermitMethod.TypedData, typedData: permit } : undefined,
    sponsoredApproval: grantedApproval,
    paymasterService:
      grantedApproval?.type === SponsoredApprovalType.WalletCall ? grantedApproval.paymasterService : undefined,
    requestUniswapGasSponsorship: undefined,
  }
}
