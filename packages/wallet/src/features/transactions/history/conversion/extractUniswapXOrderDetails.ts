import {
  SwapOrderStatus,
  SwapOrderType,
  TokenStandard,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { Routing } from 'wallet/src/data/tradingApi/__generated__/index'
import { deriveCurrencyAmountFromAssetResponse } from 'wallet/src/features/transactions/history/utils'
import {
  ConfirmedSwapTransactionInfo,
  TransactionDetails,
  TransactionDetailsType,
  TransactionListQueryResponse,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'

export function extractUniswapXOrderDetails(transaction: TransactionListQueryResponse): TransactionDetails | null {
  if (transaction?.details.__typename !== TransactionDetailsType.UniswapXOrder) {
    return null
  }

  const typeInfo = parseUniswapXOrderTransaction(transaction)
  const routing = transaction.details.swapOrderType === SwapOrderType.Limit ? Routing.DUTCH_LIMIT : Routing.DUTCH_V2

  // TODO (MOB-3609): Parse and show pending limit orders in Activity feed
  if (!typeInfo || transaction.details.swapOrderType === SwapOrderType.Limit) {
    return null
  }

  return {
    routing,
    id: transaction.details.id,
    chainId: fromGraphQLChain(transaction.chain) ?? UniverseChainId.Mainnet,
    addedTime: transaction.timestamp * 1000, // convert to ms,
    status: remoteOrderStatusToLocalTxStatus(transaction.details.orderStatus),
    from: transaction.details.offerer, // This transaction is not on-chain, so use the offerer address as the from address
    orderHash: transaction.details.hash,
    typeInfo,
  }
}

function remoteOrderStatusToLocalTxStatus(orderStatus: SwapOrderStatus): TransactionStatus {
  switch (orderStatus) {
    case SwapOrderStatus.Open:
      return TransactionStatus.Pending
    case SwapOrderStatus.Expired:
      return TransactionStatus.Expired
    case SwapOrderStatus.Error:
      return TransactionStatus.Failed
    case SwapOrderStatus.InsufficientFunds:
      return TransactionStatus.InsufficientFunds
    case SwapOrderStatus.Filled:
      return TransactionStatus.Success
    case SwapOrderStatus.Cancelled:
      return TransactionStatus.Canceled
  }
}

export default function parseUniswapXOrderTransaction(
  transaction: NonNullable<TransactionListQueryResponse>,
): ConfirmedSwapTransactionInfo | null {
  if (transaction?.details?.__typename !== TransactionDetailsType.UniswapXOrder) {
    return null
  }

  const chainId = fromGraphQLChain(transaction.chain)
  if (!chainId) {
    return null
  }

  // Token swap
  const inputCurrencyId = transaction.details.inputToken.address
    ? buildCurrencyId(chainId, transaction.details.inputToken.address)
    : null
  const outputCurrencyId = transaction.details.outputToken.address
    ? buildCurrencyId(chainId, transaction.details.outputToken.address)
    : null

  const inputCurrencyAmountRaw = deriveCurrencyAmountFromAssetResponse(
    TokenStandard.Erc20,
    transaction.chain,
    transaction.details.inputToken.address,
    transaction.details.inputToken.decimals,
    transaction.details.inputTokenQuantity,
  )

  const outputCurrencyAmountRaw = deriveCurrencyAmountFromAssetResponse(
    TokenStandard.Erc20,
    transaction.chain,
    transaction.details.outputToken.address,
    transaction.details.outputToken.decimals,
    transaction.details.outputTokenQuantity,
  )

  if (!inputCurrencyId || !outputCurrencyId) {
    return null
  }

  return {
    type: TransactionType.Swap,
    inputCurrencyId,
    outputCurrencyId,
    inputCurrencyAmountRaw,
    outputCurrencyAmountRaw,
  }
}
