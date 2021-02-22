import { gql } from '@apollo/client'

export const GET_ETH_USD_PRICE = gql`
  query {
    bundle(id: "1") {
      ethPrice
    }
  }
`

// == Get pair 24h volume data ==

interface PairDayData {
  dailyVolumeUSD: string
}

export interface Pair24hVolumeQueryResult {
  pairDayDatas: PairDayData[]
}

export const GET_PAIR_24H_VOLUME_USD = gql`
  query getPair24hVolume($pairAddress: ID!, $date: Int!) {
    pairDayDatas(first: 1, where: { pairAddress: $pairAddress, date: $date }) {
      dailyVolumeUSD
    }
  }
`

export const GET_PAIR_LIQUIDITY_USD = gql`
  query getPairLiquidityVolume($id: ID!) {
    pair(id: $id) {
      reserveUSD
    }
  }
`

// == Get non expired liquidity mining campaigns for given pair ids ==

interface NonExpiredLiquidityMiningCampaignRewardToken {
  derivedETH: string
}

export interface NonExpiredLiquidityMiningCampaign {
  contractAddress: string
  duration: string
  startsAt: string
  endsAt: string
  rewardAmounts: string[]
  rewardTokens: NonExpiredLiquidityMiningCampaignRewardToken[]
  locked: boolean
}

interface PairWithNonExpiredLiquidityMiningCampaigns {
  liquidityMiningCampaigns: NonExpiredLiquidityMiningCampaign[]
}

export interface PairsNonExpiredLiquidityMiningCampaignsQueryResult {
  pairs: PairWithNonExpiredLiquidityMiningCampaigns[]
}

export interface PairNonExpiredLiquidityMiningCampaignsQueryResult {
  pair: PairWithNonExpiredLiquidityMiningCampaigns
}

export const GET_PAIRS_NON_EXPIRED_LIQUIDITY_MINING_CAMPAIGNS = gql`
  query($ids: [ID!]!, $timestamp: BigInt!) {
    pairs(where: { id_in: $ids }) {
      liquidityMiningCampaigns(where: { endsAt_gt: $timestamp }) {
        contractAddress: id
        duration
        startsAt
        endsAt
        locked
        rewardTokens {
          derivedETH
        }
        rewardAmounts
      }
    }
  }
`

export const GET_PAIR_NON_EXPIRED_LIQUIDITY_MINING_CAMPAIGNS = gql`
  query($id: ID!, $timestamp: BigInt!) {
    pair(id: $id) {
      liquidityMiningCampaigns(where: { endsAt_gt: $timestamp }) {
        contractAddress: id
        duration
        startsAt
        endsAt
        locked
        rewardTokens {
          derivedETH
        }
        rewardAmounts
      }
    }
  }
`
