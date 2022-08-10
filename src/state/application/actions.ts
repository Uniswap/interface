import { ChainId } from '@kyberswap/ks-sdk-core'
import { createAction } from '@reduxjs/toolkit'
import { TokenList } from '@uniswap/token-lists'

import { NotificationType } from './hooks'

export type PopupContentTxn = {
  hash: string
  notiType: NotificationType
  type?: string
  summary?: string
}
export type PopupContentListUpdate = {
  listUrl: string
  oldList: TokenList
  newList: TokenList
  auto: boolean
}
export type PopupContentSimple = {
  title: string
  summary?: string
  type: NotificationType
}

export enum PopupType {
  TRANSACTION,
  LIST_UPDATE,
  SIMPLE,
}

export type PopupContent = PopupContentTxn | PopupContentListUpdate | PopupContentSimple

export enum ApplicationModal {
  NETWORK,
  WALLET,
  SETTINGS,
  TRANSACTION_SETTINGS,
  SELF_CLAIM,
  ADDRESS_CLAIM,
  CLAIM_POPUP,
  MENU,
  DELEGATE,
  VOTE,
  PRICE_RANGE,
  POOL_DETAIL,

  MOBILE_LIVE_CHART,
  MOBILE_TRADE_ROUTES,
  MOBILE_TOKEN_INFO,

  REFERRAL_NETWORK,
  SHARE,
  TRENDING_SOON_SORTING,
  TRUESIGHT_NETWORK,
  TRENDING_SOON_TOKEN_DETAIL,
  COMMUNITY,
  CONTRACT_ADDRESS,
  FAUCET_POPUP,
  SELECT_CAMPAIGN,
  UNSUBSCRIBE_TRUESIGHT,
  YOUR_CAMPAIGN_TRANSACTIONS,
}

export const updateBlockNumber = createAction<{ chainId: number; blockNumber: number }>('application/updateBlockNumber')
export const setOpenModal = createAction<ApplicationModal | null>('application/setOpenModal')
export const addPopup = createAction<{
  key?: string
  removeAfterMs?: number | null
  content: PopupContent
  popupType: PopupType
}>('application/addPopup')
export const removePopup = createAction<{ key: string }>('application/removePopup')
export const updatePrommETHPrice = createAction<{
  currentPrice: string
  oneDayBackPrice: string
  pricePercentChange: number
}>('application/updatePrommETHPrice')

export const updateETHPrice = createAction<{
  currentPrice: string
  oneDayBackPrice: string
  pricePercentChange: number
}>('application/updateETHPrice')

export const updateKNCPrice = createAction<string | undefined>('application/updateKNCPrice')

export const updateChainIdWhenNotConnected = createAction<ChainId>('application/updateChainIdWhenNotConnected')
