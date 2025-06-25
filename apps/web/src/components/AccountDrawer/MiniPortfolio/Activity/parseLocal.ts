import { BigNumber } from '@ethersproject/bignumber'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import UniswapXBolt from 'assets/svg/bolt.svg'
import StaticRouteIcon from 'assets/svg/static_route.svg'
import { getCurrency } from 'components/AccountDrawer/MiniPortfolio/Activity/getCurrency'
import { getBridgeDescriptor } from 'components/AccountDrawer/MiniPortfolio/Activity/parseRemote'
import { Activity, ActivityMap } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import {
  CancelledTransactionTitleTable,
  LimitOrderTextTable,
  OrderTextTable,
  getActivityTitle,
} from 'components/AccountDrawer/MiniPortfolio/constants'
import { FiatOnRampTransactionStatus } from 'state/fiatOnRampTransactions/types'
import {
  forTransactionStatusToTransactionStatus,
  statusToTransactionInfoStatus,
} from 'state/fiatOnRampTransactions/utils'
import { isOnChainOrder, useAllSignatures } from 'state/signatures/hooks'
import { SignatureDetails, SignatureType } from 'state/signatures/types'
import { useMultichainTransactions } from 'state/transactions/hooks'
import {
  BridgeTransactionInfo,
  CollectFeesTransactionInfo,
  DecreaseLiquidityTransactionInfo,
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  IncreaseLiquidityTransactionInfo,
  LpIncentivesClaimTransactionInfo,
  MigrateV2LiquidityToV3TransactionInfo,
  SendTransactionInfo,
  TransactionDetails,
  TransactionType,
  WrapTransactionInfo,
} from 'state/transactions/types'
import { isConfirmedTx } from 'state/transactions/utils'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FORTransaction } from 'uniswap/src/features/fiatOnRamp/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import {
  ApproveTransactionInfo,
  TransactionStatus,
  TransactionType as UniswapTransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import i18n from 'uniswap/src/i18n'
import { isAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

type FormatNumberFunctionType = ReturnType<typeof useLocalizationContext>['formatNumberOrString']
type FormatFiatPriceFunctionType = ReturnType<typeof useLocalizationContext>['convertFiatAmountFormatted']

function buildCurrencyDescriptor({
  currencyA,
  amtA,
  currencyB,
  amtB,
  formatNumber,
  isSwap = false,
}: {
  currencyA?: Currency
  amtA: string
  currencyB?: Currency
  amtB: string
  formatNumber: FormatNumberFunctionType
  isSwap?: boolean
}) {
  const formattedA = currencyA
    ? formatNumber({
        value: parseFloat(CurrencyAmount.fromRawAmount(currencyA, amtA).toSignificant()),
        type: NumberType.TokenNonTx,
      })
    : i18n.t('common.unknown')
  const symbolA = currencyA?.symbol ? ` ${currencyA.symbol}` : ''
  const formattedB = currencyB
    ? formatNumber({
        value: parseFloat(CurrencyAmount.fromRawAmount(currencyB, amtB).toSignificant()),
        type: NumberType.TokenNonTx,
      })
    : i18n.t('common.unknown')
  const symbolB = currencyB?.symbol ? ` ${currencyB.symbol}` : ''

  const amountWithSymbolA = `${formattedA}${symbolA}`
  const amountWithSymbolB = `${formattedB}${symbolB}`

  return isSwap
    ? i18n.t('activity.transaction.swap.descriptor', {
        amountWithSymbolA,
        amountWithSymbolB,
      })
    : i18n.t('activity.transaction.tokens.descriptor', {
        amountWithSymbolA,
        amountWithSymbolB,
      })
}

async function parseSwap({
  swap,
  chainId,
  formatNumber,
}: {
  swap: ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo
  chainId: UniverseChainId
  formatNumber: FormatNumberFunctionType
}): Promise<Partial<Activity>> {
  const [tokenIn, tokenOut] = await Promise.all([
    getCurrency(swap.inputCurrencyId, chainId),
    getCurrency(swap.outputCurrencyId, chainId),
  ])
  const [inputRaw, outputRaw] =
    swap.tradeType === TradeType.EXACT_INPUT
      ? [swap.inputCurrencyAmountRaw, swap.settledOutputCurrencyAmountRaw ?? swap.expectedOutputCurrencyAmountRaw]
      : [swap.expectedInputCurrencyAmountRaw, swap.outputCurrencyAmountRaw]

  return {
    descriptor: buildCurrencyDescriptor({
      currencyA: tokenIn,
      amtA: inputRaw,
      currencyB: tokenOut,
      amtB: outputRaw,
      formatNumber,
      isSwap: true,
    }),
    currencies: [tokenIn, tokenOut],
    prefixIconSrc: swap.isUniswapXOrder ? UniswapXBolt : undefined,
  }
}

async function parseBridge({
  bridge,
  inputChainId,
  outputChainId,
  formatNumber,
}: {
  bridge: BridgeTransactionInfo
  inputChainId: UniverseChainId
  outputChainId: UniverseChainId
  formatNumber: FormatNumberFunctionType
}): Promise<Partial<Activity>> {
  const [tokenIn, tokenOut] = await Promise.all([
    getCurrency(bridge.inputCurrencyId, inputChainId),
    getCurrency(bridge.outputCurrencyId, outputChainId),
  ])
  const inputAmount = tokenIn
    ? formatNumber({
        value: parseFloat(CurrencyAmount.fromRawAmount(tokenIn, bridge.inputCurrencyAmountRaw).toSignificant()),
        type: NumberType.TokenNonTx,
      })
    : i18n.t('common.unknown')
  const outputAmount = tokenOut
    ? formatNumber({
        value: parseFloat(CurrencyAmount.fromRawAmount(tokenOut, bridge.outputCurrencyAmountRaw).toSignificant()),
        type: NumberType.TokenNonTx,
      })
    : i18n.t('common.unknown')
  return {
    descriptor: getBridgeDescriptor({ tokenIn, tokenOut, inputAmount, outputAmount }),
    chainId: inputChainId,
    outputChainId,
    currencies: [tokenIn, tokenOut],
    prefixIconSrc: undefined,
  }
}

function parseWrap({
  wrap,
  chainId,
  status,
  formatNumber,
}: {
  wrap: WrapTransactionInfo
  chainId: UniverseChainId
  status: TransactionStatus
  formatNumber: FormatNumberFunctionType
}): Partial<Activity> {
  const native = nativeOnChain(chainId)
  const wrapped = native.wrapped
  const [input, output] = wrap.unwrapped ? [wrapped, native] : [native, wrapped]

  const descriptor = buildCurrencyDescriptor({
    currencyA: input,
    amtA: wrap.currencyAmountRaw,
    currencyB: output,
    amtB: wrap.currencyAmountRaw,
    formatNumber,
    isSwap: true,
  })
  const title = getActivityTitle({
    type: TransactionType.WRAP,
    status,
    alternate: wrap.unwrapped,
  })
  const currencies = wrap.unwrapped ? [wrapped, native] : [native, wrapped]

  return { title, descriptor, currencies }
}

async function parseApproval({
  approval,
  chainId,
  status,
}: {
  approval: ApproveTransactionInfo
  chainId: UniverseChainId
  status: TransactionStatus
}): Promise<Partial<Activity>> {
  const currency = await getCurrency(approval.tokenAddress, chainId)
  const descriptor = currency?.symbol ?? currency?.name ?? i18n.t('common.unknown')
  return {
    title: getActivityTitle({
      type: UniswapTransactionType.Approve,
      status,
      alternate: BigNumber.from(approval.approvalAmount).eq(0), // use alternate if it's a revoke
    }),
    descriptor,
    currencies: [currency],
  }
}

async function parseCurrencyInfoForLP({
  currencyInfo,
  chainId,
  formatNumber,
}: {
  currencyInfo: {
    baseCurrencyId: string
    quoteCurrencyId: string
    expectedAmountBaseRaw: string
    expectedAmountQuoteRaw: string
  }
  chainId: UniverseChainId
  formatNumber: FormatNumberFunctionType
}): Promise<Partial<Activity>> {
  const [baseCurrency, quoteCurrency] = await Promise.all([
    getCurrency(currencyInfo.baseCurrencyId, chainId),
    getCurrency(currencyInfo.quoteCurrencyId, chainId),
  ])
  const [baseRaw, quoteRaw] = [currencyInfo.expectedAmountBaseRaw, currencyInfo.expectedAmountQuoteRaw]
  const descriptor = buildCurrencyDescriptor({
    currencyA: baseCurrency,
    amtA: baseRaw,
    currencyB: quoteCurrency,
    amtB: quoteRaw,
    formatNumber,
  })

  return { descriptor, currencies: [baseCurrency, quoteCurrency] }
}

type GenericLiquidityInfo = Omit<IncreaseLiquidityTransactionInfo | DecreaseLiquidityTransactionInfo, 'type'>
async function parseLiquidity({
  lp,
  chainId,
  formatNumber,
}: {
  lp: GenericLiquidityInfo
  chainId: UniverseChainId
  formatNumber: FormatNumberFunctionType
}): Promise<Partial<Activity>> {
  const [token0Currency, token1Currency] = await Promise.all([
    getCurrency(lp.token0CurrencyId, chainId),
    getCurrency(lp.token1CurrencyId, chainId),
  ])
  const [token0Raw, token1Raw] = [lp.token0CurrencyAmountRaw, lp.token1CurrencyAmountRaw]
  const descriptor = buildCurrencyDescriptor({
    currencyA: token0Currency,
    amtA: token0Raw,
    currencyB: token1Currency,
    amtB: token1Raw,
    formatNumber,
  })

  return { descriptor, currencies: [token0Currency, token1Currency] }
}

async function parseCollectFees({
  collect,
  chainId,
  formatNumber,
}: {
  collect: CollectFeesTransactionInfo
  chainId: UniverseChainId
  formatNumber: FormatNumberFunctionType
}): Promise<Partial<Activity>> {
  // Adapts CollectFeesTransactionInfo to generic LP type
  const {
    token0CurrencyId: baseCurrencyId,
    token1CurrencyId: quoteCurrencyId,
    token0CurrencyAmountRaw: expectedAmountBaseRaw,
    token1CurrencyAmountRaw: expectedAmountQuoteRaw,
  } = collect
  return parseCurrencyInfoForLP({
    currencyInfo: {
      baseCurrencyId,
      quoteCurrencyId,
      expectedAmountBaseRaw,
      expectedAmountQuoteRaw,
    },
    chainId,
    formatNumber,
  })
}

async function parseMigrateV2ToV3({
  lp,
  chainId,
}: {
  lp: MigrateV2LiquidityToV3TransactionInfo
  chainId: UniverseChainId
}): Promise<Partial<Activity>> {
  const [baseCurrency, quoteCurrency] = await Promise.all([
    getCurrency(lp.baseCurrencyId, chainId),
    getCurrency(lp.quoteCurrencyId, chainId),
  ])
  const baseSymbol = baseCurrency?.symbol ?? i18n.t('common.unknown')
  const quoteSymbol = quoteCurrency?.symbol ?? i18n.t('common.unknown')
  const descriptor = i18n.t('activity.transaction.tokens.descriptor', {
    amountWithSymbolA: baseSymbol,
    amountWithSymbolB: quoteSymbol,
  })

  return { descriptor, currencies: [baseCurrency, quoteCurrency] }
}

async function parseSend({
  send,
  chainId,
  formatNumber,
}: {
  send: SendTransactionInfo
  chainId: UniverseChainId
  formatNumber: FormatNumberFunctionType
}): Promise<Partial<Activity>> {
  const { currencyId, amount, recipient } = send
  const currency = await getCurrency(currencyId, chainId)
  const formattedAmount = currency
    ? formatNumber({
        value: parseFloat(CurrencyAmount.fromRawAmount(currency, amount).toSignificant()),
        type: NumberType.TokenNonTx,
      })
    : i18n.t('common.unknown')
  const otherAccount = isAddress(recipient) || undefined

  return {
    descriptor: i18n.t('activity.transaction.send.descriptor', {
      amountWithSymbol: `${formattedAmount} ${currency?.symbol}`,
      walletAddress: recipient,
    }),
    otherAccount,
    currencies: [currency],
  }
}

async function parseLpIncentivesClaim({
  info,
  chainId,
}: {
  info: LpIncentivesClaimTransactionInfo
  chainId: UniverseChainId
}): Promise<Partial<Activity>> {
  const token = await getCurrency(info.tokenAddress, chainId)
  const symbol = token?.symbol ?? i18n.t('common.unknown')
  return {
    descriptor: i18n.t('activity.transaction.lpRewards.descriptor', { symbol }),
    currencies: [token],
  }
}

export async function transactionToActivity({
  details,
  chainId,
  formatNumber,
}: {
  details?: TransactionDetails
  chainId: UniverseChainId
  formatNumber: FormatNumberFunctionType
}): Promise<Activity | undefined> {
  if (!details) {
    return undefined
  }
  try {
    const defaultFields = {
      hash: details.hash,
      chainId,
      nonce: details.nonce,
      title: getActivityTitle({ type: details.info.type, status: details.status }),
      status: details.status,
      timestamp: (isConfirmedTx(details) ? details.confirmedTime : details.addedTime) / 1000,
      from: details.from,
      cancelled: details.cancelled,
    }

    let additionalFields: Partial<Activity> = {}
    const info = details.info
    if (info.type === TransactionType.SWAP) {
      additionalFields = await parseSwap({
        swap: info,
        chainId,
        formatNumber,
      })
    } else if (info.type === TransactionType.BRIDGE) {
      additionalFields = await parseBridge({
        bridge: info,
        inputChainId: chainId,
        outputChainId: info.outputChainId,
        formatNumber,
      })
    } else if (info.type === UniswapTransactionType.Approve) {
      additionalFields = await parseApproval({
        approval: info,
        chainId,
        status: details.status,
      })
    } else if (info.type === TransactionType.WRAP) {
      additionalFields = parseWrap({
        wrap: info,
        chainId,
        status: details.status,
        formatNumber,
      })
    } else if (
      info.type === TransactionType.INCREASE_LIQUIDITY ||
      info.type === TransactionType.DECREASE_LIQUIDITY ||
      info.type === TransactionType.CREATE_POSITION ||
      info.type === TransactionType.MIGRATE_LIQUIDITY_V3_TO_V4
    ) {
      additionalFields = await parseLiquidity({
        lp: info,
        chainId,
        formatNumber,
      })
    } else if (info.type === TransactionType.COLLECT_FEES) {
      additionalFields = await parseCollectFees({
        collect: info,
        chainId,
        formatNumber,
      })
    } else if (info.type === TransactionType.MIGRATE_LIQUIDITY_V2_TO_V3) {
      additionalFields = await parseMigrateV2ToV3({
        lp: info,
        chainId,
      })
    } else if (info.type === TransactionType.SEND) {
      additionalFields = await parseSend({
        send: info,
        chainId,
        formatNumber,
      })
    } else if (info.type === TransactionType.LP_INCENTIVES_CLAIM_REWARDS) {
      additionalFields = await parseLpIncentivesClaim({
        info,
        chainId,
      })
    } else if (info.type === TransactionType.PERMIT) {
      additionalFields = {
        title: i18n.t('common.permit'),
        descriptor: i18n.t('notification.transaction.unknown.success.short'),
        logos: [StaticRouteIcon],
      }
    }

    const activity = { ...defaultFields, ...additionalFields }

    if (details.cancelled) {
      activity.title = CancelledTransactionTitleTable[details.info.type]
      activity.status = TransactionStatus.Success
    }

    return activity
  } catch (error) {
    logger.warn('parseLocal', 'transactionToActivity', `Failed to parse transaction ${details.hash}`, error)
    return undefined
  }
}

export function getTransactionToActivityQueryOptions({
  transaction,
  chainId,
  formatNumber,
}: {
  transaction?: TransactionDetails
  chainId: UniverseChainId
  formatNumber: FormatNumberFunctionType
}) {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.TransactionToActivity, transaction, chainId],
    queryFn: async () => transactionToActivity({ details: transaction, chainId, formatNumber }),
  })
}

