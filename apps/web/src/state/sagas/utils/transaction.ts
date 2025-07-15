import type { TransactionInfo } from 'state/transactions/types'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type {
  TransactionDetails as UniswapTransactionDetails,
  WrapTransactionInfo as UniswapWrapTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionType as UniswapTransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'

const createUniverseSwapTransaction = ({
  inputCurrencyId,
  outputCurrencyId,
}: {
  inputCurrencyId: string
  outputCurrencyId: string
}) => {
  return {
    typeInfo: {
      type: UniswapTransactionType.Swap,
      inputCurrencyId,
      outputCurrencyId,
    },
  } as UniswapTransactionDetails
}

const createUniverseWrapTransaction = (info: UniswapWrapTransactionInfo) => {
  return {
    typeInfo: {
      type: UniswapTransactionType.Wrap,
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
    case UniswapTransactionType.Swap:
      transaction = createUniverseSwapTransaction(info)
      break
    case UniswapTransactionType.Bridge:
      transaction = createUniverseTransactionFromInfo(info)
      break
    case UniswapTransactionType.Send:
      transaction = createUniverseTransactionFromInfo(info)
      break
    case UniswapTransactionType.Wrap:
      transaction = createUniverseWrapTransaction(info)
      break
    case UniswapTransactionType.CreatePool:
    case UniswapTransactionType.CreatePair:
    case UniswapTransactionType.LiquidityIncrease:
    case UniswapTransactionType.LiquidityDecrease:
    case UniswapTransactionType.MigrateLiquidityV3ToV4:
      transaction = createUniverseSwapTransaction({
        inputCurrencyId: info.currency0Id,
        outputCurrencyId: info.currency1Id,
      })
      break
    case UniswapTransactionType.CollectFees:
      transaction = createUniverseTransactionFromInfo(info)
      break
    case UniswapTransactionType.MigrateLiquidityV2ToV3:
      transaction = createUniverseSwapTransaction({
        inputCurrencyId: info.baseCurrencyId,
        outputCurrencyId: info.quoteCurrencyId,
      })
      break
    // Native token spend cases which are already handled in the refetchGQLQueries saga
    case UniswapTransactionType.Approve:
    case UniswapTransactionType.ClaimUni:
    case UniswapTransactionType.LPIncentivesClaimRewards:
    case UniswapTransactionType.Permit2Approve:
      return { ...baseTransaction, ...info } as UniswapTransactionDetails
    default:
      assertUnreachable(info)
  }

  return { ...baseTransaction, ...transaction } satisfies UniswapTransactionDetails
}

function assertUnreachable(x: never): never {
  throw new Error('Unhandled case: ' + x)
}
