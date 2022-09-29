import { CurrencyAmount, Pair, Token, TokenAmount } from '@teleswap/sdk'
import { Chef } from 'constants/farm/chef.enum'
import { CHAINID_TO_FARMING_CONFIG, FarmingPool } from 'constants/farming.config'
import { UNI } from 'constants/index'
import { PairState, usePairs } from 'data/Reserves'
import { BigNumber } from 'ethers'
import { useActiveWeb3React } from 'hooks'
import { useMemo } from 'react'
import { useTokenBalances } from 'state/wallet/hooks'

import { useChefContractForCurrentChain } from './useChefContract'
import { ChefPosition, useChefPositions } from './useChefPositions'
import { MasterChefRawPoolInfo, useMasterChefPoolInfo } from './useMasterChefPoolInfo'

interface AdditionalStakingInfo {
  /**
   * the `Token` object that generated from `lpToken` address
   */
  stakingToken: Token
  /**
   * `stakingPair` is null if this is no a LP Token
   */
  stakingPair: [PairState, Pair | null]
  tvl?: TokenAmount

  parsedData?: {
    stakedAmount: string
    pendingReward: string
  }

  stakedAmount: TokenAmount
  pendingReward: TokenAmount
  rewardDebt: CurrencyAmount
  rewardToken: Token
}
export type ChefStakingInfo = MasterChefRawPoolInfo & FarmingPool & AdditionalStakingInfo

export function useChefStakingInfo(): (ChefStakingInfo | undefined)[] {
  const { chainId } = useActiveWeb3React()
  const mchefContract = useChefContractForCurrentChain()
  const farmingConfig = CHAINID_TO_FARMING_CONFIG[chainId || 420]
  // @todo: include rewardToken in the farmingConfig
  const rewardToken = UNI[chainId || 420]

  const positions = useChefPositions(mchefContract, undefined, chainId)
  const poolPresets = useMemo(() => farmingConfig?.pools || [], [farmingConfig])
  const poolInfos = useMasterChefPoolInfo(farmingConfig?.chefType || Chef.MINICHEF)

  const stakingTokens = useMemo(() => {
    return poolInfos.map((poolInfo, idx) => {
      const poolPreset: FarmingPool | undefined = poolPresets[idx]
      return new Token(
        chainId || 420,
        poolInfo.lpToken,
        poolPreset?.stakingAsset.decimal || 18,
        poolPreset?.stakingAsset.symbol,
        poolPreset?.stakingAsset.name
      )
    })
  }, [chainId, poolInfos, poolPresets])

  const stakingPairAsset: [Token | undefined, Token | undefined, boolean | undefined][] = poolPresets.map(
    ({ stakingAsset, isHidden }) => {
      if (!stakingAsset.isLpToken || isHidden) return [undefined, undefined, undefined]
      else return [stakingAsset.tokenA, stakingAsset.tokenB, stakingAsset.isStable] as [Token, Token, boolean]
    }
  )
  const pairs = usePairs(stakingPairAsset)
  const tvls = useTokenBalances(mchefContract?.address, stakingTokens)

  return poolInfos.map((info, idx) => {
    const poolPreset: FarmingPool | undefined = poolPresets[idx]
    if (!poolPreset) return undefined

    const pool = poolPreset
    const stakingToken = stakingTokens[idx]
    const tvl = tvls[stakingToken.address]
    const position = positions[idx]
    const parsedData = {
      pendingReward: parsedPendingRewardTokenAmount(position, rewardToken),
      stakedAmount: parsedStakedTokenAmount(position, stakingToken)
    }
    return {
      ...info,
      isHidden: pool?.isHidden,
      stakingAsset: pool.stakingAsset,
      stakingToken,
      tvl,
      stakingPair: pairs[idx],
      parsedData,
      rewardToken,
      stakedAmount: new TokenAmount(stakingToken, position.amount.toBigInt()),
      pendingReward: new TokenAmount(stakingToken, position.pendingSushi.toBigInt()),
      rewardDebt: CurrencyAmount.fromRawAmount(rewardToken, position.rewardDebt.toBigInt())
    }
  })
}

/** Some utils to help our hook fns */

const parsedStakedTokenAmount = (position: ChefPosition, stakingToken: Token) => {
  try {
    if (position.amount) {
      const bi = position.amount.toBigInt()
      return CurrencyAmount.fromRawAmount(stakingToken, bi)?.toSignificant(4)
    }
  } catch (error) {
    console.error('parsedStakedAmount::error', error)
  }
  return '--.--'
}

const parsedPendingRewardTokenAmount = (position: ChefPosition, rewardToken: Token) => {
  try {
    if (position && position.pendingSushi) {
      const bi = (position.pendingSushi as BigNumber).toBigInt()
      return CurrencyAmount.fromRawAmount(rewardToken, bi).toSignificant(4)
    }
  } catch (error) {
    console.error('parsedPendingSushiAmount::error', error)
  }
  return '--.--'
}
