import {
  Direction,
  OnChainTransaction,
  OnChainTransactionLabel,
  Transfer,
} from '@uniswap/client-data-api/dist/data/v1/types_pb'
import {
  CollectFeesTransactionInfo,
  CreatePairTransactionInfo,
  CreatePoolTransactionInfo,
  LiquidityDecreaseTransactionInfo,
  LiquidityIncreaseTransactionInfo,
  TransactionType,
  UnknownTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { AssetCase } from 'wallet/src/features/transactions/history/conversion/extractOnChainTransactionDetails'

/**
 * Parse LP transaction types from the REST API
 * Handles: Claim, CreatePair, CreatePool, LiquidityIncrease, LiquidityDecrease
 */
export function parseRestLiquidityTransaction(
  transaction: OnChainTransaction,
):
  | LiquidityIncreaseTransactionInfo
  | LiquidityDecreaseTransactionInfo
  | CollectFeesTransactionInfo
  | CreatePairTransactionInfo
  | CreatePoolTransactionInfo
  | UnknownTransactionInfo {
  const { transfers, chainId, label } = transaction
  let direction: Direction | undefined
  switch (label) {
    case OnChainTransactionLabel.INCREASE_LIQUIDITY:
    case OnChainTransactionLabel.CREATE_PAIR:
    case OnChainTransactionLabel.CREATE_POOL:
      direction = Direction.SEND
      break
    case OnChainTransactionLabel.DECREASE_LIQUIDITY:
    case OnChainTransactionLabel.CLAIM:
      direction = Direction.RECEIVE
      break
    default:
      direction = Direction.SEND
      break
  }

  let inputCurrencyId: string | undefined
  let outputCurrencyId: string | undefined
  let inputCurrencyAmountRaw: string | undefined
  let outputCurrencyAmountRaw: string | undefined

  const relevantTransfers = transfers.filter((transfer) => transfer.direction === direction)

  const inputCurrency = extractCurrencyFromTransfer(relevantTransfers[0], chainId)
  if (inputCurrency) {
    inputCurrencyId = inputCurrency.currencyId
    inputCurrencyAmountRaw = inputCurrency.amountRaw
  }

  const outputCurrency = extractCurrencyFromTransfer(relevantTransfers[1], chainId)
  if (outputCurrency) {
    outputCurrencyId = outputCurrency.currencyId
    outputCurrencyAmountRaw = outputCurrency.amountRaw
  }

  const dappInfo = transaction.protocol?.name
    ? {
        name: transaction.protocol.name,
        icon: transaction.protocol.logoUrl,
      }
    : undefined

  return {
    type: getLiquidityTransactionType(label),
    inputCurrencyId,
    outputCurrencyId,
    inputCurrencyAmountRaw,
    outputCurrencyAmountRaw,
    isSpam: false,
    dappInfo,
  }
}

function getLiquidityTransactionType(
  label: OnChainTransactionLabel,
):
  | TransactionType.LiquidityIncrease
  | TransactionType.LiquidityDecrease
  | TransactionType.CollectFees
  | TransactionType.CreatePair
  | TransactionType.CreatePool
  | TransactionType.Unknown {
  switch (label) {
    case OnChainTransactionLabel.INCREASE_LIQUIDITY:
      return TransactionType.LiquidityIncrease
    case OnChainTransactionLabel.DECREASE_LIQUIDITY:
      return TransactionType.LiquidityDecrease
    case OnChainTransactionLabel.CLAIM:
      return TransactionType.CollectFees
    case OnChainTransactionLabel.CREATE_PAIR:
      return TransactionType.CreatePair
    case OnChainTransactionLabel.CREATE_POOL:
      return TransactionType.CreatePool
    default:
      return TransactionType.Unknown
  }
}

function extractCurrencyFromTransfer(
  transfer: Transfer | undefined,
  chainId: number,
): { currencyId: string; amountRaw: string } | null {
  if (transfer?.asset.case === AssetCase.Token) {
    const token = transfer.asset.value
    if (token.address) {
      return {
        currencyId: buildCurrencyId(chainId, token.address),
        amountRaw: transfer.amount?.raw ?? '',
      }
    }
  }
  return null
}
