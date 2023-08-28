// import { Price } from '@pollum-io/sdk-core'
import { Currency, Price } from '@pollum-io/sdk-core'
import { ChainId } from '@pollum-io/smart-order-router'
import { Pair } from '@pollum-io/v1-sdk'
import { TokenAmount } from 'graphql/utils/types'
import { Presets } from 'state/mint/v3/reducer'
import { Token } from 'types/v3'

interface CommonStakingInfo {
  // the address of the reward contract
  stakingRewardAddress: string
  // the tokens involved in this pair
  tokens: [Token, Token]
  // the amount of token currently staked, or undefined if no account
  stakedAmount?: TokenAmount
  // the total amount of token staked in the contract
  totalStakedAmount?: TokenAmount
  ended: boolean
  name: string
  lp: string
  baseToken: Token
  pair: string
  oneYearFeeAPY?: number
  oneDayFee?: number
  accountFee?: number
  tvl?: string
  perMonthReturnInRewards?: number
  totalSupply?: TokenAmount
  usdPrice?: Price<Currency, Currency>
  stakingTokenPair?: Pair | null
  sponsored: boolean
  sponsorLink: string
}

export interface StakingInfo extends CommonStakingInfo {
  // the amount of reward token earned by the active account, or undefined if no account
  earnedAmount?: TokenAmount
  // the amount of token distributed per second to all LPs, constant
  totalRewardRate?: TokenAmount
  // the current amount of token distributed to the active account per second.
  // equivalent to percent of total supply * reward rate
  rewardRate?: TokenAmount
  rewardToken: Token
  rewardTokenPrice: number
  rate: number
  valueOfTotalStakedAmountInBaseToken?: TokenAmount
}

export interface DualStakingInfo extends CommonStakingInfo {
  rewardTokenA: Token
  rewardTokenB: Token
  rewardTokenBBase: Token
  // the amount of reward token earned by the active account, or undefined if no account
  earnedAmountA?: TokenAmount
  earnedAmountB?: TokenAmount
  // the amount of token distributed per second to all LPs, constant
  totalRewardRateA: TokenAmount
  totalRewardRateB: TokenAmount
  // the current amount of token distributed to the active account per second.
  // equivalent to percent of total supply * reward rate
  rewardRateA?: TokenAmount
  rewardRateB?: TokenAmount

  rateA: number
  rateB: number
  rewardTokenAPrice: number
  rewardTokenBPrice: number
}

export interface GammaPair {
  address: string
  title: string
  type: Presets
  token0Address: string
  token1Address: string
  ableToFarm?: boolean
  pid?: number
  masterChefIndex?: number
}

export const GammaPairs: {
  [chainId in ChainId]: {
    [key: string]: GammaPair[]
  }
} = {
  [ChainId.ROLLUX]: {
    '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270-0x7ceb23fd6bc0add59e62ac25578270cff1b9f619': [
      {
        type: Presets.GAMMA_NARROW,
        title: 'Narrow',
        address: '0x02203f2351e7ac6ab5051205172d3f772db7d814',
        token0Address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
        token1Address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
        ableToFarm: true,
        pid: 0,
      },
      {
        type: Presets.GAMMA_WIDE,
        title: 'Wide',
        address: '0x81cec323bf8c4164c66ec066f53cc053a535f03d',
        token0Address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
        token1Address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
        ableToFarm: true,
        pid: 1,
      },
    ],
  },
  [ChainId.ROLLUX_TANENBAUM]: {
    '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270-0x7ceb23fd6bc0add59e62ac25578270cff1b9f619': [
      {
        type: Presets.GAMMA_NARROW,
        title: 'Narrow',
        address: '0x02203f2351e7ac6ab5051205172d3f772db7d814',
        token0Address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
        token1Address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
        ableToFarm: true,
        pid: 0,
      },
      {
        type: Presets.GAMMA_WIDE,
        title: 'Wide',
        address: '0x81cec323bf8c4164c66ec066f53cc053a535f03d',
        token0Address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
        token1Address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
        ableToFarm: true,
        pid: 1,
      },
    ],
  },
}

export const GlobalConst = {
  utils: {
    v3FarmSortBy: {
      pool: '1',
      tvl: '2',
      rewards: '3',
      apr: '4',
    },
    v3FarmFilter: {
      allFarms: '0',
      stableCoin: '1',
      blueChip: '2',
      stableLP: '3',
      otherLP: '4',
    },
  },
  v3LiquidityRangeType: {
    MANUAL_RANGE: '0',
    GAMMA_RANGE: '1',
  },
}

export enum FarmingType {
  ETERNAL = 0,
  LIMIT = 1,
}
