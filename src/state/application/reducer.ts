import { createReducer, nanoid } from '@reduxjs/toolkit'

import { Topic } from 'hooks/useNotification'

import {
  ApplicationModal,
  PopupContent,
  PopupType,
  addPopup,
  closeModal,
  removePopup,
  setLoadingNotification,
  setOpenModal,
  setSubscribedNotificationTopic,
  updateBlockNumber,
  updateETHPrice,
  updateKNCPrice,
  updatePrommETHPrice,
  updateServiceWorker,
} from './actions'

type PopupList = Array<{
  key: string
  show: boolean
  content: PopupContent
  removeAfterMs: number | null
  popupType: PopupType
}>

type ETHPrice = {
  currentPrice?: string
  oneDayBackPrice?: string
  pricePercentChange?: number
}

export interface ApplicationState {
  readonly blockNumber: { readonly [chainId: number]: number }
  readonly popupList: PopupList
  readonly openModal: ApplicationModal | null
  readonly ethPrice: ETHPrice
  readonly prommEthPrice: ETHPrice
  readonly kncPrice?: string
  readonly serviceWorkerRegistration: ServiceWorkerRegistration | null
  readonly notification: {
    isLoading: boolean
    topicGroups: Topic[]
    userInfo: { email: string; telegram: string }
  }
}
const initialStateNotification = { isLoading: false, topicGroups: [], userInfo: { email: '', telegram: '' } }
const initialState: ApplicationState = {
  blockNumber: {},
  popupList: [],
  openModal: null,
  ethPrice: {},
  prommEthPrice: {},
  kncPrice: '',
  serviceWorkerRegistration: null,
  notification: initialStateNotification,
}

export default createReducer(initialState, builder =>
  builder
    .addCase(updateBlockNumber, (state, action) => {
      const { chainId, blockNumber } = action.payload
      if (typeof state.blockNumber[chainId] !== 'number') {
        state.blockNumber[chainId] = blockNumber
      } else {
        state.blockNumber[chainId] = Math.max(blockNumber, state.blockNumber[chainId])
      }
    })
    .addCase(setOpenModal, (state, action) => {
      state.openModal = action.payload
    })
    .addCase(closeModal, (state, action) => {
      if (state.openModal === action.payload) {
        state.openModal = null
      }
    })
    .addCase(addPopup, (state, { payload: { content, key, removeAfterMs = 15000, popupType } }) => {
      state.popupList = (key ? state.popupList.filter(popup => popup.key !== key) : state.popupList).concat([
        {
          key: key || nanoid(),
          show: true,
          content,
          removeAfterMs,
          popupType,
        },
      ])
    })
    .addCase(removePopup, (state, { payload: { key } }) => {
      state.popupList.forEach(p => {
        if (p.key === key) {
          p.show = false
        }
      })
    })
    .addCase(updatePrommETHPrice, (state, { payload: { currentPrice, oneDayBackPrice, pricePercentChange } }) => {
      state.prommEthPrice.currentPrice = currentPrice
      state.prommEthPrice.oneDayBackPrice = oneDayBackPrice
      state.prommEthPrice.pricePercentChange = pricePercentChange
    })

    .addCase(updateETHPrice, (state, { payload: { currentPrice, oneDayBackPrice, pricePercentChange } }) => {
      state.ethPrice.currentPrice = currentPrice
      state.ethPrice.oneDayBackPrice = oneDayBackPrice
      state.ethPrice.pricePercentChange = pricePercentChange
    })
    .addCase(updateKNCPrice, (state, { payload: kncPrice }) => {
      state.kncPrice = kncPrice
    })
    .addCase(updateServiceWorker, (state, { payload }) => {
      state.serviceWorkerRegistration = payload
    })

    // ------ notification subscription ------
    .addCase(setLoadingNotification, (state, { payload: isLoading }) => {
      const notification = state.notification ?? initialStateNotification
      state.notification = { ...notification, isLoading }
    })
    .addCase(setSubscribedNotificationTopic, (state, { payload: { topicGroups, userInfo } }) => {
      const notification = state.notification ?? initialStateNotification
      state.notification = {
        ...notification,
        topicGroups: topicGroups ?? notification.topicGroups,
        userInfo: userInfo ?? notification.userInfo,
      }
    }),
)
