import type { TransactionInfo } from 'state/transactions/types'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type {
  TransactionDetails as UniswapTransactionDetails,
  WrapTransactionInfo as UniswapWrapTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'

const createUniverseSwapTransaction = ({
  inputCurrencyId,
  outputCurrencyId,
}: {
  inputCurrencyId: string
  outputCurrencyId: string
}) => {
  return {
    typeInfo: {
      type: TransactionType.Swap,
      inputCurrencyId,
      outputCurrencyId,
    },
  } as UniswapTransactionDetails
}

const createUniverseWrapTransaction = (info: UniswapWrapTransactionInfo) => {
  return {
    typeInfo: {
      type: TransactionType.Wrap,
      unwrapped: info.unwrapped,
      currencyAmountRaw: info.currencyAmountRaw,
    } satisfies UniswapWrapTransactionInfo,
  } as UniswapTransactionDetails
}

const createUniverseTransactionFromInfo = (typeInfo: TransactionInfo): UniswapTransactionDetails =>
  ({ typeInfo }) as UniswapTransactionDetails

// Maps a web transaction object to a universe transaction object if we can.
// Currently web and universe transaction types are similar but still different.
// Eventually we should align these types across platforms to avoid this mapping.
// If a new transaction type is added to web try to map it to a universe transaction type.
// Some transactions (like APPROVAL) only update the native token balance and don't need to be mapped.
// TODO(WEB-5565): Align web and universe transaction types
export const createUniverseTransaction = ({
  info,
  chainId,
  address,
}: {
  info: TransactionInfo
  chainId: UniverseChainId
  address: string
}) => {
  const baseTransaction: Partial<UniswapTransactionDetails> = {
    chainId,
    from: address,
  }

  let transaction: UniswapTransactionDetails | undefined

  switch (info.type) {
    case TransactionType.Swap:
      transaction = createUniverseSwapTransaction(info)
      break
    case TransactionType.Bridge:
      transaction = createUniverseTransactionFromInfo(info)
      break
    case TransactionType.Send:
      transaction = createUniverseTransactionFromInfo(info)
      break
    case TransactionType.Wrap:
      transaction = createUniverseWrapTransaction(info)
      break
    case TransactionType.CreatePool:
    case TransactionType.CreatePair:
    case TransactionType.LiquidityIncrease:
    case TransactionType.LiquidityDecrease:
    case TransactionType.MigrateLiquidityV3ToV4:
      transaction = createUniverseSwapTransaction({
        inputCurrencyId: info.currency0Id,
        outputCurrencyId: info.currency1Id,
      })
      break
    case TransactionType.CollectFees:
      transaction = createUniverseTransactionFromInfo(info)
      break
    case TransactionType.MigrateLiquidityV2ToV3:
      transaction = createUniverseSwapTransaction({
        inputCurrencyId: info.baseCurrencyId,
        outputCurrencyId: info.quoteCurrencyId,
      })
      break
    // Native token spend cases which are already handled in the refetchGQLQueries saga
    case TransactionType.Approve:
    case TransactionType.ClaimUni:
    case TransactionType.LPIncentivesClaimRewards:
    case TransactionType.Permit2Approve:
      return { ...baseTransaction, ...info } as UniswapTransactionDetails
    // NFT and other transaction types that don't need special mapping
    case TransactionType.Receive:
    case TransactionType.NFTTrade:
    case TransactionType.NFTApprove:
    case TransactionType.NFTMint:
    case TransactionType.WCConfirm:
    case TransactionType.Unknown:
    case TransactionType.OnRampPurchase:
    case TransactionType.OnRampTransfer:
    case TransactionType.OffRampSale:
    case TransactionType.LocalOnRamp:
    case TransactionType.LocalOffRamp:
    case TransactionType.SendCalls:
    case TransactionType.RemoveDelegation:
      return { ...baseTransaction, ...info } as UniswapTransactionDetails
    default:
      assertUnreachable(info)
  }

  return { ...baseTransaction, ...transaction } satisfies UniswapTransactionDetails
}

function assertUnreachable(x: never): never {
  throw new Error('Unhandled case: ' + x)
}
