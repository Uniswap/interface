import { Interface } from '@ethersproject/abi'
import ITeleswapV2PairABI from '@teleswap/contracts/build/ITeleswapV2Pair.json'
import { Token } from '@teleswap/sdk'
import { Chef } from 'constants/farm/chef.enum'
import { CHAINID_TO_FARMING_CONFIG } from 'constants/farming.config'
import { useActiveWeb3React } from 'hooks'
import { useMemo } from 'react'
import { useMultipleContractSingleData } from 'state/multicall/hooks'

import { MasterChefRawPoolInfo, useMasterChefPoolInfo } from './useMasterChefPoolInfo'

const PAIR_INTERFACE = new Interface(ITeleswapV2PairABI)

interface AdditionalStakingInfo {
  isHidden?: boolean
  stakingAsset?: {
    name: string
    /**
     * `isLpToken` - this affect the way for our evaluation of the staked asset and its logo
     */
    isLpToken: boolean
    /**
     * only exist if `isLpToken` is `true`
     */
    token0?: string
    /**
     * only exist if `isLpToken` is `true`
     */
    token1?: string
  }
  /**
   * the `Token` object that generated from `lpToken` address
   */
  stakingToken: Token
}
export type ChefStakingInfo = MasterChefRawPoolInfo & AdditionalStakingInfo

export function useChefStakingInfo(): ChefStakingInfo[] {
  const { chainId } = useActiveWeb3React()
  const farmingConfig = CHAINID_TO_FARMING_CONFIG[chainId || 420]
  const poolInfos = useMasterChefPoolInfo(farmingConfig?.chefType || Chef.MINICHEF)

  // const pairContract = usePairContract()
  const pairAddresses = useMemo(
    () =>
      poolInfos.map(({ lpToken }, idx) => {
        return farmingConfig?.pools[idx].stakingAsset.isLpToken ? lpToken : undefined
      }),
    [farmingConfig, poolInfos]
  )
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
  const listOfToken0 = useMultipleContractSingleData(pairAddresses, PAIR_INTERFACE, 'token0')
  const listOfToken1 = useMultipleContractSingleData(pairAddresses, PAIR_INTERFACE, 'token1')

  // @todo: return the staking infos
  return poolInfos.map((info, idx) => {
    const pool = farmingConfig?.pools[idx]
    const stakingAsset = pool
      ? {
          ...pool.stakingAsset,
          token0: listOfToken0[idx].result?.at(0),
          token1: listOfToken1[idx].result?.at(0)
        }
      : undefined
    return { ...info, isHidden: pool?.isHidden, stakingAsset, stakingToken: stakingTokens[idx] }
  })
}
