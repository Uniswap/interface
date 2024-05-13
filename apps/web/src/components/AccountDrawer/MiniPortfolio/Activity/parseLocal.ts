import { BigNumber } from '@ethersproject/bignumber'
import { ChainId, Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import UniswapXBolt from 'assets/svg/bolt.svg'
import { nativeOnChain } from 'constants/tokens'
import { t } from 'i18n'
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
  SendTransactionInfo,
  TransactionDetails,
  TransactionType,
  WrapTransactionInfo,
} from 'state/transactions/types'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { isAddress } from 'utilities/src/addresses'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { queryOptions, useQuery } from '@tanstack/react-query'
import { getCurrency } from 'components/AccountDrawer/MiniPortfolio/Activity/getCurrency'
import { SupportedInterfaceChainId } from 'constants/chains'
import { CancelledTransactionTitleTable, LimitOrderTextTable, OrderTextTable, getActivityTitle } from '../constants'
import { Activity, ActivityMap } from './types'

type FormatNumberFunctionType = ReturnType<typeof useFormatter>['formatNumber']

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

async function parseSwap(
  swap: ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo,
  chainId: SupportedInterfaceChainId,
  formatNumber: FormatNumberFunctionType
): Promise<Partial<Activity>> {
  const [tokenIn, tokenOut] = await Promise.all([
    getCurrency(swap.inputCurrencyId, chainId),
    getCurrency(swap.outputCurrencyId, chainId),
  ])
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

async function parseApproval(
  approval: ApproveTransactionInfo,
  chainId: SupportedInterfaceChainId,
  status: TransactionStatus
): Promise<Partial<Activity>> {
  const currency = await getCurrency(approval.tokenAddress, chainId)
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
async function parseLP(
  lp: GenericLPInfo,
  chainId: SupportedInterfaceChainId,
  formatNumber: FormatNumberFunctionType
): Promise<Partial<Activity>> {
  const [baseCurrency, quoteCurrency] = await Promise.all([
    getCurrency(lp.baseCurrencyId, chainId),
    getCurrency(lp.quoteCurrencyId, chainId),
  ])
  const [baseRaw, quoteRaw] = [lp.expectedAmountBaseRaw, lp.expectedAmountQuoteRaw]
  const descriptor = buildCurrencyDescriptor(baseCurrency, baseRaw, quoteCurrency, quoteRaw, formatNumber, t`and`)

  return { descriptor, currencies: [baseCurrency, quoteCurrency] }
}

async function parseCollectFees(
  collect: CollectFeesTransactionInfo,
  chainId: SupportedInterfaceChainId,
  formatNumber: FormatNumberFunctionType
): Promise<Partial<Activity>> {
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
    formatNumber
  )
}

async function parseMigrateCreateV3(
  lp: MigrateV2LiquidityToV3TransactionInfo | CreateV3PoolTransactionInfo,
  chainId: SupportedInterfaceChainId
): Promise<Partial<Activity>> {
  const [baseCurrency, quoteCurrency] = await Promise.all([
    getCurrency(lp.baseCurrencyId, chainId),
    getCurrency(lp.quoteCurrencyId, chainId),
  ])
  const baseSymbol = baseCurrency?.symbol ?? t`Unknown`
  const quoteSymbol = quoteCurrency?.symbol ?? t`Unknown`
  const descriptor = t(`{{baseSymbol}} and {{quoteSymbol}}`, { baseSymbol, quoteSymbol })

  return { descriptor, currencies: [baseCurrency, quoteCurrency] }
}

async function parseSend(
  send: SendTransactionInfo,
  chainId: SupportedInterfaceChainId,
  formatNumber: FormatNumberFunctionType
): Promise<Partial<Activity>> {
  const { currencyId, amount, recipient } = send
  const currency = await getCurrency(currencyId, chainId)
  const formattedAmount = currency
    ? formatNumber({
        input: parseFloat(CurrencyAmount.fromRawAmount(currency, amount).toSignificant()),
        type: NumberType.TokenNonTx,
      })
    : t`Unknown`

  return {
    descriptor: `${formattedAmount} ${currency?.symbol} ${t`to`} `,
    otherAccount: isAddress(recipient) || undefined,
    currencies: [currency],
  }
}

export function getTransactionStatus(details: TransactionDetails): TransactionStatus {
  return !details.receipt
    ? TransactionStatus.Pending
    : details.receipt.status === 1 || details.receipt?.status === undefined
    ? TransactionStatus.Confirmed
    : TransactionStatus.Failed
}

export async function transactionToActivity(
  details: TransactionDetails | undefined,
  chainId: SupportedInterfaceChainId,
  formatNumber: FormatNumberFunctionType
): Promise<Activity | undefined> {
  if (!details) return undefined
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
      additionalFields = await parseSwap(info, chainId, formatNumber)
    } else if (info.type === TransactionType.APPROVAL) {
      additionalFields = await parseApproval(info, chainId, status)
    } else if (info.type === TransactionType.WRAP) {
      additionalFields = parseWrap(info, chainId, status, formatNumber)
    } else if (
      info.type === TransactionType.ADD_LIQUIDITY_V3_POOL ||
      info.type === TransactionType.REMOVE_LIQUIDITY_V3 ||
      info.type === TransactionType.ADD_LIQUIDITY_V2_POOL
    ) {
      additionalFields = await parseLP(info, chainId, formatNumber)
    } else if (info.type === TransactionType.COLLECT_FEES) {
      additionalFields = await parseCollectFees(info, chainId, formatNumber)
    } else if (info.type === TransactionType.MIGRATE_LIQUIDITY_V3 || info.type === TransactionType.CREATE_V3_POOL) {
      additionalFields = await parseMigrateCreateV3(info, chainId)
    } else if (info.type === TransactionType.SEND) {
      additionalFields = await parseSend(info, chainId, formatNumber)
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

export function getTransactionToActivityQueryOptions(
  transaction: TransactionDetails | undefined,
  chainId: SupportedInterfaceChainId,
  formatNumber: FormatNumberFunctionType
) {
  return queryOptions({
    queryKey: ['transactionToActivity', transaction, chainId],
    queryFn: async () => transactionToActivity(transaction, chainId, formatNumber),
  })
}

export function getSignatureToActivityQueryOptions(
  signature: SignatureDetails | undefined,
  formatNumber: FormatNumberFunctionType
) {
  return queryOptions({
    queryKey: ['signatureToActivity', signature],
    queryFn: async () => signatureToActivity(signature, formatNumber),
  })
}

function convertToSecTimestamp(timestamp: number) {
  // UNIX timestamp in ms for Jan 1, 2100
  const threshold: number = 4102444800000
  if (timestamp >= threshold) {
    return Math.floor(timestamp / 1000)
  } else {
    return timestamp
  }
}

export async function signatureToActivity(
  signature: SignatureDetails | undefined,
  formatNumber: FormatNumberFunctionType
): Promise<Activity | undefined> {
  if (!signature) return undefined
  switch (signature.type) {
    case SignatureType.SIGN_UNISWAPX_ORDER:
    case SignatureType.SIGN_LIMIT: {
      // Only returns Activity items for orders that don't have an on-chain counterpart
      if (isOnChainOrder(signature.status)) return undefined

      const { title, statusMessage, status } =
        signature.type === SignatureType.SIGN_LIMIT
          ? LimitOrderTextTable[signature.status]
          : OrderTextTable[signature.status]

      return {
        hash: signature.orderHash,
        chainId: signature.chainId,
        title,
        status,
        offchainOrderDetails: {
          orderHash: signature.orderHash,
          id: signature.id,
          offerer: signature.offerer,
          txHash: signature.txHash,
          chainId: signature.chainId,
          type:
            signature.type === SignatureType.SIGN_LIMIT ? SignatureType.SIGN_LIMIT : SignatureType.SIGN_UNISWAPX_ORDER,
          status: signature.status,
          swapInfo: signature.swapInfo,
          addedTime: signature.addedTime,
          encodedOrder: signature.encodedOrder,
          expiry: signature.expiry,
        },
        timestamp: convertToSecTimestamp(signature.addedTime),
        from: signature.offerer,
        statusMessage,
        prefixIconSrc: UniswapXBolt,
        ...(await parseSwap(signature.swapInfo, signature.chainId, formatNumber)),
      }
    }
    default:
      return undefined
  }
}

export function useLocalActivities(account: string): ActivityMap {
  const allTransactions = useMultichainTransactions()
  const allSignatures = useAllSignatures()
  const { formatNumber } = useFormatter()

  const { data } = useQuery({
    queryKey: ['localActivities', account],
    queryFn: async () => {
      const transactions = Object.values(allTransactions)
        .filter(([transaction]) => transaction.from === account)
        .map(([transaction, chainId]) => transactionToActivity(transaction, chainId, formatNumber))
      const signatures = Object.values(allSignatures)
        .filter((signature) => signature.offerer === account)
        .map((signature) => signatureToActivity(signature, formatNumber))

      return (await Promise.all([...transactions, ...signatures])).reduce((acc, activity) => {
        if (activity) acc[activity.hash] = activity
        return acc
      }, {} as ActivityMap)
    },
  })

  return data ?? {}
}
