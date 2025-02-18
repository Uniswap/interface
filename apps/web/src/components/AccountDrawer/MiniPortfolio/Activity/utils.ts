import { TransactionRequest } from '@ethersproject/abstract-provider'
import { Web3Provider } from '@ethersproject/providers'
import { permit2Address } from '@uniswap/permit2-sdk'
import {
  CosignedPriorityOrder,
  CosignedV2DutchOrder,
  CosignedV3DutchOrder,
  DutchOrder,
  getCancelMultipleParams,
} from '@uniswap/uniswapx-sdk'
import { Activity } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import { getYear, isSameDay, isSameMonth, isSameWeek, isSameYear } from 'date-fns'
import { ContractTransaction } from 'ethers/lib/ethers'
import { useAccount } from 'hooks/useAccount'
import { useContract } from 'hooks/useContract'
import { useEthersWeb3Provider } from 'hooks/useEthersProvider'
import useSelectChain from 'hooks/useSelectChain'
import { useCallback } from 'react'
import store from 'state'
import { updateSignature } from 'state/signatures/reducer'
import { SignatureType, UniswapXOrderDetails } from 'state/signatures/types'
import { UniswapXOrderStatus } from 'types/uniswapx'
import PERMIT2_ABI from 'uniswap/src/abis/permit2.json'
import { Permit2 } from 'uniswap/src/abis/types'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { InterfaceEventNameLocal } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import i18n from 'uniswap/src/i18n'
import { getContract } from 'utilities/src/contracts/getContract'
import { logger } from 'utilities/src/logger/logger'
import { useAsyncData } from 'utilities/src/react/hooks'
import { WrongChainError } from 'utils/errors'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'

interface ActivityGroup {
  title: string
  transactions: Array<Activity>
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
    { title: i18n.t('common.pending'), transactions: pending.sort(sortActivities) },
    { title: i18n.t('common.today'), transactions: today.sort(sortActivities) },
    { title: i18n.t('common.thisWeek'), transactions: currentWeek.sort(sortActivities) },
    { title: i18n.t('common.thisMonth'), transactions: last30Days.sort(sortActivities) },
    { title: i18n.t('common.thisYear'), transactions: currentYear.sort(sortActivities) },
    ...sortedYears,
  ]

  return transactionGroups.filter(({ transactions }) => transactions.length > 0)
}

function getCancelMultipleUniswapXOrdersParams(
  orders: Array<{ encodedOrder: string; type: SignatureType }>,
  chainId: UniverseChainId,
) {
  const nonces = orders
    .map(({ encodedOrder, type }) => {
      switch (type) {
        case SignatureType.SIGN_UNISWAPX_V2_ORDER:
          return CosignedV2DutchOrder.parse(encodedOrder, chainId)
        case SignatureType.SIGN_UNISWAPX_V3_ORDER:
          return CosignedV3DutchOrder.parse(encodedOrder, chainId)
        case SignatureType.SIGN_PRIORITY_ORDER:
          return CosignedPriorityOrder.parse(encodedOrder, chainId)
        default:
          return DutchOrder.parse(encodedOrder, chainId)
      }
    })
    .map((order) => order.info.nonce)
  return getCancelMultipleParams(nonces)
}

export function useCancelMultipleOrdersCallback(
  orders?: Array<UniswapXOrderDetails>,
): () => Promise<ContractTransaction[] | undefined> {
  const provider = useEthersWeb3Provider({ chainId: orders?.[0]?.chainId })
  const account = useAccount()
  const selectChain = useSelectChain()

  return useCallback(async () => {
    if (!orders || orders.length === 0) {
      return undefined
    }

    sendAnalyticsEvent(InterfaceEventNameLocal.UniswapXOrderCancelInitiated, {
      orders: orders.map((order) => order.orderHash),
    })

    return cancelMultipleUniswapXOrders({
      orders: orders.map((order) => {
        return { encodedOrder: order.encodedOrder as string, type: order.type as SignatureType }
      }),
      signer: account.address,
      provider,
      chainId: orders?.[0].chainId,
      selectChain,
    }).then((result) => {
      orders.forEach((order) => {
        if (order.status === UniswapXOrderStatus.FILLED) {
          return
        }
        store.dispatch(updateSignature({ ...order, status: UniswapXOrderStatus.PENDING_CANCELLATION }))
      })
      return result
    })
  }, [orders, account.address, provider, selectChain])
}

async function cancelMultipleUniswapXOrders({
  orders,
  chainId,
  signer,
  provider,
  selectChain,
}: {
  orders: Array<{ encodedOrder: string; type: SignatureType }>
  chainId: UniverseChainId
  signer?: string
  provider?: Web3Provider
  selectChain: (targetChain: UniverseChainId) => Promise<boolean>
}) {
  const cancelParams = getCancelMultipleUniswapXOrdersParams(orders, chainId)
  const permit2 = provider && getContract(permit2Address(chainId), PERMIT2_ABI, provider, signer)
  if (!permit2 || !provider) {
    return undefined
  }
  try {
    const switchChainResult = await selectChain(chainId)
    if (!switchChainResult) {
      throw new WrongChainError()
    }
    const transactions: ContractTransaction[] = []
    for (const params of cancelParams) {
      const tx = await permit2.invalidateUnorderedNonces(params.word, params.mask)
      transactions.push(tx)
    }
    return transactions
  } catch (error) {
    if (!didUserReject(error)) {
      logger.debug('utils', 'cancelMultipleUniswapXOrders', 'Failed to cancel multiple orders', { error, orders })
    }
    return undefined
  }
}

async function getCancelMultipleUniswapXOrdersTransaction(
  orders: Array<{ encodedOrder: string; type: SignatureType }>,
  chainId: UniverseChainId,
  permit2: Permit2,
): Promise<TransactionRequest | undefined> {
  const cancelParams = getCancelMultipleUniswapXOrdersParams(orders, chainId)
  if (!permit2 || cancelParams.length === 0) {
    return undefined
  }
  try {
    const tx = await permit2.populateTransaction.invalidateUnorderedNonces(cancelParams[0].word, cancelParams[0].mask)
    return {
      ...tx,
      chainId,
    }
  } catch (error) {
    const wrappedError = new Error('could not populate cancel transaction', { cause: error })
    logger.debug('utils', 'getCancelMultipleUniswapXOrdersTransaction', wrappedError.message, {
      error: wrappedError,
      orders,
    })
    return undefined
  }
}

export function useCreateCancelTransactionRequest(
  params:
    | {
        orders: Array<{ encodedOrder: string; type: SignatureType }>
        chainId: UniverseChainId
      }
    | undefined,
): TransactionRequest | undefined {
  const permit2 = useContract<Permit2>(permit2Address(params?.chainId), PERMIT2_ABI, true)
  const transactionFetcher = useCallback(() => {
    if (
      !params ||
      !params.orders ||
      params.orders.filter(({ encodedOrder }) => Boolean(encodedOrder)).length === 0 ||
      !permit2
    ) {
      return undefined
    }
    return getCancelMultipleUniswapXOrdersTransaction(params.orders, params.chainId, permit2)
  }, [params, permit2])

  return useAsyncData(transactionFetcher).data
}

export function isLimitCancellable(order: UniswapXOrderDetails) {
  return [UniswapXOrderStatus.OPEN, UniswapXOrderStatus.INSUFFICIENT_FUNDS].includes(order.status)
}
