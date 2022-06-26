import { createAction } from '@reduxjs/toolkit'

export type CampaignStatus = 'Upcoming' | 'Ongoing' | 'Ended'

export enum RewardState {
  RewardStateReady,
  RewardStateRewarded,
}

export type RewardSingle = {
  type: 'Single'
  rank?: number
  amount?: number
  token?: string
}

export type RewardRange = {
  type: 'Range'
  from?: number
  to?: number
  amount?: number
  token?: string
}

export type RewardRandom = {
  type: 'Random'
  from?: number
  to?: number
  nWinners?: number
  amount?: number
  token?: string
}

export type RewardDistribution = RewardSingle | RewardRange | RewardRandom

export interface CampaignLeaderboard {
  numberOfParticipants: number
  userRank: number
  ranking: {
    address: string
    point: number
    rank: number
    rewardAmount: number
    token: string
  }[]
}

export interface CampaignData {
  id: number
  name: string
  startTime: number
  endTime: number
  desktopBanner: string
  mobileBanner: string
  status: CampaignStatus
  rules: string
  termsAndConditions: string
  otherDetails: string
  rewardDetails: string
  isRewardShown: boolean
  enterNowUrl: string
  rewardDistribution: RewardDistribution[]
  rewardState: RewardState
  chainIds: string
  rewardChainIds: string
}

export const setCampaignData = createAction<{ campaigns: CampaignData[] }>('campaigns/setCampaignData')
export const setLoadingCampaignData = createAction<boolean>('campaigns/setLoadingCampaignData')

export const setSelectedCampaign = createAction<{ campaign: CampaignData }>('campaigns/setSelectedCampaign')

export const setSelectedCampaignLeaderboard = createAction<{ leaderboard: CampaignLeaderboard }>(
  'campaigns/setSelectedCampaignLeaderboard',
)
export const setLoadingSelectedCampaignLeaderboard = createAction<boolean>(
  'campaigns/setLoadingSelectedCampaignLeaderboard',
)
export const setSelectedCampaignLeaderboardPageNumber = createAction<number>(
  'campaigns/setSelectedCampaignLeaderboardPageNumber',
)
export const setSelectedCampaignLeaderboardLookupAddress = createAction<string>(
  'campaigns/setSelectedCampaignLeaderboardLookupAddress',
)
