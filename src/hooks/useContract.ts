import { Contract, ContractInterface } from '@ethersproject/contracts'
import { ChainId, WETH } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import IUniswapV2PairABI from 'constants/abis/IUniswapV2PairABI.json'
import {
  ARGENT_WALLET_DETECTOR_ABI,
  ARGENT_WALLET_DETECTOR_MAINNET_ADDRESS,
} from 'constants/abis/argent-wallet-detector'
import RouterSwapAction from 'constants/abis/bridge/RouterSwapAction.json'
import RouterSwapActionV2 from 'constants/abis/bridge/RouterSwapActionV2.json'
import swapBTCABI from 'constants/abis/bridge/swapBTCABI.json'
import swapETHABI from 'constants/abis/bridge/swapETHABI.json'
import FACTORY_ABI from 'constants/abis/dmm-factory.json'
import ENS_PUBLIC_RESOLVER_ABI from 'constants/abis/ens-public-resolver.json'
import ENS_ABI from 'constants/abis/ens-registrar.json'
import { ERC20_BYTES32_ABI } from 'constants/abis/erc20'
import ERC20_ABI from 'constants/abis/erc20.json'
import FAIRLAUNCH_V2_ABI from 'constants/abis/fairlaunch-v2.json'
import FAIRLAUNCH_ABI from 'constants/abis/fairlaunch.json'
import KS_STATIC_FEE_FACTORY_ABI from 'constants/abis/ks-factory.json'
import REWARD_LOCKER_V2_ABI from 'constants/abis/reward-locker-v2.json'
import REWARD_LOCKER_ABI from 'constants/abis/reward-locker.json'
import NFTPositionManagerABI from 'constants/abis/v2/ProAmmNFTPositionManager.json'
import TickReaderABI from 'constants/abis/v2/ProAmmTickReader.json'
import PROMM_FARM_ABI from 'constants/abis/v2/farm.json'
import WETH_ABI from 'constants/abis/weth.json'
import ZAP_STATIC_FEE_ABI from 'constants/abis/zap-static-fee.json'
import ZAP_ABI from 'constants/abis/zap.json'
import { MULTICALL_ABI } from 'constants/multicall'
import { NETWORKS_INFO, isEVM } from 'constants/networks'
import { EVMNetworkInfo } from 'constants/networks/type'
import { useWeb3React } from 'hooks'
import { FairLaunchVersion, RewardLockerVersion } from 'state/farms/classic/types'
import { useRewardLockerAddressesWithVersion } from 'state/vesting/hooks'
import { getContract, getContractForReading } from 'utils/getContract'

import { useActiveWeb3React } from './index'
import { useKyberswapConfig } from './useKyberswapConfig'

// returns null on errors
export function useContract(
  address: string | undefined,
  ABI: ContractInterface,
  withSignerIfPossible = true,
): Contract | null {
  const { account, isEVM } = useActiveWeb3React()
  const { library } = useWeb3React()

  return useMemo(() => {
    if (!isEVM || !address || !ABI || !library) return null
    try {
      return getContract(address, ABI, library, withSignerIfPossible && account ? account : undefined)
    } catch (error) {
      console.error('Failed to get contract', error)
      return null
    }
  }, [address, ABI, library, withSignerIfPossible, account, isEVM])
}

function useContractForReading(
  address: string | undefined,
  ABI: ContractInterface,
  customChainId?: ChainId,
): Contract | null {
  const { chainId: curChainId } = useActiveWeb3React()
  const chainId = customChainId || curChainId
  const { provider } = useKyberswapConfig()

  return useMemo(() => {
    if (!address || !isEVM(chainId) || !provider) return null
    try {
      return getContractForReading(address, ABI, provider)
    } catch (error) {
      console.error('Failed to get contract', error)
      return null
    }
  }, [address, ABI, chainId, provider])
}

// returns null on errors
export function useMultipleContracts(
  addresses: string[] | undefined,
  ABI: ContractInterface,
  withSignerIfPossible = true,
): {
  [key: string]: Contract
} | null {
  const { account, isEVM } = useActiveWeb3React()
  const { library } = useWeb3React()
  const { provider } = useKyberswapConfig()

  return useMemo(() => {
    if (!isEVM || !addresses || !Array.isArray(addresses) || addresses.length === 0 || !ABI || !library || !provider)
      return null

    const result: {
      [key: string]: Contract
    } = {}

    try {
      addresses.forEach(address => {
        if (address) {
          result[address] = withSignerIfPossible
            ? getContract(address, ABI, library, withSignerIfPossible && account ? account : undefined)
            : getContractForReading(address, ABI, provider)
        }
      })

      if (Object.keys(result).length > 0) {
        return result
      }

      return null
    } catch (error) {
      console.error('Failed to get contract', error)

      return null
    }
  }, [addresses, ABI, library, withSignerIfPossible, account, isEVM, provider])
}

