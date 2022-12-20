import { useContractKit, useProvider } from '@celo-tools/use-contractkit'
import { Contract } from '@ethersproject/contracts'
import IUniswapV2PairABI from '@ubeswap/core/build/abi/IUniswapV2Pair.json'
import { ReleaseUbe } from 'generated/ReleaseUbe'
import { useMemo } from 'react'
import { StakingInfo } from 'state/stake/hooks'

import ENS_PUBLIC_RESOLVER_ABI from '../constants/abis/ens-public-resolver.json'
import ERC20_ABI, { ERC20_BYTES32_ABI } from '../constants/abis/erc20'
import LIMIT_ORDER_PROTOCOL_ABI from '../constants/abis/limit/LimitOrderProtocol.json'
import ORDER_BOOK_ABI from '../constants/abis/limit/OrderBook.json'
import ORDER_BOOK_REWARD_DISTRUBUTOR_ABI from '../constants/abis/limit/OrderBookRewardDistributor.json'
import DUAL_REWARDS_ABI from '../constants/abis/moola/MoolaStakingRewards.json'
import POOF_TOKEN_ABI from '../constants/abis/poof/PoofToken.json'
import POOL_MANAGER_ABI from '../constants/abis/pool-manager.json'
import RELEASE_UBE_ABI from '../constants/abis/ReleaseUbe.json'
import ROMULUS_DELEGATE_ABI from '../constants/abis/romulus/RomulusDelegate.json'
import STAKING_REWARDS_ABI from '../constants/abis/StakingRewards.json'
import VOTABLE_STAKING_REWARDS_ABI from '../constants/abis/VotableStakingRewards.json'
import { MULTICALL_ABI, MULTICALL_NETWORKS } from '../constants/multicall'
import {
  Erc20,
  LimitOrderProtocol,
  MoolaStakingRewards,
  OrderBook,
  OrderBookRewardDistributor,
  PoofToken,
  PoolManager,
  RomulusDelegate,
  StakingRewards,
} from '../generated'
import { getContract } from '../utils'

// returns null on errors
function useContract(address: string | undefined, ABI: any, withSignerIfPossible = true): Contract | null {
  const { address: account } = useContractKit()
  const library = useProvider()

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

function useContracts(
  addresses: (string | undefined)[] | undefined,
  ABI: any,
  withSignerIfPossible = true
): (Contract | null)[] | null {
  const { address: account } = useContractKit()
  const library = useProvider()

  return useMemo(() => {
    if (!addresses || !ABI || !library) return null
    return addresses.map((address) => {
      if (!address) return null
      return getContract(address, ABI, library, withSignerIfPossible && account ? account : undefined)
    })
  }, [addresses, ABI, library, withSignerIfPossible, account])
}

export function useTokenContract(tokenAddress?: string, withSignerIfPossible?: boolean): Erc20 | null {
  return useContract(tokenAddress, ERC20_ABI, withSignerIfPossible) as Erc20 | null
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
  const { network } = useContractKit()
  const chainId = network.chainId
  return useContract(chainId ? MULTICALL_NETWORKS[chainId] : undefined, MULTICALL_ABI, false)
}

export function useStakingContract(stakingAddress?: string, withSignerIfPossible?: boolean): StakingRewards | null {
  return useContract(stakingAddress, STAKING_REWARDS_ABI, withSignerIfPossible) as StakingRewards | null
}

export function useStakingContracts(
  stakingInfos?: readonly StakingInfo[],
  withSignerIfPossible?: boolean
): StakingRewards[] | null {
  const rewardAddresses: (string | undefined)[] | undefined = stakingInfos?.map(
    (stakingInfo) => stakingInfo.stakingRewardAddress
  )
  return useContracts(rewardAddresses, STAKING_REWARDS_ABI, withSignerIfPossible) as StakingRewards[] | null
}

export function useVotableStakingContract(
  stakingAddress?: string,
  withSignerIfPossible?: boolean
): StakingRewards | null {
  return useContract(stakingAddress, VOTABLE_STAKING_REWARDS_ABI, withSignerIfPossible) as StakingRewards | null
}

export function usePoolManagerContract(
  poolManagerAddress?: string,
  withSignerIfPossible?: boolean
): PoolManager | null {
  return useContract(poolManagerAddress, POOL_MANAGER_ABI, withSignerIfPossible) as PoolManager | null
}

export function useReleaseUbeContract(withSignerIfPossible?: boolean): ReleaseUbe | null {
  return useContract(
    '0x5Ed248077bD07eE9B530f7C40BE0c1dAE4c131C0',
    RELEASE_UBE_ABI,
    withSignerIfPossible
  ) as ReleaseUbe | null
}

export function useMultiStakingContract(
  stakingAddress?: string,
  withSignerIfPossible?: boolean
): MoolaStakingRewards | null {
  return useContract(stakingAddress, DUAL_REWARDS_ABI, withSignerIfPossible) as MoolaStakingRewards | null
}

export function useOrderBookContract(address?: string, withSignerIfPossible?: boolean): OrderBook | null {
  return useContract(address, ORDER_BOOK_ABI, withSignerIfPossible) as OrderBook | null
}

export function useOrderBookRewardDistributorContract(
  address?: string,
  withSignerIfPossible?: boolean
): OrderBookRewardDistributor | null {
  return useContract(
    address,
    ORDER_BOOK_REWARD_DISTRUBUTOR_ABI,
    withSignerIfPossible
  ) as OrderBookRewardDistributor | null
}

export function useLimitOrderProtocolContract(
  address?: string,
  withSignerIfPossible?: boolean
): LimitOrderProtocol | null {
  return useContract(address, LIMIT_ORDER_PROTOCOL_ABI, withSignerIfPossible) as LimitOrderProtocol | null
}

export function useRomulusDelegateContract(address?: string, withSignerIfPossible?: boolean): RomulusDelegate | null {
  return useContract(address, ROMULUS_DELEGATE_ABI, withSignerIfPossible) as RomulusDelegate | null
}

export function usePoofTokenContract(address?: string, withSignerIfPossible?: boolean): PoofToken | null {
  return useContract(address, POOF_TOKEN_ABI, withSignerIfPossible) as PoofToken | null
}
