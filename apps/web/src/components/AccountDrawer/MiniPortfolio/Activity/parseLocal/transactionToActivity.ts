import { createElement } from 'react'
import { SwapDotted } from 'ui/src/components/icons/SwapDotted'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { FORTransaction } from 'uniswap/src/features/fiatOnRamp/types'
import { hasTradeType } from 'uniswap/src/features/transactions/swap/utils/trade'
import type { InterfaceTransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { isConfirmedSwapTypeInfo } from 'uniswap/src/features/transactions/types/utils'
import i18n from 'uniswap/src/i18n'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import {
  getActivityTitle,
  getCancelledTransactionTitleTable,
} from '~/components/AccountDrawer/MiniPortfolio/Activity/constants'
import { getCurrencyFromCurrencyId } from '~/components/AccountDrawer/MiniPortfolio/Activity/getCurrency'
import { parseApproval } from '~/components/AccountDrawer/MiniPortfolio/Activity/parseLocal/transactions/parseApproval'
import { parseBridge } from '~/components/AccountDrawer/MiniPortfolio/Activity/parseLocal/transactions/parseBridge'
import {
  parseCollectFees,
  parseLiquidity,
  parseLpIncentivesClaim,
  parseMigrateV2ToV3,
} from '~/components/AccountDrawer/MiniPortfolio/Activity/parseLocal/transactions/parseLiquidity'
import { parsePlan } from '~/components/AccountDrawer/MiniPortfolio/Activity/parseLocal/transactions/parsePlan'
import { parseSend } from '~/components/AccountDrawer/MiniPortfolio/Activity/parseLocal/transactions/parseSend'
import {
  parseConfirmedSwap,
  parseSwap,
} from '~/components/AccountDrawer/MiniPortfolio/Activity/parseLocal/transactions/parseSwap'
import {
  parseAuctionLaunch,
  parseToucanBid,
  parseWithdrawBidAndClaimTokens,
} from '~/components/AccountDrawer/MiniPortfolio/Activity/parseLocal/transactions/parseToucan'
import {
  isUniswapXDetails,
  parseUniswapXOrderLocal,
} from '~/components/AccountDrawer/MiniPortfolio/Activity/parseLocal/transactions/parseUniswapX'
import { parseWrap } from '~/components/AccountDrawer/MiniPortfolio/Activity/parseLocal/transactions/parseWrap'
import type {
  FormatNumberFunctionType,
  FormatFiatPriceFunctionType,
} from '~/components/AccountDrawer/MiniPortfolio/Activity/parseLocal/types'
import type { Activity } from '~/components/AccountDrawer/MiniPortfolio/Activity/types'
import { FiatOnRampTransactionStatus } from '~/state/fiatOnRampTransactions/types'
import {
  forTransactionStatusToTransactionStatus,
  statusToTransactionInfoStatus,
} from '~/state/fiatOnRampTransactions/utils'
import { isConfirmedTx } from '~/state/transactions/utils'

export async function transactionToActivity({
  details,
  formatNumber,
  isEarnActivityDisplayEnabled = true,
}: {
  details?: InterfaceTransactionDetails
  formatNumber: FormatNumberFunctionType
  isEarnActivityDisplayEnabled?: boolean
}): Promise<Activity | undefined> {
  if (!details) {
    return undefined
  }
  const { chainId } = details
  try {
    const isEarnPlan =
      isEarnActivityDisplayEnabled &&
      details.typeInfo.type === TransactionType.Plan &&
      details.typeInfo.earnAction !== undefined
    const isUniswapX = details.typeInfo.type === TransactionType.Swap && isUniswapXActivity(details)
    const shouldDeferTitle = isEarnPlan || isUniswapX

    const defaultFields: Activity = {
      id: details.id,
      hash: details.hash,
      chainId,
      // Store transaction request in options.request for consistent nonce access
      options: 'options' in details ? details.options : undefined,
      title: shouldDeferTitle
        ? ''
        : getActivityTitle({
            type: details.typeInfo.type,
            status: details.status,
          }),
      status: details.status,
      timestamp: (isConfirmedTx(details) ? details.receipt.confirmedTime : details.addedTime) / ONE_SECOND_MS,
      from: details.from,
    }

    const additionalFields = await parseTransactionTypeFields({
      details,
      formatNumber,
      chainId,
      isEarnActivityDisplayEnabled,
    })

    const activity = { ...defaultFields, ...additionalFields }

    // Skip the canceled transaction override for types that provide their own status-specific titles.
    const CancelledTransactionTitleTable = getCancelledTransactionTitleTable()
    if (details.status === TransactionStatus.Canceled && !isUniswapX && !isEarnPlan) {
      activity.title = CancelledTransactionTitleTable[details.typeInfo.type]
      activity.status = TransactionStatus.Success
    }

    return activity
  } catch (error) {
    logger.warn('parseLocal', 'transactionToActivity', `Failed to parse transaction ${details.hash}`, error)
    return undefined
  }
}

async function parseTransactionTypeFields({
  details,
  formatNumber,
  chainId,
  isEarnActivityDisplayEnabled,
}: {
  details: InterfaceTransactionDetails
  formatNumber: FormatNumberFunctionType
  chainId: UniverseChainId
  isEarnActivityDisplayEnabled: boolean
}): Promise<Partial<Activity>> {
  const info = details.typeInfo

  switch (info.type) {
    case TransactionType.Swap: {
      if (isUniswapXActivity(details)) {
        return parseUniswapXOrderLocal({
          details,
          formatNumber,
        })
      }

      const confirmedSwap = isConfirmedSwapTypeInfo(info)
      return confirmedSwap
        ? parseConfirmedSwap({
            swap: info,
            formatNumber,
          })
        : parseSwap({
            swap: info,
            formatNumber,
          })
    }
    case TransactionType.Bridge:
      return parseBridge({
        bridge: info,
        formatNumber,
        chainId,
      })
    case TransactionType.Approve:
      return parseApproval({
        approval: info,
        chainId,
        status: details.status,
      })
    case TransactionType.Wrap:
      return parseWrap({
        wrap: info,
        chainId,
        status: details.status,
        formatNumber,
      })
    case TransactionType.LiquidityIncrease:
    case TransactionType.LiquidityDecrease:
    case TransactionType.CreatePool:
    case TransactionType.CreatePair:
    case TransactionType.MigrateLiquidityV3ToV4:
      return parseLiquidity({
        lp: info,
        formatNumber,
      })
    case TransactionType.CollectFees:
      return parseCollectFees({
        collectInfo: info,
        formatNumber,
      })
    case TransactionType.MigrateLiquidityV2ToV3:
      return parseMigrateV2ToV3(info)
    case TransactionType.Send:
      return parseSend({
        send: info,
        formatNumber,
        chainId,
      })
    case TransactionType.ToucanBid:
      return parseToucanBid({
        bid: info,
        formatNumber,
        chainId,
      })
    case TransactionType.ToucanWithdrawBidAndClaimTokens:
      return parseWithdrawBidAndClaimTokens({
        withdraw: info,
        formatNumber,
        chainId,
        status: details.status,
      })
    case TransactionType.AuctionLaunch:
      return parseAuctionLaunch(info)
    case TransactionType.LPIncentivesClaimRewards:
      return parseLpIncentivesClaim({
        info,
        chainId,
      })
    case TransactionType.Permit2Approve:
      return {
        title: i18n.t('common.permit'),
        descriptor: i18n.t('notification.transaction.unknown.success.short'),
        portfolioLogoCustomIcon: createElement(SwapDotted, {
          size: '$icon.24',
          color: '$neutral2',
        }),
      }
    case TransactionType.Plan:
      return parsePlan({
        plan: info,
        formatNumber,
        chainId,
        status: details.status,
        isEarnActivityDisplayEnabled,
      })
    default:
      return {}
  }
}

export async function forTransactionToActivity({
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

  const chainId = Number(transaction.cryptoDetails?.chainId) as UniverseChainId
  const currency = await getCurrencyFromCurrencyId(buildCurrencyId(chainId, transaction.sourceCurrencyCode))
  const status = statusToTransactionInfoStatus(transaction.status)
  const serviceProvider = transaction.serviceProviderDetails?.name ?? ''
  const tokenAmount = formatNumber({
    value: transaction.sourceAmount,
    type: NumberType.TokenNonTx,
  })
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
    descriptor: `${tokenAmount} ${transaction.sourceCurrencyCode} ${i18n
      .t('common.for')
      .toLocaleLowerCase()} ${fiatAmount}`,
    currencies: [currency],
    status: forTransactionStatusToTransactionStatus(status),
    timestamp: convertToSecTimestamp(Number(transaction.createdAt)),
    from: transaction.cryptoDetails?.walletAddress ?? '',
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
