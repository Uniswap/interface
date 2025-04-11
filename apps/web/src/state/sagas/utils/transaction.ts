import {
  BridgeTransactionInfo,
  SendTransactionInfo,
  TransactionInfo,
  TransactionType,
  WrapTransactionInfo,
} from 'state/transactions/types'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { AssetType } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

import {
  BridgeTransactionInfo as UniswapBridgeTransactionInfo,
  SendTokenTransactionInfo as UniswapSendTokenTransactionInfo,
  TransactionDetails as UniswapTransactionDetails,
  TransactionType as UniswapTransactionType,
  WrapTransactionInfo as UniswapWrapTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'

const createUniverseSwapTransaction = (
  info: {
    inputCurrencyId: string
    outputCurrencyId: string
  },
  chainId: UniverseChainId,
) => {
  const inputCurrencyId = info.inputCurrencyId === 'ETH' ? null : buildCurrencyId(chainId, info.inputCurrencyId)
  const outputCurrencyId = info.outputCurrencyId === 'ETH' ? null : buildCurrencyId(chainId, info.outputCurrencyId)
  const nativeCurrencyId = buildNativeCurrencyId(chainId)

  return {
    typeInfo: {
      type: UniswapTransactionType.Swap,
      inputCurrencyId: inputCurrencyId ?? nativeCurrencyId,
      outputCurrencyId: outputCurrencyId ?? nativeCurrencyId,
    },
  } as UniswapTransactionDetails
}

const createUniverseBridgeTransaction = (
  info: BridgeTransactionInfo,
  inputChainId: UniverseChainId,
  outputChainId: UniverseChainId,
) => {
  const inputCurrencyId = info.inputCurrencyId === 'ETH' ? null : buildCurrencyId(inputChainId, info.inputCurrencyId)
  const outputCurrencyId =
    info.outputCurrencyId === 'ETH' ? null : buildCurrencyId(outputChainId, info.outputCurrencyId)
  const inputNativeCurrencyId = buildNativeCurrencyId(inputChainId)
  const outputNativeCurrencyId = buildNativeCurrencyId(outputChainId)

  return {
    typeInfo: {
      type: UniswapTransactionType.Bridge,
      inputCurrencyId: inputCurrencyId ?? inputNativeCurrencyId,
      outputCurrencyId: outputCurrencyId ?? outputNativeCurrencyId,
      inputCurrencyAmountRaw: info.inputCurrencyAmountRaw,
      outputCurrencyAmountRaw: info.outputCurrencyAmountRaw,
    } satisfies UniswapBridgeTransactionInfo,
  } as UniswapTransactionDetails
}

const createUniverseSendTransaction = (info: SendTransactionInfo, chainId: UniverseChainId) => {
  return {
    typeInfo: {
      type: UniswapTransactionType.Send,
      tokenAddress: info.currencyId === 'ETH' ? getNativeAddress(chainId) : info.currencyId,
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
export const createUniverseTransaction = (info: TransactionInfo, chainId: UniverseChainId, address: string) => {
  const baseTransaction: Partial<UniswapTransactionDetails> = {
    chainId,
    from: address,
  }

  let transaction: UniswapTransactionDetails | undefined

  switch (info.type) {
    case TransactionType.SWAP:
      transaction = createUniverseSwapTransaction(info, chainId)
      break
    case TransactionType.BRIDGE:
      transaction = createUniverseBridgeTransaction(info, info.inputChainId, info.outputChainId)
      break
    case TransactionType.SEND:
      transaction = createUniverseSendTransaction(info, chainId)
      break
    case TransactionType.WRAP:
      transaction = createUniverseWrapTransaction(info)
      break
    case TransactionType.CREATE_POSITION:
    case TransactionType.INCREASE_LIQUIDITY:
    case TransactionType.DECREASE_LIQUIDITY:
    case TransactionType.MIGRATE_LIQUIDITY_V3_TO_V4:
    case TransactionType.COLLECT_FEES:
      transaction = createUniverseSwapTransaction(
        {
          inputCurrencyId: info.token0CurrencyId,
          outputCurrencyId: info.token1CurrencyId,
        },
        chainId,
      )
      break
    case TransactionType.MIGRATE_LIQUIDITY_V2_TO_V3:
      transaction = createUniverseSwapTransaction(
        {
          inputCurrencyId: info.baseCurrencyId,
          outputCurrencyId: info.quoteCurrencyId,
        },
        chainId,
      )
      break
    // Some of these transaction types are soon to be deprecated
    // others (like APPROVAL) are just a native token spend
    // which is already handled in the refetchGQLQueries saga.
    case TransactionType.APPROVAL:
    case TransactionType.DEPOSIT_LIQUIDITY_STAKING:
    case TransactionType.WITHDRAW_LIQUIDITY_STAKING:
    case TransactionType.CLAIM:
    case TransactionType.CREATE_V3_POOL:
    case TransactionType.ADD_LIQUIDITY_V3_POOL:
    case TransactionType.REMOVE_LIQUIDITY_V3:
    case TransactionType.ADD_LIQUIDITY_V2_POOL:
    case TransactionType.SUBMIT_PROPOSAL:
      return { ...baseTransaction, ...info } as UniswapTransactionDetails
    default:
      assertUnreachable(info)
  }

  return { ...baseTransaction, ...transaction } satisfies UniswapTransactionDetails
}

function assertUnreachable(x: never): never {
  throw new Error('Unhandled case: ' + x)
}
