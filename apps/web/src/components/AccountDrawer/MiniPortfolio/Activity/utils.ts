import { Web3Provider } from '@ethersproject/providers'
import { t } from '@lingui/macro'
import { ChainId } from '@uniswap/sdk-core'
import { DutchOrder, getCancelSingleParams } from '@uniswap/uniswapx-sdk'
import { getYear, isSameDay, isSameMonth, isSameWeek, isSameYear } from 'date-fns'
import { TransactionStatus } from 'graphql/data/__generated__/types-and-hooks'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'
import { Permit2 } from 'wallet/src/abis/types'

import { BigNumber } from 'ethers/lib/ethers'
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

// TODO(WEB-3594): just use the uniswapx-sdk when getCancelMultipleParams is available

interface SplitNonce {
  word: BigNumber
  bitPos: BigNumber
}

function splitNonce(nonce: BigNumber): SplitNonce {
  const word = nonce.div(256)
  const bitPos = nonce.mod(256)
  return { word, bitPos }
}

// Get parameters to cancel multiple nonces
// source: https://github.com/Uniswap/uniswapx-sdk/pull/112
function getCancelMultipleParams(noncesToCancel: BigNumber[]): {
  word: BigNumber
  mask: BigNumber
}[] {
  const splitNonces = noncesToCancel.map(splitNonce)
  const splitNoncesByWord: { [word: string]: SplitNonce[] } = {}
  splitNonces.forEach((splitNonce) => {
    const word = splitNonce.word.toString()
    if (!splitNoncesByWord[word]) {
      splitNoncesByWord[word] = []
    }
    splitNoncesByWord[word].push(splitNonce)
  })
  return Object.entries(splitNoncesByWord).map(([word, splitNonce]) => {
    let mask = BigNumber.from(0)
    splitNonce.forEach((splitNonce) => {
      mask = mask.or(BigNumber.from(2).pow(splitNonce.bitPos))
    })
    return { word: BigNumber.from(word), mask }
  })
}

export async function cancelMultipleUniswapXOrders({
  encodedOrders,
  chainId,
  permit2,
  provider,
}: {
  encodedOrders: string[]
  chainId: ChainId
  permit2: Permit2 | null
  provider?: Web3Provider
}) {
  const parsedOrders = encodedOrders.map((encodedOrder) => DutchOrder.parse(encodedOrder, chainId))
  const nonces: BigNumber[] = parsedOrders.map((order) => order.info.nonce)
  const cancelParams = getCancelMultipleParams(nonces)
  if (!permit2 || !provider) return
  try {
    for (const params of cancelParams) {
      await permit2.invalidateUnorderedNonces(params.word, params.mask)
    }
    return true
  } catch (error) {
    if (!didUserReject(error)) console.error(error)
    return undefined
  }
}
