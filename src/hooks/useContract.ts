import { Contract } from '@ethersproject/contracts'
import IUniswapV2PairABI from '@ubeswap/core/build/abi/IUniswapV2Pair.json'
import { ReleaseUbe } from 'generated/ReleaseUbe'
import { useMemo } from 'react'

import ENS_PUBLIC_RESOLVER_ABI from '../constants/abis/ens-public-resolver.json'
import ERC20_ABI, { ERC20_BYTES32_ABI } from '../constants/abis/erc20'
import POOL_MANAGER_ABI from '../constants/abis/pool-manager.json'
import RELEASE_UBE_ABI from '../constants/abis/ReleaseUbe.json'
import STAKING_REWARDS_ABI from '../constants/abis/StakingRewards.json'
import { MULTICALL_ABI, MULTICALL_NETWORKS } from '../constants/multicall'
import { Erc20, PoolManager, StakingRewards } from '../generated'
import { getContract } from '../utils'
import { useActiveWeb3React } from './index'

// returns null on errors
function useContract(address: string | undefined, ABI: any, withSignerIfPossible = true): Contract | null {
  const { library, account } = useActiveWeb3React()

  return useMemo(() => {
    if (!address || !ABI || !library) return null
    try {
      return getContract(address, ABI, library, withSignerIfPossible && account ? account : undefined)
    } catch (error) {
      console.error('Failed to get contract', error)
      return null
    }
  }, [address, ABI, library, withSignerIfPossible, account])
}

export function useTokenContract(tokenAddress?: string, withSignerIfPossible?: boolean): Erc20 | null {
  return useContract(tokenAddress, ERC20_ABI, withSignerIfPossible) as Erc20
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useENSRegistrarContract(withSignerIfPossible?: boolean): Contract | null {
  // TODO(igm): find CELO equivalent of ENS
  return null
}

export function useENSResolverContract(address: string | undefined, withSignerIfPossible?: boolean): Contract | null {
  return useContract(address, ENS_PUBLIC_RESOLVER_ABI, withSignerIfPossible)
}

export function useBytes32TokenContract(tokenAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(tokenAddress, ERC20_BYTES32_ABI, withSignerIfPossible)
}

export function usePairContract(pairAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(pairAddress, IUniswapV2PairABI, withSignerIfPossible)
}

export function useMulticallContract(): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId ? MULTICALL_NETWORKS[chainId] : undefined, MULTICALL_ABI, false)
}

export function useStakingContract(stakingAddress?: string, withSignerIfPossible?: boolean): StakingRewards | null {
  return useContract(stakingAddress, STAKING_REWARDS_ABI, withSignerIfPossible) as StakingRewards
}

export function usePoolManagerContract(
  poolManagerAddress?: string,
  withSignerIfPossible?: boolean
): PoolManager | null {
  return useContract(poolManagerAddress, POOL_MANAGER_ABI, withSignerIfPossible) as PoolManager
}

export function useReleaseUbeContract(withSignerIfPossible?: boolean): ReleaseUbe | null {
  return useContract('0x5Ed248077bD07eE9B530f7C40BE0c1dAE4c131C0', RELEASE_UBE_ABI, withSignerIfPossible) as ReleaseUbe
}
