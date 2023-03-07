import { ChainId } from '@kyberswap/ks-sdk-core'
import { createReducer, nanoid } from '@reduxjs/toolkit'
import ksSettingApi from 'services/ksSetting'

import { AnnouncementTemplatePopup, PopupItemType } from 'components/Announcement/type'
import { NETWORKS_INFO, isEVM } from 'constants/networks'
import ethereumInfo from 'constants/networks/ethereum'
import { Topic } from 'hooks/useNotification'

import {
  ApplicationModal,
  addPopup,
  closeModal,
  removePopup,
  setAnnouncementDetail,
  setLoadingNotification,
  setOpenModal,
  setSubscribedNotificationTopic,
  updateBlockNumber,
  updateETHPrice,
  updateKNCPrice,
  updatePrommETHPrice,
  updateServiceWorker,
} from './actions'

type ETHPrice = {
  currentPrice?: string
  oneDayBackPrice?: string
  pricePercentChange?: number
}

interface ApplicationState {
  readonly blockNumber: { readonly [chainId: number]: number }
  readonly popupList: PopupItemType[]
  readonly openModal: ApplicationModal | null
  readonly ethPrice: ETHPrice
  readonly prommEthPrice: ETHPrice
  readonly kncPrice?: string
  readonly serviceWorkerRegistration: ServiceWorkerRegistration | null
  readonly notification: {
    isLoading: boolean
    topicGroups: Topic[]
    userInfo: {
      email: string
      telegram: string
    }
    announcementDetail: {
      selectedIndex: number | null // current announcement
      announcements: AnnouncementTemplatePopup[]
      hasMore: boolean // need to load more or not
    }
  }
  readonly config: {
    [chainId in ChainId]?: {
      rpc: string
      prochart: boolean
      blockSubgraph: string
      classicSubgraph: string
      elasticSubgraph: string
    }
  }
}
const initialStateNotification = {
  isLoading: false,
  topicGroups: [],
  userInfo: { email: '', telegram: '' },
  announcementDetail: {
    selectedIndex: null,
    announcements: [],
    hasMore: false,
  },
}
const initialState: ApplicationState = {
  blockNumber: {},
  popupList: [],
  openModal: null,
  ethPrice: {},
  prommEthPrice: {},
  kncPrice: '',
  serviceWorkerRegistration: null,
  notification: initialStateNotification,
  config: {},
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
      const { popupList } = state
      state.popupList = (key ? popupList.filter(popup => popup.key !== key) : popupList).concat([
        {
          key: key || nanoid(),
          content,
          removeAfterMs,
          popupType,
        },
      ])
    })
    .addCase(removePopup, (state, { payload: { key } }) => {
      state.popupList = state.popupList.filter(p => p.key !== key)
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
    })
    .addCase(setAnnouncementDetail, (state, { payload }) => {
      const notification = state.notification ?? initialStateNotification
      const announcementDetail = { ...notification.announcementDetail, ...payload }
      state.notification = {
        ...notification,
        announcementDetail,
      }
    })
    .addMatcher(ksSettingApi.endpoints.getKyberswapConfiguration.matchFulfilled, (state, action) => {
      const { chainId } = action.meta.arg.originalArgs
      const evm = isEVM(chainId)
      const data = action.payload.data.config
      const rpc = data?.rpc || NETWORKS_INFO[chainId].defaultRpcUrl

      const blockSubgraph = evm
        ? data?.blockSubgraph || NETWORKS_INFO[chainId].defaultBlockSubgraph
        : ethereumInfo.defaultBlockSubgraph

      const classicSubgraph = evm
        ? data?.classicSubgraph || NETWORKS_INFO[chainId].classic.defaultSubgraph
        : ethereumInfo.classic.defaultSubgraph

      const elasticSubgraph = evm
        ? data?.elasticSubgraph || NETWORKS_INFO[chainId].elastic.defaultSubgraph
        : ethereumInfo.elastic.defaultSubgraph

      if (!state.config) state.config = {}
      state.config = {
        ...state.config,
        [chainId]: {
          rpc,
          prochart: data?.prochart || false,
          blockSubgraph,
          elasticSubgraph,
          classicSubgraph,
        },
      }
    }),
)