export function getSignatureToActivityQueryOptions(
  signature: SignatureDetails | undefined,
  formatNumber: FormatNumberFunctionType,
) {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.SignatureToActivity, signature],
    queryFn: async () => signatureToActivity(signature, formatNumber),
  })
}

export function getFORTransactionToActivityQueryOptions({
  transaction,
  formatNumber,
  formatFiatPrice,
}: {
  transaction?: FORTransaction
  formatNumber: FormatNumberFunctionType
  formatFiatPrice: FormatFiatPriceFunctionType
}) {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.TransactionToActivity, transaction],
    queryFn: async () => forTransactionToActivity({ transaction, formatNumber, formatFiatPrice }),
  })
}

async function forTransactionToActivity({
  transaction,
  formatNumber,
  formatFiatPrice,
}: {
  transaction?: FORTransaction
  formatNumber: FormatNumberFunctionType
  formatFiatPrice: FormatFiatPriceFunctionType
}): Promise<Activity | undefined> {
  if (!transaction) {
    return undefined
  }

  const chainId = Number(transaction.cryptoDetails.chainId) as UniverseChainId
  const currency = await getCurrency(transaction.sourceCurrencyCode, chainId)
  const status = statusToTransactionInfoStatus(transaction.status)
  const serviceProvider = transaction.serviceProviderDetails.name
  const tokenAmount = formatNumber({ value: transaction.sourceAmount, type: NumberType.TokenNonTx })
  const fiatAmount = formatFiatPrice(transaction.destinationAmount, NumberType.FiatTokenPrice)

  let title = ''
  switch (status) {
    case FiatOnRampTransactionStatus.PENDING:
      title = i18n.t('transaction.status.sale.pendingOn', { serviceProvider })
      break
    case FiatOnRampTransactionStatus.COMPLETE:
      title = i18n.t('transaction.status.sale.successOn', { serviceProvider })
      break
    case FiatOnRampTransactionStatus.FAILED:
      title = i18n.t('transaction.status.sale.failedOn', { serviceProvider })
      break
  }

  return {
    hash: transaction.externalSessionId,
    chainId,
    title,
    descriptor: `${tokenAmount} ${transaction.sourceCurrencyCode} ${i18n.t('common.for').toLocaleLowerCase()} ${fiatAmount}`,
    currencies: [currency],
    status: forTransactionStatusToTransactionStatus(status),
    timestamp: convertToSecTimestamp(Number(transaction.createdAt)),
    from: transaction.cryptoDetails.walletAddress,
  }
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
  formatNumber: FormatNumberFunctionType,
): Promise<Activity | undefined> {
  if (!signature) {
    return undefined
  }
  switch (signature.type) {
    case SignatureType.SIGN_UNISWAPX_ORDER:
    case SignatureType.SIGN_UNISWAPX_V2_ORDER:
    case SignatureType.SIGN_UNISWAPX_V3_ORDER:
    case SignatureType.SIGN_PRIORITY_ORDER:
    case SignatureType.SIGN_LIMIT: {
      // Only returns Activity items for orders that don't have an on-chain counterpart
      if (isOnChainOrder(signature.status)) {
        return undefined
      }

      const orderTextTableEntry =
        signature.type === SignatureType.SIGN_LIMIT
          ? LimitOrderTextTable[signature.status]
          : OrderTextTable[signature.status]

      const title = orderTextTableEntry.getTitle()
      const statusMessage = orderTextTableEntry.getStatusMessage?.()

      return {
        hash: signature.orderHash,
        chainId: signature.chainId,
        title,
        status: orderTextTableEntry.status,
        offchainOrderDetails: signature,
        timestamp: convertToSecTimestamp(signature.addedTime),
        from: signature.offerer,
        statusMessage,
        prefixIconSrc: UniswapXBolt,
        ...(await parseSwap({
          swap: signature.swapInfo,
          chainId: signature.chainId,
          formatNumber,
        })),
      }
    }
    default:
      return undefined
  }
}

export function useLocalActivities(account: string): ActivityMap {
  const allTransactions = useMultichainTransactions()
  const allSignatures = useAllSignatures()
  const { formatNumberOrString } = useLocalizationContext()
  const { chains } = useEnabledChains()

  const { data } = useQuery({
    queryKey: [ReactQueryCacheKey.LocalActivities, account, allTransactions, allSignatures],
    queryFn: async () => {
      const transactions = Object.values(allTransactions)
        .filter(([transaction]) => transaction.from === account)
        .filter(([, chainId]) => chains.includes(chainId))
        .map(([transaction, chainId]) =>
          transactionToActivity({ details: transaction, chainId, formatNumber: formatNumberOrString }),
        )
      const signatures = Object.values(allSignatures)
        .filter((signature) => signature.offerer === account)
        .map((signature) => signatureToActivity(signature, formatNumberOrString))

      return (await Promise.all([...transactions, ...signatures])).reduce((acc, activity) => {
        if (activity) {
          acc[activity.hash] = activity
        }
        return acc
      }, {} as ActivityMap)
    },
  })

  return data ?? {}
}
