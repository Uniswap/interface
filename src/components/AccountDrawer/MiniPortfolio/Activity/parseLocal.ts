import { BigNumber } from '@ethersproject/bignumber'
import { t } from '@lingui/macro'
import { ChainId, Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import UniswapXBolt from 'assets/svg/bolt.svg'
import { nativeOnChain } from 'constants/tokens'
import { TransactionStatus } from 'graphql/data/__generated__/types-and-hooks'
import { ChainTokenMap, useAllTokensMultichain } from 'hooks/Tokens'
import { useMemo } from 'react'
import { isOnChainOrder, useAllSignatures } from 'state/signatures/hooks'
import { SignatureDetails, SignatureType } from 'state/signatures/types'
import { useMultichainTransactions } from 'state/transactions/hooks'
import {
  AddLiquidityV2PoolTransactionInfo,
  AddLiquidityV3PoolTransactionInfo,
  ApproveTransactionInfo,
  CollectFeesTransactionInfo,
  CreateV3PoolTransactionInfo,
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  MigrateV2LiquidityToV3TransactionInfo,
  RemoveLiquidityV3TransactionInfo,
  TransactionDetails,
  TransactionType,
  WrapTransactionInfo,
} from 'state/transactions/types'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { CancelledTransactionTitleTable, getActivityTitle, OrderTextTable } from '../constants'
import { Activity, ActivityMap } from './types'

type FormatNumberFunctionType = ReturnType<typeof useFormatter>['formatNumber']

function getCurrency(currencyId: string, chainId: ChainId, tokens: ChainTokenMap): Currency | undefined {
  return currencyId === 'ETH' ? nativeOnChain(chainId) : tokens[chainId]?.[currencyId]
}

function buildCurrencyDescriptor(
  currencyA: Currency | undefined,
  amtA: string,
  currencyB: Currency | undefined,
  amtB: string,
  formatNumber: FormatNumberFunctionType,
  delimiter = t`for`
) {
  const formattedA = currencyA
    ? formatNumber({
        input: parseFloat(CurrencyAmount.fromRawAmount(currencyA, amtA).toSignificant()),
        type: NumberType.TokenNonTx,
      })
    : t`Unknown`
  const symbolA = currencyA?.symbol ?? ''
  const formattedB = currencyB
    ? formatNumber({
        input: parseFloat(CurrencyAmount.fromRawAmount(currencyB, amtB).toSignificant()),
        type: NumberType.TokenNonTx,
      })
    : t`Unknown`
  const symbolB = currencyB?.symbol ?? ''
  return [formattedA, symbolA, delimiter, formattedB, symbolB].filter(Boolean).join(' ')
}

function parseSwap(
  swap: ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo,
  chainId: ChainId,
  tokens: ChainTokenMap,
  formatNumber: FormatNumberFunctionType
): Partial<Activity> {
  const tokenIn = getCurrency(swap.inputCurrencyId, chainId, tokens)
  const tokenOut = getCurrency(swap.outputCurrencyId, chainId, tokens)
  const [inputRaw, outputRaw] =
    swap.tradeType === TradeType.EXACT_INPUT
      ? [swap.inputCurrencyAmountRaw, swap.settledOutputCurrencyAmountRaw ?? swap.expectedOutputCurrencyAmountRaw]
      : [swap.expectedInputCurrencyAmountRaw, swap.outputCurrencyAmountRaw]

  return {
    descriptor: buildCurrencyDescriptor(tokenIn, inputRaw, tokenOut, outputRaw, formatNumber, undefined),
    currencies: [tokenIn, tokenOut],
    prefixIconSrc: swap.isUniswapXOrder ? UniswapXBolt : undefined,
  }
}

function parseWrap(
  wrap: WrapTransactionInfo,
  chainId: ChainId,
  status: TransactionStatus,
  formatNumber: FormatNumberFunctionType
): Partial<Activity> {
  const native = nativeOnChain(chainId)
  const wrapped = native.wrapped
  const [input, output] = wrap.unwrapped ? [wrapped, native] : [native, wrapped]

  const descriptor = buildCurrencyDescriptor(
    input,
    wrap.currencyAmountRaw,
    output,
    wrap.currencyAmountRaw,
    formatNumber
  )
  const title = getActivityTitle(TransactionType.WRAP, status, wrap.unwrapped)
  const currencies = wrap.unwrapped ? [wrapped, native] : [native, wrapped]

  return { title, descriptor, currencies }
}

function parseApproval(
  approval: ApproveTransactionInfo,
  chainId: ChainId,
  tokens: ChainTokenMap,
  status: TransactionStatus
): Partial<Activity> {
  const currency = getCurrency(approval.tokenAddress, chainId, tokens)
  const descriptor = currency?.symbol ?? currency?.name ?? t`Unknown`
  return {
    title: getActivityTitle(
      TransactionType.APPROVAL,
      status,
      BigNumber.from(approval.amount).eq(0) /* use alternate if it's a revoke */
    ),
    descriptor,
    currencies: [currency],
  }
}

type GenericLPInfo = Omit<
  AddLiquidityV3PoolTransactionInfo | RemoveLiquidityV3TransactionInfo | AddLiquidityV2PoolTransactionInfo,
  'type'
>
function parseLP(
  lp: GenericLPInfo,
  chainId: ChainId,
  tokens: ChainTokenMap,
  formatNumber: FormatNumberFunctionType
): Partial<Activity> {
  const baseCurrency = getCurrency(lp.baseCurrencyId, chainId, tokens)
  const quoteCurrency = getCurrency(lp.quoteCurrencyId, chainId, tokens)
  const [baseRaw, quoteRaw] = [lp.expectedAmountBaseRaw, lp.expectedAmountQuoteRaw]
  const descriptor = buildCurrencyDescriptor(baseCurrency, baseRaw, quoteCurrency, quoteRaw, formatNumber, t`and`)

  return { descriptor, currencies: [baseCurrency, quoteCurrency] }
}

function parseCollectFees(
  collect: CollectFeesTransactionInfo,
  chainId: ChainId,
  tokens: ChainTokenMap,
  formatNumber: FormatNumberFunctionType
): Partial<Activity> {
  // Adapts CollectFeesTransactionInfo to generic LP type
  const {
    currencyId0: baseCurrencyId,
    currencyId1: quoteCurrencyId,
    expectedCurrencyOwed0: expectedAmountBaseRaw,
    expectedCurrencyOwed1: expectedAmountQuoteRaw,
  } = collect
  return parseLP(
    { baseCurrencyId, quoteCurrencyId, expectedAmountBaseRaw, expectedAmountQuoteRaw },
    chainId,
    tokens,
    formatNumber
  )
}

function parseMigrateCreateV3(
  lp: MigrateV2LiquidityToV3TransactionInfo | CreateV3PoolTransactionInfo,
  chainId: ChainId,
  tokens: ChainTokenMap
): Partial<Activity> {
  const baseCurrency = getCurrency(lp.baseCurrencyId, chainId, tokens)
  const baseSymbol = baseCurrency?.symbol ?? t`Unknown`
  const quoteCurrency = getCurrency(lp.quoteCurrencyId, chainId, tokens)
  const quoteSymbol = quoteCurrency?.symbol ?? t`Unknown`
  const descriptor = t`${baseSymbol} and ${quoteSymbol}`

  return { descriptor, currencies: [baseCurrency, quoteCurrency] }
}

export function getTransactionStatus(details: TransactionDetails): TransactionStatus {
  return !details.receipt
    ? TransactionStatus.Pending
    : details.receipt.status === 1 || details.receipt?.status === undefined
    ? TransactionStatus.Confirmed
    : TransactionStatus.Failed
}

export function transactionToActivity(
  details: TransactionDetails,
  chainId: ChainId,
  tokens: ChainTokenMap,
  formatNumber: FormatNumberFunctionType
): Activity | undefined {
  try {
    const status = getTransactionStatus(details)

    const defaultFields = {
      hash: details.hash,
      chainId,
      title: getActivityTitle(details.info.type, status),
      status,
      timestamp: (details.confirmedTime ?? details.addedTime) / 1000,
      from: details.from,
      nonce: details.nonce,
      cancelled: details.cancelled,
    }

    let additionalFields: Partial<Activity> = {}
    const info = details.info
    if (info.type === TransactionType.SWAP) {
      additionalFields = parseSwap(info, chainId, tokens, formatNumber)
    } else if (info.type === TransactionType.APPROVAL) {
      additionalFields = parseApproval(info, chainId, tokens, status)
    } else if (info.type === TransactionType.WRAP) {
      additionalFields = parseWrap(info, chainId, status, formatNumber)
    } else if (
      info.type === TransactionType.ADD_LIQUIDITY_V3_POOL ||
      info.type === TransactionType.REMOVE_LIQUIDITY_V3 ||
      info.type === TransactionType.ADD_LIQUIDITY_V2_POOL
    ) {
      additionalFields = parseLP(info, chainId, tokens, formatNumber)
    } else if (info.type === TransactionType.COLLECT_FEES) {
      additionalFields = parseCollectFees(info, chainId, tokens, formatNumber)
    } else if (info.type === TransactionType.MIGRATE_LIQUIDITY_V3 || info.type === TransactionType.CREATE_V3_POOL) {
      additionalFields = parseMigrateCreateV3(info, chainId, tokens)
    }

    const activity = { ...defaultFields, ...additionalFields }

    if (details.cancelled) {
      activity.title = CancelledTransactionTitleTable[details.info.type]
      activity.status = TransactionStatus.Confirmed
    }

    return activity
  } catch (error) {
    console.debug(`Failed to parse transaction ${details.hash}`, error)
    return undefined
  }
}

export function signatureToActivity(
  signature: SignatureDetails,
  tokens: ChainTokenMap,
  formatNumber: FormatNumberFunctionType
): Activity | undefined {
  switch (signature.type) {
    case SignatureType.SIGN_UNISWAPX_ORDER: {
      // Only returns Activity items for orders that don't have an on-chain counterpart
      if (isOnChainOrder(signature.status)) return undefined

      const { title, statusMessage, status } = OrderTextTable[signature.status]

      return {
        hash: signature.orderHash,
        chainId: signature.chainId,
        title,
        status,
        offchainOrderStatus: signature.status,
        timestamp: signature.addedTime / 1000,
        from: signature.offerer,
        statusMessage,
        prefixIconSrc: UniswapXBolt,
        ...parseSwap(signature.swapInfo, signature.chainId, tokens, formatNumber),
      }
    }
    default:
      return undefined
  }
}

export function useLocalActivities(account: string): ActivityMap {
  const allTransactions = useMultichainTransactions()
  const allSignatures = useAllSignatures()
  const tokens = useAllTokensMultichain()
  const { formatNumber } = useFormatter()

  return useMemo(() => {
    const activityMap: ActivityMap = {}
    for (const [transaction, chainId] of allTransactions) {
      if (transaction.from !== account) continue

      const activity = transactionToActivity(transaction, chainId, tokens, formatNumber)
      if (activity) activityMap[transaction.hash] = activity
    }

    for (const signature of Object.values(allSignatures)) {
      if (signature.offerer !== account) continue

      const activity = signatureToActivity(signature, tokens, formatNumber)
      if (activity) activityMap[signature.id] = activity
    }

    return activityMap
  }, [account, allSignatures, allTransactions, formatNumber, tokens])
}
