import { DEFAULT_NATIVE_ADDRESS } from 'uniswap/src/constants/chains'
import { TransactionType as RemoteTransactionType } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { Routing } from 'wallet/src/data/tradingApi/__generated__/index'
import { SpamCode } from 'wallet/src/data/types'
import parseApproveTransaction from 'wallet/src/features/transactions/history/conversion/parseApproveTransaction'
import parseNFTMintTransaction from 'wallet/src/features/transactions/history/conversion/parseMintTransaction'
import parseOnRampTransaction from 'wallet/src/features/transactions/history/conversion/parseOnRampTransaction'
import parseReceiveTransaction from 'wallet/src/features/transactions/history/conversion/parseReceiveTransaction'
import parseSendTransaction from 'wallet/src/features/transactions/history/conversion/parseSendTransaction'
import parseTradeTransaction from 'wallet/src/features/transactions/history/conversion/parseTradeTransaction'
import { remoteTxStatusToLocalTxStatus } from 'wallet/src/features/transactions/history/utils'
import {
  TransactionDetails,
  TransactionDetailsType,
  TransactionListQueryResponse,
  TransactionType,
  TransactionTypeInfo,
} from 'wallet/src/features/transactions/types'

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
    case RemoteTransactionType.Approve:
      typeInfo = parseApproveTransaction(transaction)
      break
    case RemoteTransactionType.Send:
      typeInfo = parseSendTransaction(transaction)
      break
    case RemoteTransactionType.Receive:
      typeInfo = parseReceiveTransaction(transaction)
      break
    case RemoteTransactionType.Swap:
    case RemoteTransactionType.SwapOrder:
      typeInfo = parseTradeTransaction(transaction)
      break
    case RemoteTransactionType.Mint:
      typeInfo = parseNFTMintTransaction(transaction)
      break
    case RemoteTransactionType.OnRamp:
      typeInfo = parseOnRampTransaction(transaction)
      break
  }

  // No match found, default to unknown.
  if (!typeInfo) {
    // If a parsing util returns undefined type info, we still want to check if its spam
    const isSpam =
      transaction.details.assetChanges?.some((change) => {
        switch (change?.__typename) {
          case 'NftTransfer':
            return change.asset?.isSpam
          case 'TokenTransfer':
            return change.asset.project?.isSpam || change.asset.project?.spamCode === SpamCode.HIGH
          default:
            return false
        }
      }) ?? true

    const dappInfo = transaction.details.application?.address
      ? {
          name: transaction.details.application?.name,
          address: transaction.details.application?.address,
          icon: transaction.details.application?.icon?.url,
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
    chainId && transaction.details.networkFee?.quantity && transaction.details.networkFee?.tokenSymbol
      ? {
          quantity: transaction.details.networkFee.quantity,
          tokenSymbol: transaction.details.networkFee.tokenSymbol,
          // graphQL returns a null token address for native tokens like ETH
          tokenAddress: transaction.details.networkFee.tokenAddress ?? DEFAULT_NATIVE_ADDRESS,
          chainId,
        }
      : undefined

  return {
    routing: transaction.details.type === RemoteTransactionType.SwapOrder ? Routing.DUTCH_V2 : Routing.CLASSIC,
    id: transaction.details.hash,
    // fallback to mainnet, although this should never happen
    chainId: chainId ?? UniverseChainId.Mainnet,
    hash: transaction.details.hash,
    addedTime: transaction.timestamp * 1000, // convert to ms
    status: remoteTxStatusToLocalTxStatus(transaction.details.type, transaction.details.status),
    from: transaction.details.from,
    typeInfo,
    options: { request: {} }, // Empty request is okay, gate re-submissions on txn type and status.
    networkFee,
  }
}
