import { GraphQLApi, TradingApi } from '@universe/api'

import { deriveCurrencyAmountFromAssetResponse } from 'uniswap/src/features/activity/utils/remote'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import {
  ConfirmedSwapTransactionInfo,
  TransactionDetails,
  TransactionDetailsType,
  TransactionListQueryResponse,
  TransactionOriginType,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { remoteOrderStatusToLocalTxStatus } from 'uniswap/src/features/transactions/utils/uniswapX.utils'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

export function extractUniswapXOrderDetails(transaction: TransactionListQueryResponse): TransactionDetails | null {
  if (transaction?.details.__typename !== TransactionDetailsType.UniswapXOrder) {
    return null
  }

  const typeInfo = parseUniswapXOrderTransaction(transaction)
  const routing =
    transaction.details.swapOrderType === GraphQLApi.SwapOrderType.Limit
      ? TradingApi.Routing.DUTCH_LIMIT
      : TradingApi.Routing.DUTCH_V2

  // TODO (MOB-3609): Parse and show pending limit orders in Activity feed
  if (!typeInfo || transaction.details.swapOrderType === GraphQLApi.SwapOrderType.Limit) {
    return null
  }

  return {
    routing,
    id: transaction.details.id,
    // TODO: WALL-4919: Remove hardcoded Mainnet
    chainId: fromGraphQLChain(transaction.chain) ?? UniverseChainId.Mainnet,
    addedTime: transaction.timestamp * 1000, // convert to ms,
    status: remoteOrderStatusToLocalTxStatus(transaction.details.orderStatus),
    from: transaction.details.offerer, // This transaction is not on-chain, so use the offerer address as the from address
    orderHash: transaction.details.hash,
    typeInfo,
    transactionOriginType: TransactionOriginType.Internal,
  }
}

export default function parseUniswapXOrderTransaction(
  transaction: NonNullable<TransactionListQueryResponse>,
): ConfirmedSwapTransactionInfo | null {
  if (transaction.details.__typename !== TransactionDetailsType.UniswapXOrder) {
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

  const inputCurrencyAmountRaw = deriveCurrencyAmountFromAssetResponse({
    tokenStandard: GraphQLApi.TokenStandard.Erc20,
    chain: transaction.chain,
    address: transaction.details.inputToken.address,
    decimals: transaction.details.inputToken.decimals,
    quantity: transaction.details.inputTokenQuantity,
  })

  const outputCurrencyAmountRaw = deriveCurrencyAmountFromAssetResponse({
    tokenStandard: GraphQLApi.TokenStandard.Erc20,
    chain: transaction.chain,
    address: transaction.details.outputToken.address,
    decimals: transaction.details.outputToken.decimals,
    quantity: transaction.details.outputTokenQuantity,
  })

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
