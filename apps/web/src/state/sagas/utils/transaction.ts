import { BridgeTransactionInfo, SendTransactionInfo, TransactionInfo, TransactionType } from 'state/transactions/types'
import { AssetType } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

import {
  BridgeTransactionInfo as UniswapBridgeTransactionInfo,
  SendTokenTransactionInfo as UniswapSendTokenTransactionInfo,
  TransactionDetails as UniswapTransactionDetails,
  TransactionType as UniswapTransactionType,
  WrapTransactionInfo as UniswapWrapTransactionInfo,
  WrapTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { currencyIdToAddress } from 'uniswap/src/utils/currencyId'

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

function createUniverseBridgeTransaction({
  inputCurrencyId,
  outputCurrencyId,
  inputCurrencyAmountRaw,
  outputCurrencyAmountRaw,
}: BridgeTransactionInfo) {
  return {
    typeInfo: {
      type: UniswapTransactionType.Bridge,
      inputCurrencyId,
      outputCurrencyId,
      inputCurrencyAmountRaw,
      outputCurrencyAmountRaw,
    } satisfies UniswapBridgeTransactionInfo,
  } as UniswapTransactionDetails
}

const createUniverseSendTransaction = (info: SendTransactionInfo) => {
  return {
    typeInfo: {
      type: UniswapTransactionType.Send,
      tokenAddress: currencyIdToAddress(info.currencyId),
      assetType: AssetType.Currency,
      recipient: info.recipient,
    } satisfies UniswapSendTokenTransactionInfo,
  } as UniswapTransactionDetails
}

const createUniverseWrapTransaction = (info: WrapTransactionInfo) => {
  return {
    typeInfo: {
      type: UniswapTransactionType.Wrap,
      unwrapped: info.unwrapped,
      currencyAmountRaw: info.currencyAmountRaw,
    } satisfies UniswapWrapTransactionInfo,
  } as UniswapTransactionDetails
}

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
    case TransactionType.BRIDGE:
      transaction = createUniverseBridgeTransaction(info)
      break
    case TransactionType.SEND:
      transaction = createUniverseSendTransaction(info)
      break
    case UniswapTransactionType.Wrap:
      transaction = createUniverseWrapTransaction(info)
      break
    case UniswapTransactionType.CreatePool:
    case UniswapTransactionType.CreatePair:
    case UniswapTransactionType.LiquidityIncrease:
    case UniswapTransactionType.LiquidityDecrease:
    case TransactionType.MIGRATE_LIQUIDITY_V3_TO_V4:
      transaction = createUniverseSwapTransaction({
        inputCurrencyId: info.currency0Id,
        outputCurrencyId: info.currency1Id,
      })
      break
    case UniswapTransactionType.CollectFees:
      transaction = {
        typeInfo: info,
      } as UniswapTransactionDetails satisfies UniswapTransactionDetails
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
    case TransactionType.LP_INCENTIVES_CLAIM_REWARDS:
    case TransactionType.PERMIT:
      return { ...baseTransaction, ...info } as UniswapTransactionDetails
    default:
      assertUnreachable(info)
  }

  return { ...baseTransaction, ...transaction } satisfies UniswapTransactionDetails
}

function assertUnreachable(x: never): never {
  throw new Error('Unhandled case: ' + x)
}
