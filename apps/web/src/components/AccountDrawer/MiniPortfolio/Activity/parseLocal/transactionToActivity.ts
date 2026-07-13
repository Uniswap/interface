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
    } else if (info.type === TransactionType.ToucanBid) {
      additionalFields = await parseToucanBid({
        bid: info,
        formatNumber,
        chainId,
      })
    } else if (info.type === TransactionType.ToucanWithdrawBidAndClaimTokens) {
      additionalFields = await parseWithdrawBidAndClaimTokens({
        withdraw: info,
        formatNumber,
        chainId,
        status: details.status,
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
        portfolioLogoCustomIcon: createElement(SwapDotted, { size: '$icon.24', color: '$neutral2' }),
      }
    } else if (info.type === TransactionType.Plan) {
      additionalFields = await parsePlan({
        plan: info,
        formatNumber,
        chainId,
      })
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
