import { Pair, Token, TokenAmount } from '@teleswap/sdk'
import { Chef } from 'constants/farm/chef.enum'
import { CHAINID_TO_FARMING_CONFIG, FarmingPool } from 'constants/farming.config'
import { PairState, usePairs } from 'data/Reserves'
import { useActiveWeb3React } from 'hooks'
import { useMemo } from 'react'
import { useTokenBalances } from 'state/wallet/hooks'

import { useChefContractForCurrentChain } from './useChefContract'
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
}
export type ChefStakingInfo = MasterChefRawPoolInfo & FarmingPool & AdditionalStakingInfo

export function useChefStakingInfo(): (ChefStakingInfo | undefined)[] {
  const { chainId } = useActiveWeb3React()
  const mchefContract = useChefContractForCurrentChain()
  const farmingConfig = CHAINID_TO_FARMING_CONFIG[chainId || 420]
  const poolPresets = useMemo(() => farmingConfig?.pools || [], [farmingConfig])
  const poolInfos = useMasterChefPoolInfo(farmingConfig?.chefType || Chef.MINICHEF)

  const stakingTokens = useMemo(() => {
    return poolInfos.map((poolInfo, idx) => {
      return new Token(
        chainId || 420,
        poolInfo.lpToken,
        poolPresets[idx].stakingAsset.decimal || 18,
        poolPresets[idx].stakingAsset.symbol,
        poolPresets[idx].stakingAsset.name
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
    if (!poolPresets[idx]) return undefined

    const pool = poolPresets[idx]
    const stakingToken = stakingTokens[idx]
    const tvl = tvls[stakingToken.address]
    return {
      ...info,
      isHidden: pool?.isHidden,
      stakingAsset: pool.stakingAsset,
      stakingToken,
      tvl,
      stakingPair: pairs[idx]
    }
  })
}
