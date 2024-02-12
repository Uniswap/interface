import { Web3Provider } from '@ethersproject/providers'
import { t } from '@lingui/macro'
import { ChainId } from '@uniswap/sdk-core'
import { DutchOrder, splitNonce } from '@uniswap/uniswapx-sdk'
import { getYear, isSameDay, isSameMonth, isSameWeek, isSameYear } from 'date-fns'
import { BigNumber } from 'ethers/lib/ethers'
import { TransactionStatus } from 'graphql/data/__generated__/types-and-hooks'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'
import { Permit2 } from 'wallet/src/abis/types'

import { Activity } from './types'

interface ActivityGroup {
  title: string
  transactions: Array<Activity>
}

const sortActivities = (a: Activity, b: Activity) => b.timestamp - a.timestamp

export const createGroups = (activities?: Array<Activity>) => {
  if (!activities) return undefined
  const now = Date.now()

  const pending: Array<Activity> = []
  const today: Array<Activity> = []
  const currentWeek: Array<Activity> = []
  const last30Days: Array<Activity> = []
  const currentYear: Array<Activity> = []
  const yearMap: { [key: string]: Array<Activity> } = {}

  // TODO(cartcrom): create different time bucket system for activities to fall in based on design wants
  activities.forEach((activity) => {
    if (activity.status === TransactionStatus.Pending) {
      pending.push(activity)
      return
    }
    const addedTime = activity.timestamp * 1000

    if (isSameDay(now, addedTime)) {
      today.push(activity)
    } else if (isSameWeek(addedTime, now)) {
      currentWeek.push(activity)
    } else if (isSameMonth(addedTime, now)) {
      last30Days.push(activity)
    } else if (isSameYear(addedTime, now)) {
      currentYear.push(activity)
    } else {
      const year = getYear(addedTime)

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
    { title: t`Pending`, transactions: pending.sort(sortActivities) },
    { title: t`Today`, transactions: today.sort(sortActivities) },
    { title: t`This week`, transactions: currentWeek.sort(sortActivities) },
    { title: t`This month`, transactions: last30Days.sort(sortActivities) },
    { title: t`This year`, transactions: currentYear.sort(sortActivities) },
    ...sortedYears,
  ]

  return transactionGroups.filter((transactionInformation) => transactionInformation.transactions.length > 0)
}

/**
 * Calculates the word position and bit position within a word for a given nonce.
 *
 * This function takes a BigNumber 'nonce' and performs two operations:
 * 1. Right shifts the nonce by 8 bits (shr(8)) to find the word position.
 * 2. Performs a bitwise AND with 0xff (255 in decimal) to find the bit position within that word.
 *
 * https://github.com/Uniswap/permit2/blob/cc56ad0f3439c502c246fc5cfcc3db92bb8b7219/src/SignatureTransfer.sol#L136-L141
 */
function getCancelSingleParams(nonceToCancel: BigNumber): { word: BigNumber; mask: BigNumber } {
  const { word, bitPos } = splitNonce(nonceToCancel)
  const mask = BigNumber.from(2).pow(bitPos)
  return { word, mask }
}

export async function cancelUniswapXOrder({
  encodedOrder,
  chainId,
  permit2,
  provider,
}: {
  encodedOrder: string
  chainId: ChainId
  permit2: Permit2 | null
  provider?: Web3Provider
}) {
  const parsedOrder = DutchOrder.parse(encodedOrder, chainId)
  const invalidateNonceInput = getCancelSingleParams(parsedOrder.info.nonce)
  if (!permit2 || !provider) return
  try {
    return await permit2.invalidateUnorderedNonces(invalidateNonceInput.word, invalidateNonceInput.mask)
  } catch (error) {
    if (!didUserReject(error)) console.error(error)
    return undefined
  }
}
