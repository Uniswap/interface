import { useCelo } from '@celo/react-celo'
import { ChainId as UbeswapChainId, cUSD, JSBI, Pair, TokenAmount } from '@ubeswap/sdk'
import { BIG_INT_ZERO } from 'constants/index'
import { useTotalSupply } from 'data/TotalSupply'
import { StakingInfo } from 'state/stake/hooks'
import { useCUSDPrice } from 'utils/useCUSDPrice'

import { CustomStakingInfo } from './useCustomStakingInfo'

interface IStakingPoolValue {
  valueCUSD?: TokenAmount
  amountTokenA?: TokenAmount
  amountTokenB?: TokenAmount
  userValueCUSD?: TokenAmount
  userAmountTokenA?: TokenAmount
  userAmountTokenB?: TokenAmount
}

export const useStakingPoolValue = (
  stakingInfo?: StakingInfo | CustomStakingInfo | null,
  stakingTokenPair?: Pair | null
): IStakingPoolValue => {
  const { network } = useCelo()
  const chainId = network.chainId
  const totalSupplyOfStakingToken = useTotalSupply(stakingInfo?.stakingToken ?? undefined)

  const cusd = cUSD[chainId as unknown as UbeswapChainId]
  const cusdPrice0 = useCUSDPrice(stakingTokenPair?.token0)
  const cusdPrice1 = useCUSDPrice(stakingTokenPair?.token1)

  let valueOfTotalStakedAmountInCUSD: TokenAmount | undefined
  let valueOfUserStakedAmountInCUSD: TokenAmount | undefined
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
      valueOfTotalStakedAmountInCUSD = new TokenAmount(
        cusd,
        JSBI.divide(
          JSBI.multiply(
            JSBI.multiply(
              stakingInfo.totalStakedAmount ? stakingInfo.totalStakedAmount.raw : JSBI.BigInt(0),
              amount.raw
            ),
            // this is b/c the value of LP shares are ~double the value of the cUSD they entitle owner to
            JSBI.BigInt(2)
          ),
          totalSupplyOfStakingToken.raw
        )
      )
      valueOfUserStakedAmountInCUSD = new TokenAmount(
        cusd,
        stakingInfo.stakedAmount
          ? JSBI.divide(
              JSBI.multiply(
                JSBI.multiply(stakingInfo.stakedAmount.raw, amount.raw),
                // this is b/c the value of LP shares are ~double the value of the cUSD they entitle owner to
                JSBI.BigInt(2)
              ),
              totalSupplyOfStakingToken.raw
            )
          : BIG_INT_ZERO
      )
    }
  }

  const userAmountTokenA =
    stakingTokenPair &&
    stakingInfo?.stakedAmount &&
    totalSupplyOfStakingToken &&
    !totalSupplyOfStakingToken.equalTo('0')
      ? new TokenAmount(
          stakingTokenPair.reserve0.token,
          JSBI.divide(
            JSBI.multiply(stakingInfo.stakedAmount.raw, stakingTokenPair.reserve0.raw),
            totalSupplyOfStakingToken.raw
          )
        )
      : undefined

  const userAmountTokenB =
    stakingTokenPair &&
    stakingInfo?.stakedAmount &&
    totalSupplyOfStakingToken &&
    !totalSupplyOfStakingToken.equalTo('0')
      ? new TokenAmount(
          stakingTokenPair.reserve1.token,
          JSBI.divide(
            JSBI.multiply(stakingInfo.stakedAmount.raw, stakingTokenPair.reserve1.raw),
            totalSupplyOfStakingToken.raw
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
