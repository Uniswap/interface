import { createReducer } from '@reduxjs/toolkit'

import {
  CampaignData,
  CampaignLeaderboard,
  setCampaignData,
  setLoadingCampaignData,
  setLoadingCampaignDataError,
  setLoadingSelectedCampaignLeaderboard,
  setSelectedCampaign,
  setSelectedCampaignLeaderboard,
  setSelectedCampaignLeaderboardLookupAddress,
  setSelectedCampaignLeaderboardPageNumber,
} from './actions'

export interface CampaignsState {
  readonly data: CampaignData[]
  readonly loadingCampaignData: boolean
  readonly loadingCampaignDataError: Error | undefined

  readonly selectedCampaign: CampaignData | undefined

  readonly selectedCampaignLeaderboard: CampaignLeaderboard | undefined
  readonly selectedCampaignLeaderboardPageNumber: number
  readonly selectedCampaignLeaderboardLookupAddress: string
}

const initialState: CampaignsState = {
  data: [],
  loadingCampaignData: false,
  loadingCampaignDataError: undefined,

  selectedCampaign: undefined,

  selectedCampaignLeaderboard: undefined,
  selectedCampaignLeaderboardPageNumber: 0,
  selectedCampaignLeaderboardLookupAddress: '',
}

export default createReducer<CampaignsState>(initialState, builder =>
  builder
    .addCase(setCampaignData, (state, { payload: { campaigns } }) => {
      return {
        ...state,
        data: campaigns,
      }
    })
    .addCase(setLoadingCampaignData, (state, { payload: loading }) => {
      return {
        ...state,
        loadingCampaignData: loading,
      }
    })
    .addCase(setLoadingCampaignDataError, (state, { payload: error }) => {
      return {
        ...state,
        loadingCampaignDataError: error,
      }
    })
    .addCase(setSelectedCampaign, (state, { payload: { campaign } }) => {
      return { ...state, selectedCampaign: campaign }
    })
    .addCase(setSelectedCampaignLeaderboard, (state, { payload: { leaderboard } }) => {
      return {
        ...state,
        selectedCampaignLeaderboard: leaderboard,
      }
    })
    .addCase(setLoadingSelectedCampaignLeaderboard, (state, { payload: loading }) => {
      return {
        ...state,
        setLoadingSelectedCampaignLeaderboard: loading,
      }
    })
    .addCase(setSelectedCampaignLeaderboardPageNumber, (state, { payload: pageNumber }) => {
      return {
        ...state,
        selectedCampaignLeaderboardPageNumber: pageNumber,
      }
    })
    .addCase(setSelectedCampaignLeaderboardLookupAddress, (state, { payload: lookupAddress }) => {
      return {
        ...state,
        selectedCampaignLeaderboardLookupAddress: lookupAddress,
      }
    }),
)
