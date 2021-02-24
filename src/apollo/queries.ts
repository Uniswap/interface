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

interface NonExpiredLiquidityMiningCampaignRewardToken {
  derivedETH: string
}

export interface RawToken {
  address: string
  symbol: string
  name: string
  decimals: string
}

export interface NonExpiredLiquidityMiningCampaign {
  address: string
  duration: string
  startsAt: string
  endsAt: string
  rewardAmounts: string[]
  stakedAmount: string
  rewardTokens: NonExpiredLiquidityMiningCampaignRewardToken[]
  locked: boolean
}

export interface PairWithNonExpiredLiquidityMiningCampaigns {
  address: string
  reserve0: string
  reserve1: string
  reserveETH: string
  totalSupply: string
  token0: RawToken
  token1: RawToken
  liquidityMiningCampaigns: NonExpiredLiquidityMiningCampaign[]
}

export interface PairsWithNonExpiredLiquidityMiningCampaignsQueryResult {
  pairs: PairWithNonExpiredLiquidityMiningCampaigns[]
}

export const GET_PAIRS_WITH_NON_EXPIRED_LIQUIDITY_MINING_CAMPAIGNS = gql`
  query($timestamp: BigInt!) {
    pairs {
      address: id
      reserve0
      reserve1
      reserveETH
      totalSupply
      token0 {
        address: id
        name
        symbol
        decimals
      }
      token1 {
        address: id
        name
        symbol
        decimals
      }
      liquidityMiningCampaigns(where: { endsAt_gt: $timestamp }) {
        address: id
        duration
        startsAt
        endsAt
        locked
        rewardTokens {
          derivedETH
        }
        stakedAmount
        rewardAmounts
      }
    }
  }
`

export const GET_PAIRS_BY_TOKEN0_WITH_NON_EXPIRED_LIQUIDITY_MINING_CAMPAIGNS = gql`
  query($token0Id: ID, $timestamp: BigInt!) {
    pairs(where: { token0: $token0Id }) {
      address: id
      reserve0
      reserve1
      reserveETH
      totalSupply
      token0 {
        address: id
        name
        symbol
        decimals
      }
      token1 {
        address: id
        name
        symbol
        decimals
      }
      liquidityMiningCampaigns(where: { endsAt_gt: $timestamp }) {
        address: id
        duration
        startsAt
        endsAt
        locked
        rewardTokens {
          derivedETH
        }
        stakedAmount
        rewardAmounts
      }
    }
  }
`

export interface PairWithNonExpiredLiquidityMiningCampaignsQueryResult {
  pair: PairWithNonExpiredLiquidityMiningCampaigns
}

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
        stakedAmount
        rewardAmounts
      }
    }
  }
`
