import { createAction } from '@reduxjs/toolkit'

import { PopupContent, PopupType } from 'components/Announcement/type'
import { Topic } from 'hooks/useNotification'

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
  REGISTER_CAMPAIGN_CAPTCHA,
  REGISTER_CAMPAIGN_SUCCESS,
  NOTIFICATION_SUBSCRIPTION,
  NOTIFICATION_CENTER,
  YOUR_CAMPAIGN_TRANSACTIONS,
  ETH_POW_ACK,

  // KyberDAO
  SWITCH_TO_ETHEREUM,
  DELEGATE_CONFIRM,
  YOUR_TRANSACTIONS_STAKE_KNC,
  MIGRATE_KNC,
  KYBER_DAO_CLAIM,

  TIME_DROPDOWN,
}

export const updateBlockNumber = createAction<{ chainId: number; blockNumber: number }>('application/updateBlockNumber')
export const setOpenModal = createAction<ApplicationModal | null>('application/setOpenModal')
export const closeModal = createAction<ApplicationModal | null>('application/closeModal')
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

export const updateServiceWorker = createAction<ServiceWorkerRegistration>('application/updateServiceWorker')

export const setSubscribedNotificationTopic = createAction<{
  topicGroups: Topic[]
  userInfo: { email: string; telegram: string }
}>('application/setSubscribedNotificationTopic')

export const setLoadingNotification = createAction<boolean>('application/setLoadingNotification')
