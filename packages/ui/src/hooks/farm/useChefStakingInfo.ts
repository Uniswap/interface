import { useMemo } from 'react'
import { Chef } from 'constants/farm/chef.enum'
import { CHAINID_TO_FARMING_CONFIG } from 'constants/farming.config'
import { useActiveWeb3React } from 'hooks'
import ITeleswapV2PairABI from '@teleswap/contracts/build/ITeleswapV2Pair.json'
import { useMultipleContractSingleData } from 'state/multicall/hooks'
import { Interface } from '@ethersproject/abi'
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
}
export type ChefStakingInfo = MasterChefRawPoolInfo & AdditionalStakingInfo

export function useChefStakingInfo(chef: Chef): ChefStakingInfo[] {
  const poolInfos = useMasterChefPoolInfo(chef)

  const { chainId } = useActiveWeb3React()
  const farmingConfig = CHAINID_TO_FARMING_CONFIG[chainId || 420]

  // const pairContract = usePairContract()
  const pairAddresses = useMemo(
    () =>
      poolInfos.map(({ lpToken }, idx) => {
        return farmingConfig?.pools[idx].stakingAsset.isLpToken ? lpToken : undefined
      }),
    [farmingConfig, poolInfos]
  )
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
    return { ...info, isHidden: pool?.isHidden, stakingAsset }
  })
}
