import { TransactionRequest } from '@ethersproject/abstract-provider'
import { Web3Provider } from '@ethersproject/providers'
import { t } from '@lingui/macro'
import { ChainId } from '@uniswap/sdk-core'
import { DutchOrder } from '@uniswap/uniswapx-sdk'
import { getYear, isSameDay, isSameMonth, isSameWeek, isSameYear } from 'date-fns'
import { TransactionStatus } from 'graphql/data/__generated__/types-and-hooks'
import PERMIT2_ABI from 'uniswap/src/abis/permit2.json'
import { Permit2 } from 'uniswap/src/abis/types'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'

import { PERMIT2_ADDRESS } from '@uniswap/permit2-sdk'
import { BigNumber, ContractTransaction } from 'ethers/lib/ethers'
import { useContract } from 'hooks/useContract'
import { useCallback } from 'react'
import { SignatureType } from 'state/signatures/types'
import { useAsyncData } from 'utilities/src/react/hooks'
import { Activity } from './types'

interface ActivityGroup {
  title: string
  transactions: Array<Activity>
}

const sortActivities = (a: Activity, b: Activity) => b.timestamp - a.timestamp

export const createGroups = (activities: Array<Activity> = [], hideSpam = false) => {
  if (activities.length === 0) return []
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

    const addedTime = activity.timestamp * 1000
    if (activity.status === TransactionStatus.Pending) {
      switch (activity.offchainOrderDetails?.type) {
        case SignatureType.SIGN_LIMIT:
          // limit orders are only displayed in their own pane
          break
        default:
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

  return transactionGroups.filter(({ transactions }) => transactions.length > 0)
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

function getCancelMultipleUniswapXOrdersParams(encodedOrders: string[], chainId: ChainId) {
  const nonces = encodedOrders
    .map((encodedOrder) => DutchOrder.parse(encodedOrder, chainId))
    .map((order) => order.info.nonce)
  return getCancelMultipleParams(nonces)
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
  const cancelParams = getCancelMultipleUniswapXOrdersParams(encodedOrders, chainId)
  if (!permit2 || !provider) return
  try {
    const transactions: ContractTransaction[] = []
    for (const params of cancelParams) {
      const tx = await permit2.invalidateUnorderedNonces(params.word, params.mask)
      transactions.push(tx)
    }
    return transactions
  } catch (error) {
    if (!didUserReject(error)) console.error(error)
    return undefined
  }
}

async function getCancelMultipleUniswapXOrdersTransaction(
  encodedOrders: string[],
  chainId: ChainId,
  permit2: Permit2
): Promise<TransactionRequest | undefined> {
  const cancelParams = getCancelMultipleUniswapXOrdersParams(encodedOrders, chainId)
  if (!permit2 || cancelParams.length === 0) return
  try {
    const tx = await permit2.populateTransaction.invalidateUnorderedNonces(cancelParams[0].word, cancelParams[0].mask)
    return {
      ...tx,
      chainId,
    }
  } catch (error) {
    console.error('could not populate cancel transaction')
    return undefined
  }
}

export function useCreateCancelTransactionRequest(
  params:
    | {
        encodedOrders?: string[]
        chainId: ChainId
      }
    | undefined
): TransactionRequest | undefined {
  const permit2 = useContract<Permit2>(PERMIT2_ADDRESS, PERMIT2_ABI, true)
  const transactionFetcher = useCallback(() => {
    if (!params || !params.encodedOrders || params.encodedOrders.filter(Boolean).length === 0 || !permit2) return
    return getCancelMultipleUniswapXOrdersTransaction(params.encodedOrders, params.chainId, permit2)
  }, [params, permit2])

  return useAsyncData(transactionFetcher).data
}
