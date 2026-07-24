import {
  OnChainTransaction,
  OnChainTransactionLabel,
  OnChainTransactionStatus,
} from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { TradingApi } from '@universe/api'
import { parseApproveTransaction } from 'uniswap/src/features/activity/parse/parseApproveTransaction'
import { parseAuctionTransaction } from 'uniswap/src/features/activity/parse/parseAuctionTransaction'
import { parseBridgeTransaction } from 'uniswap/src/features/activity/parse/parseBridgingTransaction'
import {
  buildExecuteTransactionDetails,
  parseExecuteTransaction,
} from 'uniswap/src/features/activity/parse/parseExecuteTransaction'
import { parseLiquidityTransaction } from 'uniswap/src/features/activity/parse/parseLiquidityTransaction'
import { parseNFTMintTransaction } from 'uniswap/src/features/activity/parse/parseMintTransaction'
import { parseReceiveTransaction } from 'uniswap/src/features/activity/parse/parseReceiveTransaction'
import { parseSendTransaction } from 'uniswap/src/features/activity/parse/parseSendTransaction'
import {
  parseDepositTransaction,
  parseSwapTransaction,
  parseWithdrawTransaction,
  parseWrapTransaction,
} from 'uniswap/src/features/activity/parse/parseTradeTransaction'
import { parseUnknownTransaction } from 'uniswap/src/features/activity/parse/parseUnknownTransaction'
import { ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import {
  TransactionDetails,
  TransactionOriginType,
  TransactionStatus,
  TransactionTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'

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

function parseRestOnChainTransactionTypeInfo(transaction: OnChainTransaction): TransactionTypeInfo | undefined {
  const { label } = transaction

  switch (label) {
    case OnChainTransactionLabel.VAULT_DEPOSIT:
      return parseDepositTransaction(transaction, { isVault: true })
    case OnChainTransactionLabel.WITHDRAW:
    case OnChainTransactionLabel.VAULT_WITHDRAW:
      return parseWithdrawTransaction(transaction, {
        isVault: label === OnChainTransactionLabel.VAULT_WITHDRAW,
      })
    case OnChainTransactionLabel.SEND:
    case OnChainTransactionLabel.VAULT_TRANSFER_OUT:
      return parseSendTransaction(transaction)
    case OnChainTransactionLabel.RECEIVE:
    case OnChainTransactionLabel.VAULT_TRANSFER_IN:
      return parseReceiveTransaction(transaction)
    case OnChainTransactionLabel.SWAP:
    case OnChainTransactionLabel.UNISWAP_X:
      return parseSwapTransaction(transaction)
    case OnChainTransactionLabel.WRAP:
    case OnChainTransactionLabel.UNWRAP:
    case OnChainTransactionLabel.LEND:
      return parseWrapTransaction(transaction)
    case OnChainTransactionLabel.APPROVE:
      return parseApproveTransaction(transaction)
    case OnChainTransactionLabel.BRIDGE:
      return parseBridgeTransaction(transaction)
    case OnChainTransactionLabel.MINT:
      return parseNFTMintTransaction(transaction)
    case OnChainTransactionLabel.CLAIM:
    case OnChainTransactionLabel.CREATE_PAIR:
    case OnChainTransactionLabel.CREATE_POOL:
    case OnChainTransactionLabel.INCREASE_LIQUIDITY:
    case OnChainTransactionLabel.DECREASE_LIQUIDITY:
      return parseLiquidityTransaction(transaction)
    case OnChainTransactionLabel.AUCTION_SUBMIT_BID:
    case OnChainTransactionLabel.AUCTION_CLAIM_TOKENS:
    case OnChainTransactionLabel.AUCTION_EXIT_BID:
    case OnChainTransactionLabel.AUCTION_EXIT_PARTIALLY_FILLED_BID:
    case OnChainTransactionLabel.AUCTION_CLAIM_TOKENS_BATCHED:
      return parseAuctionTransaction(transaction)
    default:
      return undefined
  }
}

/**
 * Extract transaction details from an onChain transaction in the REST format
 * Returns an array to support batched transactions (e.g., EXECUTE label with swap + approve)
 */
export default function extractRestOnChainTransactionDetails(transaction: OnChainTransaction): TransactionDetails[] {
  const { chainId, transactionHash, timestampMillis, from, label, status, fee, paymaster, sponsorship } = transaction

  const isCancel = label === OnChainTransactionLabel.CANCEL

  if (label === OnChainTransactionLabel.EXECUTE) {
    // Handle EXECUTE label separately, this represents batched transactions like swap + approve
    const parsed = parseExecuteTransaction(transaction)
    if (parsed) {
      return buildExecuteTransactionDetails({
        transaction,
        parsed,
        mapStatusFn: mapRestStatusToLocal,
      })
    }
    // If can't parse EXECUTE, this will be parsed as unknown transaction
  }

  const typeInfo = parseRestOnChainTransactionTypeInfo(transaction) ?? parseUnknownTransaction(transaction)

  const networkFee = fee
    ? {
        quantity: String(fee.amount?.amount),
        tokenSymbol: fee.symbol,
        tokenAddress: fee.address,
        chainId,
        valueType: ValueType.Exact,
      }
    : undefined

  const routing = label === OnChainTransactionLabel.UNISWAP_X ? TradingApi.Routing.DUTCH_V2 : TradingApi.Routing.CLASSIC

  const sponsorInfo: TradingApi.SponsorMetadata | undefined = sponsorship
    ? { name: sponsorship.name, icon: sponsorship.logoUrl }
    : undefined

  return [
    {
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
      paymaster: paymaster?.address,
      sponsorInfo,
      transactionOriginType: TransactionOriginType.Internal,
    },
  ]
}
