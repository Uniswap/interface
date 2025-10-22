import { BigNumber } from '@ethersproject/bignumber'
import { queryOptions, useQuery } from '@tanstack/react-query'
import type { Currency } from '@uniswap/sdk-core'
import { CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import UniswapXBolt from 'assets/svg/bolt.svg'
import StaticRouteIcon from 'assets/svg/static_route.svg'
import { getCurrencyFromCurrencyId } from 'components/AccountDrawer/MiniPortfolio/Activity/getCurrency'
import { getBridgeDescriptor } from 'components/AccountDrawer/MiniPortfolio/Activity/parseRemote'
import type { Activity, ActivityMap } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import { createActivityMapByHash } from 'components/AccountDrawer/MiniPortfolio/Activity/utils'
import {
  getActivityTitle,
  getCancelledTransactionTitleTable,
  getLimitOrderTextTable,
  getOrderTextTable,
} from 'components/AccountDrawer/MiniPortfolio/constants'
import { FiatOnRampTransactionStatus } from 'state/fiatOnRampTransactions/types'
import {
  forTransactionStatusToTransactionStatus,
  statusToTransactionInfoStatus,
} from 'state/fiatOnRampTransactions/utils'
import { useMultichainTransactions } from 'state/transactions/hooks'
import { isConfirmedTx } from 'state/transactions/utils'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { FORTransaction } from 'uniswap/src/features/fiatOnRamp/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { hasTradeType } from 'uniswap/src/features/transactions/swap/utils/trade'
import type {
  ApproveTransactionInfo,
  BridgeTransactionInfo,
  CollectFeesTransactionInfo,
  ConfirmedSwapTransactionInfo,
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  InterfaceBaseTransactionDetails,
  InterfaceTransactionDetails,
  LiquidityDecreaseTransactionInfo,
  LiquidityIncreaseTransactionInfo,
  LpIncentivesClaimTransactionInfo,
  MigrateV2LiquidityToV3TransactionInfo,
  SendTokenTransactionInfo,
  UniswapXOrderDetails,
  WrapTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { isConfirmedSwapTypeInfo } from 'uniswap/src/features/transactions/types/utils'
import i18n from 'uniswap/src/i18n'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { buildCurrencyId, currencyIdToChain } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

type FormatNumberFunctionType = ReturnType<typeof useLocalizationContext>['formatNumberOrString']
type FormatFiatPriceFunctionType = ReturnType<typeof useLocalizationContext>['convertFiatAmountFormatted']

// Narrowing helper for when we actually need UniswapX-specific fields
function isUniswapXDetails(
  details: InterfaceTransactionDetails,
): details is UniswapXOrderDetails<InterfaceBaseTransactionDetails> {
  return 'routing' in details && isUniswapX(details)
}

/**
 * Checks if a transaction is a UniswapX order by examining both the routing field (new approach)
 * and the isUniswapXOrder flag (legacy approach for backward compatibility)
 */
function isUniswapXActivity(details: InterfaceTransactionDetails): boolean {
  const { typeInfo } = details

  // Must be a swap with trade type info
  if (typeInfo.type !== TransactionType.Swap || !hasTradeType(typeInfo)) {
    return false
  }

  // Check new routing-based approach
  if (isUniswapXDetails(details)) {
    return true
  }

  // Fall back to legacy flag for backward compatibility with existing transactions
  // stored before migration to routing-based structure (see WALL-7143)
  return 'isUniswapXOrder' in typeInfo && typeInfo.isUniswapXOrder === true
}

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
  formatNumber,
}: {
  swap: ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo
  formatNumber: FormatNumberFunctionType
}): Promise<Partial<Activity>> {
  const [tokenIn, tokenOut] = await Promise.all([
    getCurrencyFromCurrencyId(swap.inputCurrencyId),
    getCurrencyFromCurrencyId(swap.outputCurrencyId),
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

async function parseConfirmedSwap({
  swap,
  formatNumber,
}: {
  swap: ConfirmedSwapTransactionInfo
  formatNumber: FormatNumberFunctionType
}): Promise<Partial<Activity>> {
  const [tokenIn, tokenOut] = await Promise.all([
    getCurrencyFromCurrencyId(swap.inputCurrencyId),
    getCurrencyFromCurrencyId(swap.outputCurrencyId),
  ])

  // For confirmed swaps, we use the actual settled amounts
  const inputRaw = swap.inputCurrencyAmountRaw
  const outputRaw = swap.outputCurrencyAmountRaw

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
  formatNumber,
  chainId,
}: {
  bridge: BridgeTransactionInfo
  formatNumber: FormatNumberFunctionType
  chainId: UniverseChainId
}): Promise<Partial<Activity>> {
  const [tokenIn, tokenOut] = await Promise.all([
    getCurrencyFromCurrencyId(bridge.inputCurrencyId),
    getCurrencyFromCurrencyId(bridge.outputCurrencyId),
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
    chainId: currencyIdToChain(bridge.inputCurrencyId) ?? chainId,
    outputChainId: currencyIdToChain(bridge.outputCurrencyId) ?? chainId,
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
    type: TransactionType.Wrap,
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
  const currency = await getCurrencyFromCurrencyId(buildCurrencyId(chainId, approval.tokenAddress))
  const descriptor = currency?.symbol ?? currency?.name ?? i18n.t('common.unknown')
  return {
    title: getActivityTitle({
      type: TransactionType.Approve,
      status,
      alternate: BigNumber.from(approval.approvalAmount).eq(0), // use alternate if it's a revoke
    }),
    descriptor,
    currencies: [currency],
  }
}

async function parseCurrencyInfoForLP({
  currencyInfo,
  formatNumber,
}: {
  currencyInfo: {
    currency0Id: string
    currency1Id?: string
    currency0AmountRaw: string
    currency1AmountRaw?: string
  }
  formatNumber: FormatNumberFunctionType
}): Promise<Partial<Activity>> {
  const [currency0, currency1] = await Promise.all([
    getCurrencyFromCurrencyId(currencyInfo.currency0Id),
    currencyInfo.currency1Id ? getCurrencyFromCurrencyId(currencyInfo.currency1Id) : undefined,
  ])

  const descriptor = buildCurrencyDescriptor({
    currencyA: currency0,
    amtA: currencyInfo.currency0AmountRaw,
    currencyB: currency1,
    amtB: currencyInfo.currency1AmountRaw ?? '0',
    formatNumber,
  })

  return { descriptor, currencies: [currency0, currency1] }
}

type GenericLiquidityInfo = Omit<LiquidityIncreaseTransactionInfo | LiquidityDecreaseTransactionInfo, 'type'>

async function parseLiquidity({
  lp,
  formatNumber,
}: {
  lp: GenericLiquidityInfo
  formatNumber: FormatNumberFunctionType
}): Promise<Partial<Activity>> {
  const [token0Currency, token1Currency] = await Promise.all([
    getCurrencyFromCurrencyId(lp.currency0Id),
    getCurrencyFromCurrencyId(lp.currency1Id),
  ])
  const [token0Raw, token1Raw] = [lp.currency0AmountRaw, lp.currency1AmountRaw]
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
  collectInfo,
  formatNumber,
}: {
  collectInfo: CollectFeesTransactionInfo
  formatNumber: FormatNumberFunctionType
}): Promise<Partial<Activity>> {
  // Adapts CollectFeesTransactionInfo to generic LP type
  return parseCurrencyInfoForLP({
    currencyInfo: collectInfo,
    formatNumber,
  })
}

async function parseMigrateV2ToV3({
  baseCurrencyId,
  quoteCurrencyId,
}: MigrateV2LiquidityToV3TransactionInfo): Promise<Partial<Activity>> {
  const [baseCurrency, quoteCurrency] = await Promise.all([
    getCurrencyFromCurrencyId(baseCurrencyId),
    getCurrencyFromCurrencyId(quoteCurrencyId),
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
  formatNumber,
  chainId,
}: {
  send: SendTokenTransactionInfo
  formatNumber: FormatNumberFunctionType
  chainId: UniverseChainId
}): Promise<Partial<Activity>> {
  const { tokenAddress, currencyAmountRaw, recipient } = send
  const currency = await getCurrencyFromCurrencyId(buildCurrencyId(chainId, tokenAddress))
  const formattedAmount =
    currency && currencyAmountRaw
      ? formatNumber({
          value: parseFloat(CurrencyAmount.fromRawAmount(currency, currencyAmountRaw).toSignificant()),
          type: NumberType.TokenNonTx,
        })
      : i18n.t('common.unknown')
  // TODO(SWAP-119): edit to allow SVM platform if Solana send is supported
  const otherAccount =
    getValidAddress({ address: recipient, platform: Platform.EVM, withEVMChecksum: true }) || undefined

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
  const token = await getCurrencyFromCurrencyId(buildCurrencyId(chainId, info.tokenAddress))
  const symbol = token?.symbol ?? i18n.t('common.unknown')
  return {
    descriptor: i18n.t('activity.transaction.lpRewards.descriptor', { symbol }),
    currencies: [token],
  }
}

async function parseUniswapXOrderLocal({
  details,
  formatNumber,
}: {
  details: InterfaceTransactionDetails
  formatNumber: FormatNumberFunctionType
}): Promise<Partial<Activity>> {
  const { typeInfo } = details
  const uniswapXOrderDetails = isUniswapXDetails(details) ? details : undefined
  const isLimitOrder = uniswapXOrderDetails?.routing === TradingApi.Routing.DUTCH_LIMIT

  // Get the appropriate order text table
  const orderTextTable = getOrderTextTable()
  const limitOrderTextTable = getLimitOrderTextTable()
  let orderTextTableEntry = (isLimitOrder ? limitOrderTextTable : orderTextTable)[details.status]

  // Fallback for missing status entries
  if (!orderTextTableEntry) {
    // Use default swap title/status as fallback
    orderTextTableEntry = {
      getTitle: () => getActivityTitle({ type: TransactionType.Swap, status: details.status }),
      status: details.status,
    }
  }

  const title = orderTextTableEntry.getTitle()
  const statusMessage = orderTextTableEntry.getStatusMessage?.()
  const swapFields = await parseSwap({
    swap: typeInfo as ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo,
    formatNumber,
  })

  // Create offchainOrderDetails if we have routing information
  const offchainOrderDetails = uniswapXOrderDetails
    ? {
        ...uniswapXOrderDetails,
        orderHash: uniswapXOrderDetails.orderHash || uniswapXOrderDetails.hash,
      }
    : undefined

  return {
    ...swapFields,
    title,
    status: orderTextTableEntry.status,
    statusMessage,
    prefixIconSrc: UniswapXBolt,
    offchainOrderDetails,
  }
}

export async function transactionToActivity({
  details,
  formatNumber,
}: {
  details?: InterfaceTransactionDetails
  formatNumber: FormatNumberFunctionType
}): Promise<Activity | undefined> {
  if (!details) {
    return undefined
  }
  const { chainId } = details
  try {
    // For swaps that might be UniswapX, we'll set the title later
    const shouldDeferTitle = details.typeInfo.type === TransactionType.Swap && isUniswapXActivity(details)

    const defaultFields: Activity = {
      id: details.id,
      hash: details.hash,
      chainId,
      // Store transaction request in options.request for consistent nonce access
      options: 'options' in details ? details.options : undefined,
      title: shouldDeferTitle ? '' : getActivityTitle({ type: details.typeInfo.type, status: details.status }),
      status: details.status,
      timestamp: (isConfirmedTx(details) ? details.receipt.confirmedTime : details.addedTime) / ONE_SECOND_MS,
      from: details.from,
    }

    let additionalFields: Partial<Activity> = {}
    const info = details.typeInfo
    if (info.type === TransactionType.Swap) {
      if (isUniswapXActivity(details)) {
        additionalFields = await parseUniswapXOrderLocal({
          details,
          formatNumber,
        })
      } else {
        // Handle as regular swap
        const confirmedSwap = isConfirmedSwapTypeInfo(info)
        if (!confirmedSwap) {
          additionalFields = await parseSwap({
            swap: info,
            formatNumber,
          })
        } else {
          additionalFields = await parseConfirmedSwap({
            swap: info,
            formatNumber,
          })
        }
      }
    } else if (info.type === TransactionType.Bridge) {
      additionalFields = await parseBridge({
        bridge: info,
        formatNumber,
        chainId,
      })
    } else if (info.type === TransactionType.Approve) {
      additionalFields = await parseApproval({
        approval: info,
        chainId,
        status: details.status,
      })
    } else if (info.type === TransactionType.Wrap) {
      additionalFields = parseWrap({
        wrap: info,
        chainId,
        status: details.status,
        formatNumber,
      })
    } else if (
      info.type === TransactionType.LiquidityIncrease ||
      info.type === TransactionType.LiquidityDecrease ||
      info.type === TransactionType.CreatePool ||
      info.type === TransactionType.CreatePair ||
      info.type === TransactionType.MigrateLiquidityV3ToV4
    ) {
      additionalFields = await parseLiquidity({
        lp: info,
        formatNumber,
      })
    } else if (info.type === TransactionType.CollectFees) {
      additionalFields = await parseCollectFees({
        collectInfo: info,
        formatNumber,
      })
    } else if (info.type === TransactionType.MigrateLiquidityV2ToV3) {
      additionalFields = await parseMigrateV2ToV3(info)
    } else if (info.type === TransactionType.Send) {
      additionalFields = await parseSend({
        send: info,
        formatNumber,
        chainId,
      })
    } else if (info.type === TransactionType.LPIncentivesClaimRewards) {
      additionalFields = await parseLpIncentivesClaim({
        info,
        chainId,
      })
    } else if (info.type === TransactionType.Permit2Approve) {
      additionalFields = {
        title: i18n.t('common.permit'),
        descriptor: i18n.t('notification.transaction.unknown.success.short'),
        logos: [StaticRouteIcon],
      }
    }

    const activity = { ...defaultFields, ...additionalFields }

    // Skip the canceled transaction override for UniswapX orders since they handle it specially
    const isUniswapX = details.typeInfo.type === TransactionType.Swap && isUniswapXActivity(details)
    const CancelledTransactionTitleTable = getCancelledTransactionTitleTable()
    if (details.status === TransactionStatus.Canceled && !isUniswapX) {
      activity.title = CancelledTransactionTitleTable[details.typeInfo.type]
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
  formatNumber,
}: {
  transaction?: InterfaceTransactionDetails
  formatNumber: FormatNumberFunctionType
}) {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.TransactionToActivity, transaction],
    queryFn: async () => transactionToActivity({ details: transaction, formatNumber }),
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
  const currency = await getCurrencyFromCurrencyId(buildCurrencyId(chainId, transaction.sourceCurrencyCode))
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
    id: transaction.externalSessionId,
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

export function useLocalActivities(account: string): ActivityMap {
  const allTransactions = useMultichainTransactions(account)
  const { formatNumberOrString } = useLocalizationContext()
  const { chains } = useEnabledChains()

  const { data } = useQuery({
    queryKey: [ReactQueryCacheKey.LocalActivities, account, allTransactions],
    queryFn: async () => {
      const transactions = Object.values(allTransactions)
        .filter(([, chainId]) => chains.includes(chainId))
        .map(([transaction]) =>
          transactionToActivity({
            details: transaction,
            formatNumber: formatNumberOrString,
          }),
        )

      const allActivities = await Promise.all([...transactions])
      return createActivityMapByHash(allActivities)
    },
  })

  return data ?? {}
}
