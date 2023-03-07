import { ChainId, Fraction } from '@kyberswap/ks-sdk-core'
import { createAction } from '@reduxjs/toolkit'

import { SerializedToken } from 'state/user/actions'

export enum CampaignStatus {
  ONGOING = 'Ongoing',
  UPCOMING = 'Upcoming',
  ENDED = 'Ended',
}

export enum CampaignState {
  CampaignStateReady,
  CampaignStateFinalizedLeaderboard,
  CampaignStateDistributedRewards,
}

export enum CampaignUserInfoStatus {
  Eligible = 'eligible',
  Ineligible = 'ineligible',
  Banned = 'banned',
}

type CampaignUserInfo = {
  address: string
  tradingVolume: number
  tradingNumber: number
  rankNo: number
  status: CampaignUserInfoStatus
}

type RewardSingle = {
  type: 'Single'
  amount: string
  token: SerializedToken
  rewardInUSD: boolean
  rank: number
}

type RewardRange = {
  type: 'Range'
  amount: string
  token: SerializedToken
  rewardInUSD: boolean
  from: number
  to: number
}

export type RewardRandom = {
  type: 'Random'
  amount: string
  token: SerializedToken
  rewardInUSD: boolean
  from?: number
  to?: number
  nWinners?: number
}

export type RewardDistribution = RewardSingle | RewardRange | RewardRandom

export interface CampaignLeaderboardRanking {
  userAddress: string
  totalPoint: number
  rankNo: number
  rewardAmount: Fraction
  rewardAmountUsd: Fraction
  rewardInUSD: boolean
  token: SerializedToken
}

export interface CampaignLeaderboardReward {
  rewardAmount: Fraction
  ref: string
  claimed: boolean
  token: SerializedToken
}

export interface CampaignLeaderboard {
  totalParticipants: number
  userRank: number
  finalizedAt: number
  distributedRewardsAt: number
  rankings: CampaignLeaderboardRanking[]
  rewards: CampaignLeaderboardReward[]
}

export interface CampaignLuckyWinner {
  userAddress: string
  rewardAmount: Fraction
  token: SerializedToken
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
  eligibleTokens: SerializedToken[]
  chainIds: string
  rewardChainIds: string
  tradingVolumeRequired: number
  userInfo?: CampaignUserInfo
  tradingNumberRequired: number
  leaderboard: CampaignLeaderboard | undefined
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

export const setClaimingCampaignRewardId = createAction<number | null>('campaigns/setClaimingCampaignRewardId')

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

export const setRecaptchaCampaignId = createAction<number | undefined>('campaigns/setRecaptchaCampaignId')
export const setRecaptchaCampaignLoading = createAction<boolean>('campaigns/setRecaptchaCampaignLoading')
