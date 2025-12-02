import {
  Direction,
  OnChainTransaction,
  OnChainTransactionLabel,
  Transfer,
} from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { extractDappInfo } from 'uniswap/src/features/activity/utils/extractDappInfo'
import { AssetCase } from 'uniswap/src/features/activity/utils/remote'
import {
  CollectFeesTransactionInfo,
  CreatePairTransactionInfo,
  CreatePoolTransactionInfo,
  LiquidityDecreaseTransactionInfo,
  LiquidityIncreaseTransactionInfo,
  LpIncentivesClaimTransactionInfo,
  TransactionType,
  UnknownTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

/**
 * Parse LP transaction types from the REST API
 * Handles: Claim, CreatePair, CreatePool, LiquidityIncrease, LiquidityDecrease, LPIncentivesClaim
 */
export function parseRestLiquidityTransaction(
  transaction: OnChainTransaction,
):
  | LiquidityIncreaseTransactionInfo
  | LiquidityDecreaseTransactionInfo
  | CollectFeesTransactionInfo
  | CreatePairTransactionInfo
  | CreatePoolTransactionInfo
  | LpIncentivesClaimTransactionInfo
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

  let currency0Id: string | undefined
  let currency1Id: string | undefined
  let currency0AmountRaw: string | undefined
  let currency1AmountRaw: string | undefined

  const relevantTransfers = transfers.filter((transfer) => transfer.direction === direction)

  const currency0 = extractCurrencyFromTransfer(relevantTransfers[0], chainId)
  if (currency0) {
    currency0Id = currency0.currencyId
    currency0AmountRaw = currency0.amountRaw
  }

  const currency1 = extractCurrencyFromTransfer(relevantTransfers[1], chainId)
  if (currency1) {
    currency1Id = currency1.currencyId
    currency1AmountRaw = currency1.amountRaw
  }

  const dappInfo = extractDappInfo(transaction)

  if (label === OnChainTransactionLabel.CLAIM && currency0Id && currency0AmountRaw) {
    // handle claim liquidity transaction
    return {
      type: TransactionType.CollectFees,
      currency0Id,
      currency0AmountRaw,
      isSpam: false,
      dappInfo,
    }
  } else if (currency0Id && currency1Id && currency0AmountRaw && currency1AmountRaw) {
    // return a liquidity transaction if all fields are defined
    return {
      type: getLiquidityTransactionType(label),
      isSpam: false,
      dappInfo,
      currency0Id,
      currency1Id,
      currency0AmountRaw,
      currency1AmountRaw,
    }
  } else {
    // return unknown transaction info if all liquidity fields are not defined
    return {
      type: TransactionType.Unknown,
      isSpam: false,
      dappInfo,
    }
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
