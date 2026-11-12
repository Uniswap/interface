import { isUnknownTransactionInfo } from 'uniswap/src/components/activity/details/types'
import { isNFTActivity } from 'uniswap/src/components/activity/utils'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TransactionDetails, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

export interface TransactionDetailSeparatorsRenderState {
  hideTopSeparator: boolean
  hideBottomSeparator: boolean
}

/**
 * A Permit2 approval with unresolved token metadata renders no body content (see the matching
 * guard in ApproveTransactionDetails), so the separator above it needs to hide too. Scoped to
 * Permit2Approve only — a plain Approve always has a required tokenAddress, so it never hits this
 * empty-render case.
 */
function useIsEmptyPermit2ApproveContent(transactionDetails: TransactionDetails): boolean {
  const { typeInfo, chainId } = transactionDetails
  const isPermit2Approve = typeInfo.type === TransactionType.Permit2Approve
  // tokenAddress is optional on Permit2ApproveTransactionInfo (unresolved metadata case) — treat a
  // missing address as unresolved rather than building a malformed `${chainId}-` currency id.
  const currencyId =
    isPermit2Approve && typeInfo.tokenAddress ? buildCurrencyId(chainId, typeInfo.tokenAddress) : undefined
  const currencyInfo = useCurrencyInfo(currencyId)
  return isPermit2Approve && !currencyInfo
}

export function useTransactionDetailSeparatorsRenderState(
  transactionDetails: TransactionDetails,
): TransactionDetailSeparatorsRenderState {
  const isEmptyPermit2ApproveContent = useIsEmptyPermit2ApproveContent(transactionDetails)
  const isNftTransaction = isNFTActivity(transactionDetails.typeInfo)
  const isMarginPlan =
    transactionDetails.typeInfo.type === TransactionType.Plan && !!transactionDetails.typeInfo.marginAction
  const hideTopSeparator =
    isNftTransaction ||
    isUnknownTransactionInfo(transactionDetails.typeInfo) ||
    isEmptyPermit2ApproveContent ||
    isMarginPlan
  const hideBottomSeparator = isNftTransaction

  return { hideTopSeparator, hideBottomSeparator }
}
