import { t } from '@lingui/macro'
import { formatCurrencyAmount } from '@uniswap/conedison/format'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { nativeOnChain } from '@uniswap/smart-order-router'
import { SupportedChainId } from 'constants/chains'
import { TransactionPartsFragment, TransactionStatus } from 'graphql/data/__generated__/types-and-hooks'
import { useMemo } from 'react'
import { TokenAddressMap, useCombinedActiveList } from 'state/lists/hooks'
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

import { getActivityTitle } from '../constants'
import { Activity, ActivityMap } from './types'

function getCurrency(currencyId: string, chainId: SupportedChainId, tokens: TokenAddressMap): Currency | undefined {
  return currencyId === 'ETH' ? nativeOnChain(chainId) : tokens[chainId]?.[currencyId]?.token
}

function buildCurrencyDescriptor(
  currencyA: Currency | undefined,
  amtA: string,
  currencyB: Currency | undefined,
  amtB: string,
  delimiter = t`for`
) {
  const formattedA = currencyA ? formatCurrencyAmount(CurrencyAmount.fromRawAmount(currencyA, amtA)) : t`Unknown`
  const symbolA = currencyA?.symbol ?? ''
  const formattedB = currencyB ? formatCurrencyAmount(CurrencyAmount.fromRawAmount(currencyB, amtB)) : t`Unknown`
  const symbolB = currencyB?.symbol ?? ''
  return [formattedA, symbolA, delimiter, formattedB, symbolB].filter(Boolean).join(' ')
}

function parseSwap(
  swap: ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo,
  chainId: SupportedChainId,
  tokens: TokenAddressMap
): Partial<Activity> {
  const tokenIn = getCurrency(swap.inputCurrencyId, chainId, tokens)
  const tokenOut = getCurrency(swap.outputCurrencyId, chainId, tokens)
  const [inputRaw, outputRaw] =
    swap.tradeType === TradeType.EXACT_INPUT
      ? [swap.inputCurrencyAmountRaw, swap.expectedOutputCurrencyAmountRaw]
      : [swap.expectedInputCurrencyAmountRaw, swap.outputCurrencyAmountRaw]

  return {
    descriptor: buildCurrencyDescriptor(tokenIn, inputRaw, tokenOut, outputRaw),
    currencies: [tokenIn, tokenOut],
  }
}

function parseWrap(wrap: WrapTransactionInfo, chainId: SupportedChainId, status: TransactionStatus): Partial<Activity> {
  const native = nativeOnChain(chainId)
  const wrapped = native.wrapped
  const [input, output] = wrap.unwrapped ? [wrapped, native] : [native, wrapped]

  const descriptor = buildCurrencyDescriptor(input, wrap.currencyAmountRaw, output, wrap.currencyAmountRaw)
  const title = getActivityTitle(TransactionType.WRAP, status, wrap.unwrapped)
  const currencies = wrap.unwrapped ? [wrapped, native] : [native, wrapped]

  return { title, descriptor, currencies }
}

function parseApproval(
  approval: ApproveTransactionInfo,
  chainId: SupportedChainId,
  tokens: TokenAddressMap
): Partial<Activity> {
  // TODO: Add 'amount' approved to ApproveTransactionInfo so we can distinguish between revoke and approve
  const currency = getCurrency(approval.tokenAddress, chainId, tokens)
  const descriptor = currency?.symbol ?? currency?.name ?? t`Unknown`
  return {
    descriptor,
    currencies: [currency],
  }
}

type GenericLPInfo = Omit<
  AddLiquidityV3PoolTransactionInfo | RemoveLiquidityV3TransactionInfo | AddLiquidityV2PoolTransactionInfo,
  'type'
>
function parseLP(lp: GenericLPInfo, chainId: SupportedChainId, tokens: TokenAddressMap): Partial<Activity> {
  const baseCurrency = getCurrency(lp.baseCurrencyId, chainId, tokens)
  const quoteCurrency = getCurrency(lp.quoteCurrencyId, chainId, tokens)
  const [baseRaw, quoteRaw] = [lp.expectedAmountBaseRaw, lp.expectedAmountQuoteRaw]
  const descriptor = buildCurrencyDescriptor(baseCurrency, baseRaw, quoteCurrency, quoteRaw, t`and`)

  return { descriptor, currencies: [baseCurrency, quoteCurrency] }
}

