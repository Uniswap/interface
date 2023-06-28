import { useCelo } from '@celo/react-celo'
import { ChainId, cUSD, JSBI, Token, TokenAmount } from '@ubeswap/sdk'
import { useCUSDPrices } from 'utils/useCUSDPrice'

import { BIG_INT_SECONDS_IN_YEAR } from '../../constants'

export const useAnnualRewardDollars = (rewardTokens: Token[], rewardRates: TokenAmount[]) => {
  const { network } = useCelo()
  const chainId = network.chainId as unknown as ChainId
  const rewardPrices = useCUSDPrices(rewardTokens)
  if (!rewardPrices || !rewardRates) {
    return undefined
  }
  return rewardPrices.reduce((acc, rewardPrice, idx) => {
    const rewardRate = rewardRates[idx]
    const rewardToken = rewardTokens[idx]
    const rewardTokenPerYear = new TokenAmount(rewardToken, JSBI.multiply(rewardRate.raw, BIG_INT_SECONDS_IN_YEAR))
    return acc.add(rewardPrice?.quote(rewardTokenPerYear) ?? new TokenAmount(cUSD[chainId], '0'))
  }, new TokenAmount(cUSD[chainId], '0'))
}
