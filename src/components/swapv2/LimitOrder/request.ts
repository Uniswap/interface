import { ChainId } from '@kyberswap/ks-sdk-core'
import axios from 'axios'
import { stringify } from 'querystring'

import { LIMIT_ORDER_API_READ, LIMIT_ORDER_API_WRITE } from 'constants/env'

import { LimitOrder, LimitOrderStatus } from './type'

const formatData = (data: any) => data.data.data
export const getListOrder = (
  params: any,
  signal: AbortSignal,
): Promise<{ orders: LimitOrder[]; pagination: { totalItems: number } }> => {
  return fetch(`${LIMIT_ORDER_API_READ}/v1/orders?${stringify(params)}`, { signal })
    .then(data => data.json())
    .then(data => data.data)
}

export const submitOrder = (data: any) => {
  return axios.post(`${LIMIT_ORDER_API_WRITE}/v1/orders`, data).then(formatData)
}

export const hashOrder = (data: any) => {
  return axios.post(`${LIMIT_ORDER_API_WRITE}/v1/orders/hash`, data).then(formatData)
}

let activeMakingAmountCache: { [address: string]: string } = {}
export const clearCacheActiveMakingAmount = () => {
  activeMakingAmountCache = {}
}

export const getTotalActiveMakingAmount = async (
  chainId: ChainId,
  tokenAddress: string,
  account: string,
): Promise<{ activeMakingAmount: string }> => {
  if (activeMakingAmountCache[tokenAddress]) {
    return { activeMakingAmount: activeMakingAmountCache[tokenAddress] }
  }
  return axios
    .get(`${LIMIT_ORDER_API_READ}/v1/orders/active-making-amount`, {
      params: {
        chainId: chainId + '',
        makerAsset: tokenAddress,
        maker: account,
      },
    })
    .then(formatData)
    .then(data => {
      activeMakingAmountCache[tokenAddress] = data.activeMakingAmount
      return data
    })
}

export const getEncodeData = (orderIds: number[], isCancelAll = false) => {
  const method = isCancelAll ? 'increase-nonce' : 'cancel-batch-orders'
  return axios.post(`${LIMIT_ORDER_API_READ}/v1/encode/${method}`, isCancelAll ? {} : { orderIds }).then(formatData)
}

const mapPath: Partial<Record<LimitOrderStatus, string>> = {
  [LimitOrderStatus.CANCELLED]: 'cancelled',
  [LimitOrderStatus.EXPIRED]: 'expired',
  [LimitOrderStatus.FILLED]: 'filled',
}
export const ackNotificationOrder = (docIds: string[], maker: string, chainId: ChainId, type: LimitOrderStatus) => {
  return axios
    .delete(`${LIMIT_ORDER_API_WRITE}/v1/events/${mapPath[type]}`, {
      data: { maker, chainId: chainId + '', [type === LimitOrderStatus.FILLED ? 'uuids' : 'docIds']: docIds },
    })
    .then(formatData)
}

export const insertCancellingOrder = (data: {
  orderIds?: number[]
  nonce?: number
  maker: string
  chainId: string
  txHash: string
}) => {
  return axios.post(`${LIMIT_ORDER_API_WRITE}/v1/orders/cancelling`, data).then(formatData)
}
