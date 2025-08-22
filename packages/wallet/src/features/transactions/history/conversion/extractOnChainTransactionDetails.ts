import {
  OnChainTransaction,
  OnChainTransactionLabel,
  OnChainTransactionStatus,
  TokenType,
} from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { AssetType } from 'uniswap/src/entities/assets'
import {
  TransactionDetails,
  TransactionOriginType,
  TransactionStatus,
  TransactionTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { parseRestApproveTransaction } from 'wallet/src/features/transactions/history/conversion/parseApproveTransaction'
import { parseRestBridgeTransaction } from 'wallet/src/features/transactions/history/conversion/parseBridgingTransaction'
import { parseRestLiquidityTransaction } from 'wallet/src/features/transactions/history/conversion/parseLiquidityTransaction'
import { parseRestNFTMintTransaction } from 'wallet/src/features/transactions/history/conversion/parseMintTransaction'
import { parseRestReceiveTransaction } from 'wallet/src/features/transactions/history/conversion/parseReceiveTransaction'
import { parseRestSendTransaction } from 'wallet/src/features/transactions/history/conversion/parseSendTransaction'
import {
  parseRestSwapTransaction,
  parseRestWrapTransaction,
} from 'wallet/src/features/transactions/history/conversion/parseTradeTransaction'
import { parseRestUnknownTransaction } from 'wallet/src/features/transactions/history/conversion/parseUnknownTransaction'

/**
 * Maps REST API transaction status to local transaction status
 */
function mapRestStatusToLocal(status: OnChainTransactionStatus, isCancel: boolean): TransactionStatus {
  switch (status) {
    case OnChainTransactionStatus.FAILED:
      return isCancel ? TransactionStatus.FailedCancel : TransactionStatus.Failed
    case OnChainTransactionStatus.PENDING:
      return isCancel ? TransactionStatus.Cancelling : TransactionStatus.Pending
    case OnChainTransactionStatus.CONFIRMED:
      return isCancel ? TransactionStatus.Canceled : TransactionStatus.Success
    default:
      return TransactionStatus.Unknown
  }
}

/**
 * Maps token type to asset type for the transaction
 */
export function mapTokenTypeToAssetType(tokenType?: TokenType): AssetType {
  switch (tokenType) {
    case TokenType.ERC721:
      return AssetType.ERC721
    case TokenType.ERC1155:
      return AssetType.ERC1155
    case TokenType.NATIVE:
    case TokenType.ERC20:
    default:
      return AssetType.Currency
  }
}

export enum AssetCase {
  Nft = 'nft',
  Token = 'token',
}

/**
 * Extract transaction details from an onChain transaction in the REST format
 */
export default function extractRestOnChainTransactionDetails(
  transaction: OnChainTransaction,
): TransactionDetails | null {
  const { chainId, transactionHash, timestampMillis, from, label, status, fee } = transaction

  const isCancel = label === OnChainTransactionLabel.CANCEL
  let typeInfo: TransactionTypeInfo | undefined

  switch (label) {
    case OnChainTransactionLabel.SEND:
      typeInfo = parseRestSendTransaction(transaction)
      break
    case OnChainTransactionLabel.RECEIVE:
      typeInfo = parseRestReceiveTransaction(transaction)
      break
    case OnChainTransactionLabel.SWAP:
    case OnChainTransactionLabel.UNISWAP_X:
      typeInfo = parseRestSwapTransaction(transaction)
      break
    case OnChainTransactionLabel.WRAP:
    case OnChainTransactionLabel.UNWRAP:
    case OnChainTransactionLabel.WITHDRAW:
    case OnChainTransactionLabel.LEND:
      typeInfo = parseRestWrapTransaction(transaction)
      break
    case OnChainTransactionLabel.APPROVE:
      typeInfo = parseRestApproveTransaction(transaction)
      break
    case OnChainTransactionLabel.BRIDGE:
      typeInfo = parseRestBridgeTransaction(transaction)
      break
    case OnChainTransactionLabel.MINT:
      typeInfo = parseRestNFTMintTransaction(transaction)
      break
    case OnChainTransactionLabel.CLAIM:
    case OnChainTransactionLabel.CREATE_PAIR:
    case OnChainTransactionLabel.CREATE_POOL:
    case OnChainTransactionLabel.INCREASE_LIQUIDITY:
    case OnChainTransactionLabel.DECREASE_LIQUIDITY:
      typeInfo = parseRestLiquidityTransaction(transaction)
      break
  }

  if (!typeInfo) {
    typeInfo = parseRestUnknownTransaction(transaction)
  }

  const networkFee = fee
    ? {
        quantity: String(fee.amount?.amount),
        tokenSymbol: fee.symbol,
        tokenAddress: fee.address,
        chainId,
      }
    : undefined

  const routing = label === OnChainTransactionLabel.UNISWAP_X ? Routing.DUTCH_V2 : Routing.CLASSIC

  return {
    routing,
    id: transactionHash,
    hash: transactionHash,
    chainId,
    status: mapRestStatusToLocal(status, isCancel),
    addedTime: Number(timestampMillis),
    from,
    typeInfo,
    options: { request: {} },
    networkFee,
    transactionOriginType: TransactionOriginType.Internal,
  }
}
