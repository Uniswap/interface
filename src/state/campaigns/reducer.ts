import { createReducer } from '@reduxjs/toolkit'

import {
  CampaignData,
  CampaignLeaderboard,
  setCampaignData,
  setLoadingCampaignData,
  setLoadingSelectedCampaignLeaderboard,
  setSelectedCampaign,
  setSelectedCampaignLeaderboard,
} from './actions'

export interface CampaignsState {
  readonly data: CampaignData[]
  readonly selectedCampaign: CampaignData | undefined
  readonly selectedCampaignLeaderboard: CampaignLeaderboard | undefined
  readonly loadingCampaignData: boolean
}

const initialState: CampaignsState = {
  data: [],
  selectedCampaign: undefined,
  selectedCampaignLeaderboard: undefined,
  loadingCampaignData: false,
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
    }),
)
