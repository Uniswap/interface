// import { Price } from '@pollum-io/sdk-core'
import { Currency, Price } from '@pollum-io/sdk-core'
import { ChainId } from '@pollum-io/smart-order-router'
import { Pair } from '@pollum-io/v1-sdk'
import { TokenAmount } from 'graphql/utils/types'
import { Presets } from 'state/mint/v3/reducer'
import { Token } from 'types/v3'

import { USDC_ROLLUX, WRAPPED_NATIVE_CURRENCY } from '../../constants/tokens'

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

interface Returns {
  daily: {
    feeApr: number
    feeApy: number
  }
  weekly: {
    feeApr: number
    feeApy: number
  }
  monthly: {
    feeApr: number
    feeApy: number
  }
  allTime: {
    feeApr: number
    feeApy: number
  }
  status: string
}

interface FarmPoolData {
  createDate: string
  poolAddress: string
  name: string
  token0: string
  token1: string
  decimals0: number
  decimals1: number
  depositCap0: number
  depositCap1: number
  grossFeesClaimed0: number
  grossFeesClaimed1: number
  grossFeesClaimedUSD: string
  feesReinvested0: number
  feesReinvested1: number
  feesReinvestedUSD: string
  tvl0: number
  tvl1: number
  tvlUSD: string
  totalSupply: number
  maxTotalSupply: number
  capacityUsed: string
  sqrtPrice: string
  tick: number
  baseLower: number
  baseUpper: number
  inRange: boolean
  observationIndex: string
  poolTvlUSD: string
  poolFeesUSD: string
  returns: Returns
}

export const GammaPairs = {
  [ChainId.ROLLUX]: {
    '0x4200000000000000000000000000000000000006-0x48023b16c3e81aa7f6effbdeb35bb83f4f31a8fd': [
      {
        type: Presets.GAMMA_NARROW,
        title: 'Narrow',
        address: '0xf91726da5da9de95d7c3c504d36e6db307659a3b',
        token0Address: '0x4200000000000000000000000000000000000006',
        token1Address: '0x48023b16c3e81aa7f6effbdeb35bb83f4f31a8fd',
        ableToFarm: true,
        pid: 0,
      },
      // {
      //   type: Presets.GAMMA_WIDE,
      //   title: 'Wide',
      //   address: '0x81cec323bf8c4164c66ec066f53cc053a535f03d',
      //   token0Address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
      //   token1Address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
      //   ableToFarm: true,
      //   pid: 1,
      // },
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

export const GlobalData = {
  stableCoins: {
    [ChainId.ROLLUX]: [USDC_ROLLUX],
  },
  blueChips: {
    [ChainId.ROLLUX]: [WRAPPED_NATIVE_CURRENCY[ChainId.ROLLUX]],
  },
  stablePairs: {
    [ChainId.ROLLUX]: [[USDC_ROLLUX]],
  },
}

export enum FarmingType {
  ETERNAL = 0,
  LIMIT = 1,
}
