// Based partly on https://github.com/Uniswap/interface/blob/main/src/hooks/useContract.ts

import { abi as MulticallABI } from '@uniswap/v3-periphery/artifacts/contracts/lens/UniswapInterfaceMulticall.sol/UniswapInterfaceMulticall.json'
import { Contract, ContractInterface } from 'ethers'
import { useMemo } from 'react'
import ERC20_ABI from 'src/abis/erc20.json'
import ERC20_BYTES32_ABI from 'src/abis/erc20_bytes32.json'
import { Erc20 } from 'src/abis/types'
import { UniswapInterfaceMulticall } from 'src/abis/uniswapV3/types'
import { useContractManager, useProviderManager } from 'src/app/walletContext'
import { MULTICALL_ADDRESS } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { logger } from 'src/utils/logger'

export function useContract<T extends Contract = Contract>(
  chainId: ChainId,
  addressOrAddressMap: string | { [chainId: number]: string } | undefined,
  ABI: ContractInterface
): T | null {
  const providerManager = useProviderManager()
  const provider = providerManager.tryGetProvider(chainId)
  const contractsManager = useContractManager()

  return useMemo(() => {
    if (!addressOrAddressMap || !ABI || !provider || !chainId) return null
    let address: Address | undefined
    if (typeof addressOrAddressMap === 'string') address = addressOrAddressMap
    else address = addressOrAddressMap[chainId]
    if (!address) return null
    try {
      return contractsManager.getOrCreateContract(chainId, address, provider, ABI)
    } catch (error) {
      logger.error('useContract', 'useContract', 'Failed to get contract', error)
      return null
    }
  }, [chainId, addressOrAddressMap, ABI, provider, contractsManager]) as T
}

export function useBytes32TokenContract(chainId: ChainId, tokenAddress?: Address): Contract | null {
  return useContract(chainId, tokenAddress, ERC20_BYTES32_ABI)
}

export function useMulticall2Contract(chainId: ChainId) {
  return useContract<UniswapInterfaceMulticall>(chainId, MULTICALL_ADDRESS, MulticallABI)
}

export function useTokenContract(chainId: ChainId, tokenAddress?: Address) {
  return useContract<Erc20>(chainId, tokenAddress, ERC20_ABI)
}
