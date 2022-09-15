import { Token, TokenAmount } from '@teleswap/sdk'
import { Chef } from 'constants/farm/chef.enum'
import { CHAINID_TO_FARMING_CONFIG, FarmingPool } from 'constants/farming.config'
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

  tvl?: TokenAmount
}
export type ChefStakingInfo = MasterChefRawPoolInfo & FarmingPool & AdditionalStakingInfo

export function useChefStakingInfo(): (ChefStakingInfo | undefined)[] {
  const { chainId } = useActiveWeb3React()
  const mchefContract = useChefContractForCurrentChain()
  const farmingConfig = CHAINID_TO_FARMING_CONFIG[chainId || 420]
  const poolInfos = useMasterChefPoolInfo(farmingConfig?.chefType || Chef.MINICHEF)

  const stakingTokens = useMemo(() => {
    return poolInfos.map((poolInfo, idx) => {
      return new Token(
        chainId || 420,
        poolInfo.lpToken,
        farmingConfig?.pools[idx].stakingAsset.decimal || 18,
        farmingConfig?.pools[idx].stakingAsset.symbol,
        farmingConfig?.pools[idx].stakingAsset.name
      )
    })
  }, [chainId, poolInfos, farmingConfig])

  const tvls = useTokenBalances(mchefContract?.address, stakingTokens)
  // @todo: return the staking infos
  return poolInfos.map((info, idx) => {
    if (!farmingConfig) return undefined

    const pool = farmingConfig?.pools[idx]
    // const stakingAsset = pool
    //   ? {
    //       ...pool.stakingAsset
    //     }
    //   : undefined
    const stakingToken = stakingTokens[idx]
    return {
      ...info,
      isHidden: pool?.isHidden,
      stakingAsset: pool.stakingAsset,
      stakingToken,
      tvl: tvls[stakingToken.address]
    }
  })
}
