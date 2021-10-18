// Based partly on https://github.com/Uniswap/interface/blob/main/src/hooks/useContract.ts

import { WETH9 } from '@uniswap/sdk-core'
import { abi as IUniswapV2PairABI } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import { abi as QuoterABI } from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json'
import { abi as MulticallABI } from '@uniswap/v3-periphery/artifacts/contracts/lens/UniswapInterfaceMulticall.sol/UniswapInterfaceMulticall.json'
import { abi as NFTPositionManagerABI } from '@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json'
import { Contract } from 'ethers'
import { useMemo } from 'react'
import EIP_2612 from 'src/abis/eip_2612.json'
import ENS_PUBLIC_RESOLVER_ABI from 'src/abis/ens-public-resolver.json'
import ENS_ABI from 'src/abis/ens-registrar.json'
import ERC20_ABI from 'src/abis/erc20.json'
import ERC20_BYTES32_ABI from 'src/abis/erc20_bytes32.json'
import { EnsPublicResolver, EnsRegistrar, Erc20, Weth } from 'src/abis/types'
import {
  NonfungiblePositionManager,
  Quoter,
  UniswapInterfaceMulticall,
} from 'src/abis/uniswapV3/types'
import WETH_ABI from 'src/abis/weth.json'
import { useWalletContracts, useWalletProviders } from 'src/app/walletContext'
import {
  ENS_REGISTRAR_ADDRESSES,
  MULTICALL_ADDRESS,
  NONFUNGIBLE_POSITION_MANAGER_ADDRESSES,
  QUOTER_ADDRESSES,
} from 'src/constants/addresses'
import { SupportedChainId } from 'src/constants/chains'
import { logger } from 'src/utils/logger'

export function useContract<T extends Contract = Contract>(
  chainId: SupportedChainId,
  addressOrAddressMap: string | { [chainId: number]: string } | undefined,
  ABI: any
): T | null {
  const providerManager = useWalletProviders()
  const provider = providerManager.tryGetProvider(chainId)
  const contractsManager = useWalletContracts()

  return useMemo(() => {
    if (!addressOrAddressMap || !ABI || !provider || !chainId) return null
    let address: string | undefined
    if (typeof addressOrAddressMap === 'string') address = addressOrAddressMap
    else address = addressOrAddressMap[chainId]
    if (!address) return null
    try {
      return contractsManager.getOrCreateContract(chainId, address, provider, ABI)
    } catch (error) {
      logger.error('Failed to get contract', error)
      return null
    }
  }, [chainId, addressOrAddressMap, ABI, provider, contractsManager]) as T
}

export function useBytes32TokenContract(
  chainId: SupportedChainId,
  tokenAddress?: string
): Contract | null {
  return useContract(chainId, tokenAddress, ERC20_BYTES32_ABI)
}

export function useEIP2612Contract(
  chainId: SupportedChainId,
  tokenAddress?: string
): Contract | null {
  return useContract(chainId, tokenAddress, EIP_2612)
}

export function useENSRegistrarContract(chainId: SupportedChainId) {
  return useContract<EnsRegistrar>(chainId, ENS_REGISTRAR_ADDRESSES, ENS_ABI)
}

export function useENSResolverContract(chainId: SupportedChainId, address: string | undefined) {
  return useContract<EnsPublicResolver>(chainId, address, ENS_PUBLIC_RESOLVER_ABI)
}

export function useMulticall2Contract(chainId: SupportedChainId) {
  return useContract<UniswapInterfaceMulticall>(chainId, MULTICALL_ADDRESS, MulticallABI)
}

export function usePairContract(chainId: SupportedChainId, pairAddress?: string): Contract | null {
  return useContract(chainId, pairAddress, IUniswapV2PairABI)
}

export function useTokenContract(chainId: SupportedChainId, tokenAddress?: string) {
  return useContract<Erc20>(chainId, tokenAddress, ERC20_ABI)
}

export function useV3NFTPositionManagerContract(
  chainId: SupportedChainId
): NonfungiblePositionManager | null {
  return useContract<NonfungiblePositionManager>(
    chainId,
    NONFUNGIBLE_POSITION_MANAGER_ADDRESSES,
    NFTPositionManagerABI
  )
}

export function useV3Quoter(chainId: SupportedChainId) {
  return useContract<Quoter>(chainId, QUOTER_ADDRESSES, QuoterABI)
}

export function useWETHContract(chainId: SupportedChainId) {
  return useContract<Weth>(chainId, WETH9[chainId]?.address, WETH_ABI)
}
