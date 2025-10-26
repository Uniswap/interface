import { BigNumber } from '@ethersproject/bignumber'
import { GraphQLApi, TradingApi } from '@universe/api'
import { Activity, ActivityMap } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import { getYear, isSameDay, isSameMonth, isSameWeek, isSameYear } from 'date-fns'
import { parseUnits } from 'ethers/lib/utils'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import i18n from 'uniswap/src/i18n'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { DEFAULT_ERC20_DECIMALS } from 'utilities/src/tokens/constants'

interface ActivityGroup {
  title: string
  transactions: Array<Activity>
}

/**
 * Helper function to get currency address with proper fallback for native tokens
 */
export function getCurrencyAddress(token: GraphQLApi.TokenAssetPartsFragment, chainId: UniverseChainId): string {
  return token.address || getNativeAddress(chainId) || ''
}

/**
 * Helper function to parse token amount with decimal fallback
 */
export function parseTokenAmount(quantity: string, decimals?: number | null): string {
  return parseUnits(quantity, decimals ?? DEFAULT_ERC20_DECIMALS).toString()
}

const sortActivities = (a: Activity, b: Activity) => b.timestamp - a.timestamp
export const createGroups = (activities: Array<Activity> = [], hideSpam = false) => {
  if (activities.length === 0) {
    return []
  }
  const now = Date.now()

  const pending: Array<Activity> = []
  const today: Array<Activity> = []
  const currentWeek: Array<Activity> = []
  const last30Days: Array<Activity> = []
  const currentYear: Array<Activity> = []
  const yearMap: { [key: string]: Array<Activity> } = {}

  // TODO(cartcrom): create different time bucket system for activities to fall in based on design wants
  activities.forEach((activity) => {
    if (hideSpam && activity.isSpam) {
      return
    }

    const addedTime = activity.timestamp * ONE_SECOND_MS
    if (activity.status === TransactionStatus.Pending) {
      if (activity.offchainOrderDetails?.routing === TradingApi.Routing.DUTCH_LIMIT) {
        // limit orders are only displayed in their own pane
      } else {
        pending.push(activity)
      }
    } else if (isSameDay(now, addedTime)) {
      today.push(activity)
    } else if (isSameWeek(addedTime, now)) {
      currentWeek.push(activity)
    } else if (isSameMonth(addedTime, now)) {
      last30Days.push(activity)
    } else if (isSameYear(addedTime, now)) {
      currentYear.push(activity)
    } else {
      const year = getYear(addedTime)

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!yearMap[year]) {
        yearMap[year] = [activity]
      } else {
        yearMap[year].push(activity)
      }
    }
  })
  const sortedYears = Object.keys(yearMap)
    .sort((a, b) => parseInt(b) - parseInt(a))
    .map((year) => ({ title: year, transactions: yearMap[year] }))

  const transactionGroups: Array<ActivityGroup> = [
    { title: i18n.t('common.pending'), transactions: pending.sort(sortActivities) },
    { title: i18n.t('common.today'), transactions: today.sort(sortActivities) },
    { title: i18n.t('common.thisWeek'), transactions: currentWeek.sort(sortActivities) },
    { title: i18n.t('common.thisMonth'), transactions: last30Days.sort(sortActivities) },
    { title: i18n.t('common.thisYear'), transactions: currentYear.sort(sortActivities) },
    ...sortedYears,
  ]

  return transactionGroups.filter(({ transactions }) => transactions.length > 0)
}

/**
 * Extracts nonce from an Activity object.
 *
 * @param activity - The activity to extract nonce from
 * @returns the nonce as BigNumber if available, undefined otherwise
 */
export function getActivityNonce(activity: Activity): BigNumber | undefined {
  if (
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    activity.options?.request?.nonce !== undefined &&
    // TODO(PORT-338): determine why nonce is being sent in as null value
    // when creating a limit order (should be undefined or BigNumberish)
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    activity.options.request.nonce !== null
  ) {
    return BigNumber.from(activity.options.request.nonce)
  }

  return undefined
}

/**
 * Checks if two activities have the same nonce for cancellation detection.
 *
 * @param activity1 - First activity
 * @param activity2 - Second activity
 * @returns true if both activities have the same nonce
 */
export function haveSameNonce(activity1: Activity, activity2: Activity): boolean {
  const nonce1 = getActivityNonce(activity1)
  const nonce2 = getActivityNonce(activity2)

  return Boolean(nonce1 && nonce2 && nonce1.eq(nonce2))
}

/**
 * Creates an ActivityMap from an array of activities, using the transaction hash as the key.
 *
 * This centralized function ensures consistent behavior between local and remote activity parsing,
 * preventing divergence in how activities are keyed in the map.
 *
 * Note: All activity types set a hash value:
 * - Regular transactions: use their transaction hash
 * - Fiat on/off ramps: set hash = id in the parser
 * - UniswapX orders: set hash = orderHash
 *
 * @param activities Array of activities to map
 * @returns ActivityMap keyed by transaction hash
 */
export function createActivityMapByHash(activities: (Activity | undefined)[]): ActivityMap {
  return activities.reduce<ActivityMap>((acc, activity) => {
    if (!activity) {
      return acc
    }

    // Unfilled UniswapX orders will not have a hash, use the orderHash instead
    const activityHash = activity.hash ?? activity.offchainOrderDetails?.orderHash

    if (!activityHash) {
      // This should not happen as all activity parsers set a hash or orderHash value
      logger.warn('utils', 'createActivityMapByHash', 'Activity without hash skipped', {
        activityId: activity.id,
        activityType: activity.type,
      })
      return acc
    }

    acc[activityHash] = activity
    return acc
  }, {})
}
