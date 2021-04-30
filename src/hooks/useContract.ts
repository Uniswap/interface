import { Contract } from '@ethersproject/contracts'
import { ChainId, WETH9 } from '@uniswap/sdk-core'
import { abi as GOVERNANCE_ABI } from '@uniswap/governance/build/GovernorAlpha.json'
import { abi as UNI_ABI } from '@uniswap/governance/build/Uni.json'
import { abi as STAKING_REWARDS_ABI } from '@uniswap/liquidity-staker/build/StakingRewards.json'
import { abi as MERKLE_DISTRIBUTOR_ABI } from '@uniswap/merkle-distributor/build/MerkleDistributor.json'
import { abi as IUniswapV2PairABI } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import { abi as V3FactoryABI } from '@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json'
import { abi as V3PoolABI } from '@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json'
import { abi as QuoterABI } from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json'
import { abi as V2MigratorABI } from '@uniswap/v3-periphery/artifacts/contracts/V3Migrator.sol/V3Migrator.json'
import { abi as TickLensABI } from '@uniswap/v3-periphery/artifacts/contracts/lens/TickLens.sol/TickLens.json'
import { abi as IUniswapV2Router02ABI } from '@uniswap/v2-periphery/build/IUniswapV2Router02.json'

import ARGENT_WALLET_DETECTOR_ABI from 'abis/argent-wallet-detector.json'
import ENS_PUBLIC_RESOLVER_ABI from 'abis/ens-public-resolver.json'
import ENS_ABI from 'abis/ens-registrar.json'
import ERC20_ABI from 'abis/erc20.json'
import ERC20_BYTES32_ABI from 'abis/erc20_bytes32.json'
import MIGRATOR_ABI from 'abis/migrator.json'
import MULTICALL_ABI from 'abis/multicall2.json'
import { Unisocks } from 'abis/types/Unisocks'
import UNISOCKS_ABI from 'abis/unisocks.json'
import WETH_ABI from 'abis/weth.json'
import EIP_2612 from 'abis/eip_2612.json'

import {
  ARGENT_WALLET_DETECTOR_MAINNET_ADDRESS,
  GOVERNANCE_ADDRESS,
  MERKLE_DISTRIBUTOR_ADDRESS,
  V1_MIGRATOR_ADDRESS,
  UNI,
  MULTICALL2_ADDRESSES,
  V2_ROUTER_ADDRESS,
} from 'constants/index'
import { abi as NFTPositionManagerABI } from '@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json'
import {
  NONFUNGIBLE_POSITION_MANAGER_ADDRESSES,
  V3_CORE_FACTORY_ADDRESSES,
  TICK_LENS_ADDRESSES,
  V3_MIGRATOR_ADDRESSES,
  QUOTER_ADDRESSES,
} from 'constants/v3'
import { useMemo } from 'react'
import { Quoter, TickLens, UniswapV3Factory, UniswapV3Pool } from 'types/v3'
import { NonfungiblePositionManager } from 'types/v3/NonfungiblePositionManager'
import { V3Migrator } from 'types/v3/V3Migrator'
import { getContract } from 'utils'
import { Multicall2 } from '../abis/types'
import { useActiveWeb3React } from './index'

// returns null on errors
export function useContract(address: string | undefined, ABI: any, withSignerIfPossible = true): Contract | null {
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

export function useV1MigratorContract(): Contract | null {
  return useContract(V1_MIGRATOR_ADDRESS, MIGRATOR_ABI, true)
}

export function useV2MigratorContract(): V3Migrator | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId && V3_MIGRATOR_ADDRESSES[chainId], V2MigratorABI, true) as V3Migrator | null
}

export function useTokenContract(tokenAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(tokenAddress, ERC20_ABI, withSignerIfPossible)
}

export function useWETHContract(withSignerIfPossible?: boolean): Contract | null {
  const { chainId } = useActiveWeb3React()
  const address = chainId && chainId in WETH9 ? WETH9[chainId].address : undefined
  return useContract(address, WETH_ABI, withSignerIfPossible)
}

export function useArgentWalletDetectorContract(): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(
    chainId === ChainId.MAINNET ? ARGENT_WALLET_DETECTOR_MAINNET_ADDRESS : undefined,
    ARGENT_WALLET_DETECTOR_ABI,
    false
  )
}

export function useENSRegistrarContract(withSignerIfPossible?: boolean): Contract | null {
  const { chainId } = useActiveWeb3React()
  let address: string | undefined
  if (chainId) {
    switch (chainId) {
      case ChainId.MAINNET:
      case ChainId.GÖRLI:
      case ChainId.ROPSTEN:
      case ChainId.RINKEBY:
        address = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
        break
    }
  }
  return useContract(address, ENS_ABI, withSignerIfPossible)
}

export function useENSResolverContract(address: string | undefined, withSignerIfPossible?: boolean): Contract | null {
  return useContract(address, ENS_PUBLIC_RESOLVER_ABI, withSignerIfPossible)
}

export function useBytes32TokenContract(tokenAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(tokenAddress, ERC20_BYTES32_ABI, withSignerIfPossible)
}

export function useEIP2612Contract(tokenAddress?: string): Contract | null {
  return useContract(tokenAddress, EIP_2612, false)
}

export function usePairContract(pairAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(pairAddress, IUniswapV2PairABI, withSignerIfPossible)
}

export function useV2RouterContract(): Contract | null {
  return useContract(V2_ROUTER_ADDRESS, IUniswapV2Router02ABI, true)
}

export function useMulticall2Contract(): Multicall2 | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId && MULTICALL2_ADDRESSES[chainId], MULTICALL_ABI, false) as Multicall2
}

export function useMerkleDistributorContract(): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId ? MERKLE_DISTRIBUTOR_ADDRESS[chainId] : undefined, MERKLE_DISTRIBUTOR_ABI, true)
}

export function useGovernanceContract(): Contract | null {
  return useContract(GOVERNANCE_ADDRESS, GOVERNANCE_ABI, true)
}

export function useUniContract(): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId ? UNI[chainId].address : undefined, UNI_ABI, true)
}

export function useStakingContract(stakingAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(stakingAddress, STAKING_REWARDS_ABI, withSignerIfPossible)
}

export function useSocksController(): Unisocks | null {
  const { chainId } = useActiveWeb3React()
  return useContract(
    chainId === ChainId.MAINNET ? '0x65770b5283117639760beA3F867b69b3697a91dd' : undefined,
    UNISOCKS_ABI,
    false
  ) as Unisocks | null
}

export function useV3NFTPositionManagerContract(): NonfungiblePositionManager | null {
  const { chainId } = useActiveWeb3React()
  const address = chainId ? NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId] : undefined
  return useContract(address, NFTPositionManagerABI) as NonfungiblePositionManager | null
}

export function useV3Factory(): UniswapV3Factory | null {
  const { chainId } = useActiveWeb3React()
  const address = chainId ? V3_CORE_FACTORY_ADDRESSES[chainId] : undefined
  return useContract(address, V3FactoryABI) as UniswapV3Factory | null
}

export function useV3Pool(address: string | undefined): UniswapV3Pool | null {
  return useContract(address, V3PoolABI) as UniswapV3Pool | null
}

export function useV3Quoter(): Quoter | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId ? QUOTER_ADDRESSES[chainId] : undefined, QuoterABI) as Quoter | null
}

export function useTickLens(): TickLens | null {
  const { chainId } = useActiveWeb3React()
  const address = chainId ? TICK_LENS_ADDRESSES[chainId] : undefined
  return useContract(address, TickLensABI) as TickLens | null
}
