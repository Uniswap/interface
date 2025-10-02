import { GraphQLApi, SpamCode, TradingApi } from '@universe/api'
import parseApproveTransaction from 'uniswap/src/features/activity/parse/parseApproveTransaction'
import parseBridgingTransaction from 'uniswap/src/features/activity/parse/parseBridgingTransaction'
import parseNFTMintTransaction from 'uniswap/src/features/activity/parse/parseMintTransaction'
import parseOnRampTransaction from 'uniswap/src/features/activity/parse/parseOnRampTransaction'
import parseReceiveTransaction from 'uniswap/src/features/activity/parse/parseReceiveTransaction'
import parseSendTransaction from 'uniswap/src/features/activity/parse/parseSendTransaction'
import parseTradeTransaction from 'uniswap/src/features/activity/parse/parseTradeTransaction'
import { remoteTxStatusToLocalTxStatus } from 'uniswap/src/features/activity/utils/remote'
import { DEFAULT_NATIVE_ADDRESS_LEGACY } from 'uniswap/src/features/chains/evm/defaults'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import type {
  TransactionDetails,
  TransactionListQueryResponse,
  TransactionTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import {
  TransactionDetailsType,
  TransactionOriginType,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'

/**
 * Parses txn API response item and identifies known txn type. Helps strictly
 * type txn summary data to be used within UI.
 *
 * @param transaction Transaction api response item to parse.
 * @returns Formatted TransactionDetails object.
 */
export default function extractTransactionDetails(
  transaction: TransactionListQueryResponse,
): TransactionDetails | null {
  if (transaction?.details.__typename !== TransactionDetailsType.Transaction) {
    return null
  }

  let typeInfo: TransactionTypeInfo | undefined
  switch (transaction.details.type) {
    case GraphQLApi.TransactionType.Approve:
      typeInfo = parseApproveTransaction(transaction)
      break
    case GraphQLApi.TransactionType.Send:
      typeInfo = parseSendTransaction(transaction)
      break
    case GraphQLApi.TransactionType.Receive:
      typeInfo = parseReceiveTransaction(transaction)
      break
    case GraphQLApi.TransactionType.Bridging:
      typeInfo = parseBridgingTransaction(transaction)
      break
    case GraphQLApi.TransactionType.Swap:
    case GraphQLApi.TransactionType.SwapOrder:
      typeInfo = parseTradeTransaction(transaction)
      break
    case GraphQLApi.TransactionType.Mint:
      typeInfo = parseNFTMintTransaction(transaction)
      break
    case GraphQLApi.TransactionType.OnRamp:
      typeInfo = parseOnRampTransaction(transaction)
      break
  }

  // No match found, default to unknown.
  if (!typeInfo) {
    // If a parsing util returns undefined type info, we still want to check if its spam
    const isSpam = transaction.details.assetChanges.some((change) => {
      switch (change?.__typename) {
        case 'NftTransfer':
          return change.asset.isSpam
        case 'TokenTransfer':
          return change.asset.project?.isSpam || change.asset.project?.spamCode === SpamCode.HIGH
        default:
          return false
      }
    })

    const dappInfo = transaction.details.application?.address
      ? {
          name: transaction.details.application.name,
          address: transaction.details.application.address,
          icon: transaction.details.application.icon?.url,
        }
      : undefined
    typeInfo = {
      type: TransactionType.Unknown,
      tokenAddress: transaction.details.to,
      isSpam,
      dappInfo,
    }
  }

  const chainId = fromGraphQLChain(transaction.chain)

  const networkFee =
    chainId && transaction.details.networkFee?.quantity && transaction.details.networkFee.tokenSymbol
      ? {
          quantity: transaction.details.networkFee.quantity,
          tokenSymbol: transaction.details.networkFee.tokenSymbol,
          // graphQL returns a null token address for native tokens like ETH
          tokenAddress: transaction.details.networkFee.tokenAddress ?? DEFAULT_NATIVE_ADDRESS_LEGACY,
          // Use the tokenChain from the networkFee response instead of the transaction's main chain
          chainId: fromGraphQLChain(transaction.details.networkFee.tokenChain) ?? chainId,
        }
      : undefined

  return {
    routing:
      transaction.details.type === GraphQLApi.TransactionType.SwapOrder
        ? TradingApi.Routing.DUTCH_V2
        : TradingApi.Routing.CLASSIC,
    id: transaction.details.hash,
    // TODO: WALL-4919: Remove hardcoded Mainnet
    // fallback to mainnet, although this should never happen
    chainId: chainId ?? UniverseChainId.Mainnet,
    hash: transaction.details.hash,
    addedTime: transaction.timestamp * 1000, // convert to ms
    status: remoteTxStatusToLocalTxStatus(transaction.details.type, transaction.details.status),
    from: transaction.details.from,
    typeInfo,
    options: { request: {} }, // Empty request is okay, gate re-submissions on txn type and status.
    networkFee,
    transactionOriginType: TransactionOriginType.Internal,
  }
}
