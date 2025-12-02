import type { OnChainTransaction } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { Direction } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { GraphQLApi } from '@universe/api'
import { deriveCurrencyAmountFromAssetResponse } from 'uniswap/src/features/activity/utils/remote'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { ACROSS_DAPP_INFO } from 'uniswap/src/features/transactions/swap/utils/routing'
import type {
  BridgeTransactionInfo,
  TransactionListQueryResponse,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionDetailsType, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'

type AssetChanges = NonNullable<
  Extract<
    NonNullable<TransactionListQueryResponse>['details'],
    { __typename?: 'TransactionDetails' | undefined }
  >['assetChanges']
>

export default function parseBridgingTransaction(
  transaction: NonNullable<TransactionListQueryResponse>,
): BridgeTransactionInfo | undefined {
  if (transaction.details.__typename !== TransactionDetailsType.Transaction) {
    return undefined
  }

  const outTokenTransfer = findTokenTransfer(transaction.details.assetChanges, GraphQLApi.TransactionDirection.Out)
  const inTokenTransfer = findTokenTransfer(transaction.details.assetChanges, GraphQLApi.TransactionDirection.In)

  const outChainId = fromGraphQLChain(outTokenTransfer?.asset.chain)
  const inChainId = fromGraphQLChain(inTokenTransfer?.asset.chain)

  if (!outTokenTransfer || !outChainId || !inTokenTransfer || !inChainId) {
    return undefined
  }

  const outCurrencyId =
    outTokenTransfer.tokenStandard === GraphQLApi.TokenStandard.Native
      ? buildNativeCurrencyId(outChainId)
      : outTokenTransfer.asset.address
        ? buildCurrencyId(outChainId, outTokenTransfer.asset.address)
        : undefined

  const inCurrencyId =
    inTokenTransfer.tokenStandard === GraphQLApi.TokenStandard.Native
      ? buildNativeCurrencyId(inChainId)
      : inTokenTransfer.asset.address
        ? buildCurrencyId(inChainId, inTokenTransfer.asset.address)
        : undefined

  if (!outCurrencyId || !inCurrencyId) {
    return undefined
  }

  const outCurrencyAmountRaw = deriveCurrencyAmountFromAssetResponse({
    tokenStandard: outTokenTransfer.tokenStandard,
    chain: outTokenTransfer.asset.chain,
    address: outTokenTransfer.asset.address,
    decimals: outTokenTransfer.asset.decimals,
    quantity: outTokenTransfer.quantity,
  })

  const inCurrencyAmountRaw = deriveCurrencyAmountFromAssetResponse({
    tokenStandard: inTokenTransfer.tokenStandard,
    chain: inTokenTransfer.asset.chain,
    address: inTokenTransfer.asset.address,
    decimals: inTokenTransfer.asset.decimals,
    quantity: inTokenTransfer.quantity,
  })

  return {
    type: TransactionType.Bridge,
    inputCurrencyId: outCurrencyId,
    inputCurrencyAmountRaw: outCurrencyAmountRaw,
    outputCurrencyId: inCurrencyId,
    outputCurrencyAmountRaw: inCurrencyAmountRaw,
    routingDappInfo: ACROSS_DAPP_INFO,
  }
}

function findTokenTransfer(
  assetChanges: AssetChanges,
  direction: GraphQLApi.TransactionDirection,
): GraphQLApi.TokenTransfer | undefined {
  return assetChanges.find(
    (t): t is Extract<GraphQLApi.TokenTransfer, { __typename: 'TokenTransfer' }> =>
      t?.__typename === 'TokenTransfer' && t.direction === direction,
  )
}

/**
 * Parse a bridge transaction from the REST API
 */
export function parseRestBridgeTransaction(transaction: OnChainTransaction): BridgeTransactionInfo | undefined {
  const { transfers } = transaction
  const outTokenTransfer = transfers.find((t) => t.direction === Direction.SEND)
  const inTokenTransfer = transfers.find((t) => t.direction === Direction.RECEIVE)
  const outTokenAsset = outTokenTransfer?.asset.value
  const inTokenAsset = inTokenTransfer?.asset.value
  if (!outTokenAsset || !inTokenAsset) {
    return undefined
  }
  return {
    type: TransactionType.Bridge,
    inputCurrencyId: buildCurrencyId(outTokenAsset.chainId, outTokenAsset.address),
    outputCurrencyId: buildCurrencyId(inTokenAsset.chainId, inTokenAsset.address),
    inputCurrencyAmountRaw: outTokenTransfer.amount?.raw ?? '',
    outputCurrencyAmountRaw: inTokenTransfer.amount?.raw ?? '',
    transactedUSDValue: undefined,
    routingDappInfo: ACROSS_DAPP_INFO,
  }
}