export function useTokenContract(tokenAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(tokenAddress, ERC20_ABI, withSignerIfPossible)
}

export function useTokenContractForReading(tokenAddress?: string, customChainId?: ChainId): Contract | null {
  return useContractForReading(tokenAddress, ERC20_ABI, customChainId)
}

export function useWETHContract(withSignerIfPossible?: boolean): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(isEVM(chainId) ? WETH[chainId].address : undefined, WETH_ABI, withSignerIfPossible)
}

export function useArgentWalletDetectorContract(): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(
    chainId === ChainId.MAINNET ? ARGENT_WALLET_DETECTOR_MAINNET_ADDRESS : undefined,
    ARGENT_WALLET_DETECTOR_ABI,
    false,
  )
}

export function useENSRegistrarContract(withSignerIfPossible?: boolean): Contract | null {
  const { chainId } = useActiveWeb3React()
  let address: string | undefined
  if (isEVM(chainId)) {
    switch (chainId) {
      case ChainId.MAINNET:
      case ChainId.GÖRLI:
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

export function usePairContract(pairAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(pairAddress, IUniswapV2PairABI.abi, withSignerIfPossible)
}

export function useMulticallContract(customChainId?: ChainId): Contract | null {
  const { chainId: curChainId } = useActiveWeb3React()
  const chainId = customChainId || curChainId
  return useContractForReading(isEVM(chainId) ? NETWORKS_INFO[chainId].multicall : undefined, MULTICALL_ABI, chainId)
}

export function useOldStaticFeeFactoryContract(): Contract | null {
  const { isEVM, networkInfo } = useActiveWeb3React()

  return useContract(isEVM ? (networkInfo as EVMNetworkInfo).classic.oldStatic?.factory : undefined, FACTORY_ABI)
}
export function useStaticFeeFactoryContract(): Contract | null {
  const { isEVM, networkInfo } = useActiveWeb3React()

  return useContract(
    isEVM ? (networkInfo as EVMNetworkInfo).classic.static.factory : undefined,
    KS_STATIC_FEE_FACTORY_ABI,
  )
}
export function useDynamicFeeFactoryContract(): Contract | null {
  const { isEVM, networkInfo } = useActiveWeb3React()

  return useContract(isEVM ? (networkInfo as EVMNetworkInfo).classic.dynamic?.factory : undefined, FACTORY_ABI)
}

export function useZapContract(isStaticFeeContract: boolean, isOldStaticFeeContract: boolean): Contract | null {
  const { isEVM, networkInfo } = useActiveWeb3React()
  return useContract(
    isEVM
      ? isStaticFeeContract
        ? isOldStaticFeeContract
          ? (networkInfo as EVMNetworkInfo).classic.oldStatic?.zap
          : (networkInfo as EVMNetworkInfo).classic.static.zap
        : (networkInfo as EVMNetworkInfo).classic.dynamic?.zap
      : undefined,
    isStaticFeeContract && !isOldStaticFeeContract ? ZAP_STATIC_FEE_ABI : ZAP_ABI,
  )
}

export function useProMMFarmContract(address: string): Contract | null {
  return useContract(address, PROMM_FARM_ABI)
}

function useFairLaunchV1Contracts(withSignerIfPossible?: boolean): {
  [key: string]: Contract
} | null {
  const { isEVM, networkInfo } = useActiveWeb3React()

  return useMultipleContracts(
    isEVM ? (networkInfo as EVMNetworkInfo).classic.fairlaunch : undefined,
    FAIRLAUNCH_ABI,
    withSignerIfPossible,
  )
}

function useFairLaunchV2Contracts(withSignerIfPossible?: boolean): {
  [key: string]: Contract
} | null {
  const { networkInfo, isEVM } = useActiveWeb3React()

  return useMultipleContracts(
    isEVM ? (networkInfo as EVMNetworkInfo).classic.fairlaunchV2 : undefined,
    FAIRLAUNCH_V2_ABI,
    withSignerIfPossible,
  )
}

export function useFairLaunchContracts(withSignerIfPossible?: boolean): {
  [key: string]: Contract
} | null {
  const fairLaunchV1Contracts = useFairLaunchV1Contracts(withSignerIfPossible)
  const fairLaunchV2Contracts = useFairLaunchV2Contracts(withSignerIfPossible)

  const fairLaunchContracts = useMemo(() => {
    return { ...fairLaunchV1Contracts, ...fairLaunchV2Contracts }
  }, [fairLaunchV1Contracts, fairLaunchV2Contracts])

  return fairLaunchContracts
}

export const useFairLaunchVersion = (address: string): FairLaunchVersion => {
  const { isEVM, networkInfo } = useActiveWeb3React()
  let version = FairLaunchVersion.V1
  if (!isEVM) return version

  // Use .find to search with case insensitive
  const isV2 = (networkInfo as EVMNetworkInfo).classic.fairlaunchV2.find(a => {
    return a.toLowerCase() === address.toLowerCase()
  })

  // Even if we have V3 in the future, we can update it here

  if (isV2) {
    version = FairLaunchVersion.V2
  }

  return version
}

export function useFairLaunchContract(address: string, withSignerIfPossible?: boolean): Contract | null {
  const version = useFairLaunchVersion(address)
  let abi

  switch (version) {
    case FairLaunchVersion.V1:
      abi = FAIRLAUNCH_ABI
      break
    case FairLaunchVersion.V2:
      abi = FAIRLAUNCH_V2_ABI
      break
    default:
      abi = FAIRLAUNCH_ABI
      break
  }

  return useContract(address, abi, withSignerIfPossible)
}

export function useRewardLockerContracts(withSignerIfPossible?: boolean): {
  [key: string]: Contract
} | null {
  const rewardLockerAddressesWithVersion = useRewardLockerAddressesWithVersion()
  const rewardLockerV1Addresses = useMemo(
    () =>
      Object.keys(rewardLockerAddressesWithVersion).filter(
        address => rewardLockerAddressesWithVersion[address] === RewardLockerVersion.V1,
      ),
    [rewardLockerAddressesWithVersion],
  )
  const rewardLockerV2Addresses = useMemo(
    () =>
      Object.keys(rewardLockerAddressesWithVersion).filter(
        address => rewardLockerAddressesWithVersion[address] === RewardLockerVersion.V2,
      ),
    [rewardLockerAddressesWithVersion],
  )
  const rewardLockerV1Contracts = useMultipleContracts(rewardLockerV1Addresses, REWARD_LOCKER_ABI, withSignerIfPossible)
  const rewardLockerV2Contracts = useMultipleContracts(
    rewardLockerV2Addresses,
    REWARD_LOCKER_V2_ABI,
    withSignerIfPossible,
  )
  return useMemo(
    () => ({ ...rewardLockerV1Contracts, ...rewardLockerV2Contracts }),
    [rewardLockerV1Contracts, rewardLockerV2Contracts],
  )
}

export function useRewardLockerContract(address: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(address, REWARD_LOCKER_ABI, withSignerIfPossible)
}

export function useProAmmNFTPositionManagerContract(withSignerIfPossible?: boolean): Contract | null {
  const { isEVM, networkInfo } = useActiveWeb3React()
  return useContract(
    isEVM ? (networkInfo as EVMNetworkInfo).elastic.nonfungiblePositionManager : undefined,
    NFTPositionManagerABI.abi,
    withSignerIfPossible,
  )
}

export function useProAmmTickReader(withSignerIfPossible?: boolean): Contract | null {
  const { isEVM, networkInfo } = useActiveWeb3React()
  return useContract(
    isEVM ? (networkInfo as EVMNetworkInfo).elastic.tickReader : undefined,
    TickReaderABI.abi,
    withSignerIfPossible,
  )
}

// bridge
export function useSwapBTCContract(tokenAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(tokenAddress, swapBTCABI, withSignerIfPossible)
}

export function useSwapETHContract(tokenAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(tokenAddress, swapETHABI, withSignerIfPossible)
}
export function useBridgeContract(routerToken?: any, version?: any, withSignerIfPossible?: boolean): Contract | null {
  return useContract(
    routerToken ? routerToken : undefined,
    version ? RouterSwapActionV2 : RouterSwapAction,
    withSignerIfPossible,
  )
}
