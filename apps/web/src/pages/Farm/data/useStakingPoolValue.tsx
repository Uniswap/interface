import { BigNumber } from '@ethersproject/bignumber'
import { CurrencyAmount, Token } from '@ubeswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { CUSD_CELO } from 'constants/tokens'
import JSBI from 'jsbi'
import { useTotalSupply } from './TotalSupply'
import { useCUSDPrice } from './useCUSDPrice'
import { CustomStakingInfo } from './useCustomStakingInfo'
//import { StakingInfo } from 'state/stake/hooks'

interface IRawPool {
  index: number
  stakingToken: string
  poolAddress: string
  weight: number
  rewardToken?: string
  rewardTokenSymbol?: string
  nextPeriod?: number
  nextPeriodRewards?: BigNumber | null
}
export interface StakingInfo {
  // the address of the reward contract
  readonly stakingRewardAddress: string | undefined
  // the token of the liquidity pool
  readonly stakingToken: Token
  // the tokens involved in this pair
  readonly tokens: readonly [Token, Token]
  // the amount of token currently staked, or undefined if no account
  readonly stakedAmount?: CurrencyAmount<Token>
  // the total amount of token staked in the contract
  readonly totalStakedAmount: CurrencyAmount<Token>
  // the amount of reward tokens earned by the active account, or undefined if no account
  readonly earnedAmounts?: CurrencyAmount<Token>[]
  // the current amount of token distributed to the active account per second.
  // equivalent to percent of total supply * reward rate
  readonly rewardRates?: CurrencyAmount<Token>[]
  // the amount of token distributed per second to all LPs, constant
  readonly totalRewardRates: CurrencyAmount<Token>[]
  // when the period ends
  readonly periodFinish: Date | undefined
  // if pool is active
  readonly active: boolean
  // calculates a hypothetical amount of token distributed to the active account per second.
  readonly getHypotheticalRewardRate: (
    stakedAmount: CurrencyAmount<Token>,
    totalStakedAmount: CurrencyAmount<Token>,
    totalRewardRates: CurrencyAmount<Token>[]
  ) => CurrencyAmount<Token>[]
  readonly nextPeriodRewards: CurrencyAmount<Token>
  readonly poolInfo: IRawPool
  readonly rewardTokens: Token[]
}

interface IStakingPoolValue {
  valueCUSD?: CurrencyAmount<Token>
  amountTokenA?: CurrencyAmount<Token>
  amountTokenB?: CurrencyAmount<Token>
  userValueCUSD?: CurrencyAmount<Token>
  userAmountTokenA?: CurrencyAmount<Token>
  userAmountTokenB?: CurrencyAmount<Token>
}

export const useStakingPoolValue = (
  stakingInfo?: StakingInfo | CustomStakingInfo | null,
  stakingTokenPair?: Pair | null
): IStakingPoolValue => {
  const totalSupplyOfStakingToken = useTotalSupply(stakingInfo?.stakingToken ?? undefined)

  const cusd = CUSD_CELO
  const cusdPrice0 = useCUSDPrice(stakingTokenPair?.token0)
  const cusdPrice1 = useCUSDPrice(stakingTokenPair?.token1)

  let valueOfTotalStakedAmountInCUSD: CurrencyAmount<Token> | undefined
  let valueOfUserStakedAmountInCUSD: CurrencyAmount<Token> | undefined
  if (
    stakingInfo &&
    totalSupplyOfStakingToken &&
    !totalSupplyOfStakingToken.equalTo('0') &&
    stakingTokenPair &&
    (cusdPrice0 || cusdPrice1)
  ) {
    // take the total amount of LP tokens staked, multiply by ETH value of all LP tokens, divide by all LP tokens

    const amount = cusdPrice0
      ? cusdPrice0.quote(stakingTokenPair.reserve0)
      : cusdPrice1?.quote(stakingTokenPair.reserve1)
    if (amount) {
      valueOfTotalStakedAmountInCUSD = CurrencyAmount.fromRawAmount(
        cusd,
        JSBI.divide(
          JSBI.multiply(
            JSBI.multiply(
              stakingInfo.totalStakedAmount ? stakingInfo.totalStakedAmount.quotient : JSBI.BigInt(0),
              amount.quotient
            ),
            // this is b/c the value of LP shares are ~double the value of the cUSD they entitle owner to
            JSBI.BigInt(2)
          ),
          totalSupplyOfStakingToken.quotient
        )
      )
      valueOfUserStakedAmountInCUSD = CurrencyAmount.fromRawAmount(
        cusd,
        stakingInfo.stakedAmount
          ? JSBI.divide(
              JSBI.multiply(
                JSBI.multiply(stakingInfo.stakedAmount.quotient, amount.quotient),
                // this is b/c the value of LP shares are ~double the value of the cUSD they entitle owner to
                JSBI.BigInt(2)
              ),
              totalSupplyOfStakingToken.quotient
            )
          : JSBI.BigInt(0)
      )
    }
  }

  const userAmountTokenA =
    stakingTokenPair &&
    stakingInfo?.stakedAmount &&
    totalSupplyOfStakingToken &&
    !totalSupplyOfStakingToken.equalTo('0')
      ? CurrencyAmount.fromRawAmount(
          stakingTokenPair.reserve0.currency,
          JSBI.divide(
            JSBI.multiply(stakingInfo.stakedAmount.quotient, stakingTokenPair.reserve0.quotient),
            totalSupplyOfStakingToken.quotient
          )
        )
      : undefined

  const userAmountTokenB =
    stakingTokenPair &&
    stakingInfo?.stakedAmount &&
    totalSupplyOfStakingToken &&
    !totalSupplyOfStakingToken.equalTo('0')
      ? CurrencyAmount.fromRawAmount(
          stakingTokenPair.reserve1.currency,
          JSBI.divide(
            JSBI.multiply(stakingInfo.stakedAmount.quotient, stakingTokenPair.reserve1.quotient),
            totalSupplyOfStakingToken.quotient
          )
        )
      : undefined

  return {
    valueCUSD: valueOfTotalStakedAmountInCUSD,
    amountTokenA: stakingTokenPair?.reserve0,
    amountTokenB: stakingTokenPair?.reserve1,
    userValueCUSD: valueOfUserStakedAmountInCUSD,
    userAmountTokenA,
    userAmountTokenB,
  }
}