function parseCollectFees(
  collect: CollectFeesTransactionInfo,
  chainId: SupportedChainId,
  tokens: TokenAddressMap
): Partial<Activity> {
  // Adapts CollectFeesTransactionInfo to generic LP type
  const {
    currencyId0: baseCurrencyId,
    currencyId1: quoteCurrencyId,
    expectedCurrencyOwed0: expectedAmountBaseRaw,
    expectedCurrencyOwed1: expectedAmountQuoteRaw,
  } = collect
  return parseLP({ baseCurrencyId, quoteCurrencyId, expectedAmountBaseRaw, expectedAmountQuoteRaw }, chainId, tokens)
}

function parseMigrateCreateV3(
  lp: MigrateV2LiquidityToV3TransactionInfo | CreateV3PoolTransactionInfo,
  chainId: SupportedChainId,
  tokens: TokenAddressMap
): Partial<Activity> {
  const baseCurrency = getCurrency(lp.baseCurrencyId, chainId, tokens)
  const baseSymbol = baseCurrency?.symbol ?? t`Unknown`
  const quoteCurrency = getCurrency(lp.baseCurrencyId, chainId, tokens)
  const quoteSymbol = quoteCurrency?.symbol ?? t`Unknown`
  const descriptor = t`${baseSymbol} and ${quoteSymbol}`

  return { descriptor, currencies: [baseCurrency, quoteCurrency] }
}

export function parseLocalActivity(
  details: TransactionDetails,
  chainId: SupportedChainId,
  tokens: TokenAddressMap
): Activity | undefined {
  try {
    const status = !details.receipt
      ? TransactionStatus.Pending
      : details.receipt.status === 1 || details.receipt?.status === undefined
      ? TransactionStatus.Confirmed
      : TransactionStatus.Failed

    const receipt: TransactionPartsFragment | undefined = details.receipt
      ? {
          id: details.receipt.transactionHash,
          ...details.receipt,
          ...details,
          status,
        }
      : undefined

    const defaultFields = {
      hash: details.hash,
      chainId,
      title: getActivityTitle(details.info.type, status),
      status,
      timestamp: (details.confirmedTime ?? details.addedTime) / 1000,
      receipt,
    }

    let additionalFields: Partial<Activity> = {}
    const info = details.info
    if (info.type === TransactionType.SWAP) {
      additionalFields = parseSwap(info, chainId, tokens)
    } else if (info.type === TransactionType.APPROVAL) {
      additionalFields = parseApproval(info, chainId, tokens)
    } else if (info.type === TransactionType.WRAP) {
      additionalFields = parseWrap(info, chainId, status)
    } else if (
      info.type === TransactionType.ADD_LIQUIDITY_V3_POOL ||
      info.type === TransactionType.REMOVE_LIQUIDITY_V3 ||
      info.type === TransactionType.ADD_LIQUIDITY_V2_POOL
    ) {
      additionalFields = parseLP(info, chainId, tokens)
    } else if (info.type === TransactionType.COLLECT_FEES) {
      additionalFields = parseCollectFees(info, chainId, tokens)
    } else if (info.type === TransactionType.MIGRATE_LIQUIDITY_V3 || info.type === TransactionType.CREATE_V3_POOL) {
      additionalFields = parseMigrateCreateV3(info, chainId, tokens)
    }

    return { ...defaultFields, ...additionalFields }
  } catch (error) {
    console.debug(`Failed to parse transaction ${details.hash}`, error)
    return undefined
  }
}

export function useLocalActivities(account: string): ActivityMap {
  const allTransactions = useMultichainTransactions()
  const tokens = useCombinedActiveList()

  return useMemo(() => {
    const activityByHash: ActivityMap = {}
    for (const [transaction, chainId] of allTransactions) {
      if (transaction.from !== account) continue

      activityByHash[transaction.hash] = parseLocalActivity(transaction, chainId, tokens)
    }
    return activityByHash
  }, [account, allTransactions, tokens])
}
