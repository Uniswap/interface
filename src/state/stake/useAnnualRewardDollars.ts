import { JSBI, Token, TokenAmount } from '@ubeswap/sdk'
import useCUSDPrice from 'utils/useCUSDPrice'

import { BIG_INT_SECONDS_IN_YEAR } from '../../constants'

export const useAnnualRewardDollars = (rewardToken: Token | undefined, rewardRate: TokenAmount | undefined) => {
  const rewardPrice = useCUSDPrice(rewardToken)
  if (!rewardToken || !rewardPrice || !rewardRate) {
    return undefined
  }
  const rewardTokenPerYear = new TokenAmount(rewardToken, JSBI.multiply(rewardRate.raw, BIG_INT_SECONDS_IN_YEAR))
  return rewardPrice.quote(rewardTokenPerYear)
}
