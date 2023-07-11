import { BigNumber } from '@ethersproject/bignumber'
import { CurrencyAmount, Token } from '@thinkincoin-libs/sdk-core'
import JSBI from 'jsbi'

import { STAKING_GENESIS } from '../state/stake/hooks'

const STAKING_END = STAKING_GENESIS + 60 * 60 * 24 * 60

const TREASURY_VESTING_GENESIS = 1600387200

// 30 days
const TREASURY_VESTING_CLIFF: number = 60 * 60 * 24 * 30

const ONE_YEAR: number = 60 * 60 * 24 * 365
const TREASURY_BEGIN_YEAR_1 = TREASURY_VESTING_GENESIS
const TREASURY_CLIFF_YEAR_1 = TREASURY_BEGIN_YEAR_1 + TREASURY_VESTING_CLIFF
const TREASURY_END_YEAR_1 = TREASURY_BEGIN_YEAR_1 + ONE_YEAR

const TREASURY_BEGIN_YEAR_2 = TREASURY_END_YEAR_1
const TREASURY_END_YEAR_2 = TREASURY_BEGIN_YEAR_2 + ONE_YEAR

const TREASURY_BEGIN_YEAR_3 = TREASURY_END_YEAR_2
const TREASURY_END_YEAR_3 = TREASURY_BEGIN_YEAR_3 + ONE_YEAR

const TREASURY_BEGIN_YEAR_4 = TREASURY_END_YEAR_3
const TREASURY_END_YEAR_4 = TREASURY_BEGIN_YEAR_4 + ONE_YEAR

const USERS_AMOUNT = 150_000_000
const STAKING_REWARDS_AMOUNT = 20_000_000
const TREASURY_YEAR_1_AMOUNT = 172_000_000
const TREASURY_YEAR_2_AMOUNT = 129_000_00
const TREASURY_YEAR_3_AMOUNT = 86_000_00
const TREASURY_YEAR_4_AMOUNT = 43_000_00
const TEAM_YEAR_1_AMOUNT = 160_000_000
const TEAM_YEAR_2_AMOUNT = 120_000_00
const TEAM_YEAR_3_AMOUNT = 80_000_00
const TEAM_YEAR_4_AMOUNT = 40_000_00

function withVesting(before: JSBI, time: BigNumber, amount: number, start: number, end: number, cliff?: number) {
  if (time.gt(start)) {
    if (time.gte(end)) {
      return JSBI.add(before, JSBI.BigInt(amount))
    } else {
      if ((typeof cliff === 'number' && time.gte(cliff)) || typeof cliff === 'undefined') {
        return JSBI.add(
          before,
          JSBI.divide(
            JSBI.multiply(JSBI.BigInt(amount), JSBI.BigInt(time.sub(start).toString())),
            JSBI.subtract(JSBI.BigInt(end), JSBI.BigInt(start))
          )
        )
      }
    }
  }
  return before
}

export function computeUniCirculation(
  uni: Token,
  blockTimestamp: BigNumber,
  unclaimedUni: CurrencyAmount<Token> | undefined
): CurrencyAmount<Token> {
  let wholeAmount = JSBI.BigInt(USERS_AMOUNT)

  // staking rewards
  wholeAmount = withVesting(wholeAmount, blockTimestamp, STAKING_REWARDS_AMOUNT, STAKING_GENESIS, STAKING_END)

  // treasury vesting
  wholeAmount = withVesting(
    wholeAmount,
    blockTimestamp,
    TREASURY_YEAR_1_AMOUNT,
    TREASURY_BEGIN_YEAR_1,
    TREASURY_END_YEAR_1,
    TREASURY_CLIFF_YEAR_1
  )
  wholeAmount = withVesting(
    wholeAmount,
    blockTimestamp,
    TREASURY_YEAR_2_AMOUNT,
    TREASURY_BEGIN_YEAR_2,
    TREASURY_END_YEAR_2
  )
  wholeAmount = withVesting(
    wholeAmount,
    blockTimestamp,
    TREASURY_YEAR_3_AMOUNT,
    TREASURY_BEGIN_YEAR_3,
    TREASURY_END_YEAR_3
  )
  wholeAmount = withVesting(
    wholeAmount,
    blockTimestamp,
    TREASURY_YEAR_4_AMOUNT,
    TREASURY_BEGIN_YEAR_4,
    TREASURY_END_YEAR_4
  )

  // team
  wholeAmount = withVesting(
    wholeAmount,
    blockTimestamp,
    TEAM_YEAR_1_AMOUNT,
    TREASURY_BEGIN_YEAR_1,
    TREASURY_END_YEAR_1,
    TREASURY_CLIFF_YEAR_1
  )
  wholeAmount = withVesting(wholeAmount, blockTimestamp, TEAM_YEAR_2_AMOUNT, TREASURY_BEGIN_YEAR_2, TREASURY_END_YEAR_2)
  wholeAmount = withVesting(wholeAmount, blockTimestamp, TEAM_YEAR_3_AMOUNT, TREASURY_BEGIN_YEAR_3, TREASURY_END_YEAR_3)
  wholeAmount = withVesting(wholeAmount, blockTimestamp, TEAM_YEAR_4_AMOUNT, TREASURY_BEGIN_YEAR_4, TREASURY_END_YEAR_4)

  const total = CurrencyAmount.fromRawAmount(
    uni,
    JSBI.multiply(wholeAmount, JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18)))
  )
  return unclaimedUni ? total.subtract(unclaimedUni) : total
}
