import { createAction } from '@reduxjs/toolkit'
import { ChainId } from '@kyberswap/ks-sdk-core'

export type CampaignStatus = 'Upcoming' | 'Ongoing' | 'Ended'

export enum CampaignState {
  CampaignStateReady,
  CampaignStateFinalizedLeaderboard,
  CampaignStateDistributedRewards,
}

export type RewardSingle = {
  type: 'Single'
  rank?: number
  amount?: number
  tokenSymbol?: string
}

export type RewardRange = {
  type: 'Range'
  from?: number
  to?: number
  amount?: number
  tokenSymbol?: string
}

export type RewardRandom = {
  type: 'Random'
  from?: number
  to?: number
  nWinners?: number
  amount?: number
  tokenSymbol?: string
}

export type RewardDistribution = RewardSingle | RewardRange | RewardRandom

export interface CampaignLeaderboardRankings {
  userAddress: string
  totalPoint: number
  rankNo: number
  rewardAmount: number
  tokenSymbol: string
}

export interface CampaignLeaderboardRewards {
  rewardAmount: number
  tokenSymbol: string
  ref: string
  claimed: boolean
}

export interface CampaignLeaderboard {
  numberOfParticipants: number
  userRank: number
  rankings: CampaignLeaderboardRankings[]
  rewards: CampaignLeaderboardRewards[]
}

export interface CampaignLuckyWinner {
  userAddress: string
  rewardAmount: string
  tokenAddress: string
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
  campaignState: CampaignState
  chainIds: string
  rewardChainIds: string
  tradingVolumeRequired: number
}

export interface CampaignProofData {
  id: number
  chainId: ChainId
  txPoint: string
  utcTimestamp: number
  txHash: string
}

export const setCampaignData = createAction<{ campaigns: CampaignData[] }>('campaigns/setCampaignData')
export const setLoadingCampaignData = createAction<boolean>('campaigns/setLoadingCampaignData')
export const setLoadingCampaignDataError = createAction<Error | undefined>('campaigns/setLoadingCampaignDataError')

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

export const setSelectedCampaignLuckyWinners = createAction<{ luckyWinners: CampaignLuckyWinner[] }>(
  'campaigns/setSelectedCampaignLuckyWinners',
)
export const setLoadingSelectedCampaignLuckyWinners = createAction<boolean>(
  'campaigns/setLoadingSelectedCampaignLuckyWinners',
)
export const setSelectedCampaignLuckyWinnersPageNumber = createAction<number>(
  'campaigns/setSelectedCampaignLuckyWinnersPageNumber',
)
export const setSelectedCampaignLuckyWinnersLookupAddress = createAction<string>(
  'campaigns/setSelectedCampaignLuckyWinnersLookupAddress',
)
