import { cUSD, JSBI, TokenAmount } from '@ubeswap/sdk'
import { usePair } from 'data/Reserves'
import { useTotalSupply } from 'data/TotalSupply'
import { useActiveWeb3React } from 'hooks'
import { StakingInfo } from 'state/stake/hooks'

export const useStakingPoolValue = (stakingInfo?: StakingInfo) => {
  const { chainId } = useActiveWeb3React()
  const totalSupplyOfStakingToken = useTotalSupply(stakingInfo?.stakedAmount.token)
  const [, stakingTokenPair] = usePair(stakingInfo?.tokens[0], stakingInfo?.tokens[1])

  const cusd = cUSD[chainId]

  // let returnOverMonth: Percent = new Percent('0')
  let valueOfTotalStakedAmountInCUSD: TokenAmount | undefined
  if (stakingInfo && totalSupplyOfStakingToken && stakingTokenPair && stakingTokenPair.involvesToken(cusd)) {
    // take the total amount of LP tokens staked, multiply by ETH value of all LP tokens, divide by all LP tokens
    valueOfTotalStakedAmountInCUSD = new TokenAmount(
      cusd,
      JSBI.divide(
        JSBI.multiply(
          JSBI.multiply(stakingInfo.totalStakedAmount.raw, stakingTokenPair.reserveOf(cusd).raw),
          JSBI.BigInt(2) // this is b/c the value of LP shares are ~double the value of the WETH they entitle owner to
        ),
        totalSupplyOfStakingToken.raw
      )
    )
  }

  return valueOfTotalStakedAmountInCUSD
}
