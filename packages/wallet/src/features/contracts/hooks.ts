import { Contract } from '@ethersproject/contracts'
import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'
import ERC20_ABI from 'uniswap/src/abis/erc20.json'
import { useIsSmartContractAddress } from 'uniswap/src/features/address/useIsSmartContractAddress'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { useProvider } from 'wallet/src/features/wallet/context'

export function useIsErc20Contract(
  address: string | undefined,
  chainId: UniverseChainId,
): {
  loading: boolean
  isERC20ContractAddress: boolean
} {
  const provider = useProvider(chainId)
  const { isSmartContractAddress } = useIsSmartContractAddress(address, chainId)

  const fetchIsErc20 = useCallback(async () => {
    if (!address || !provider || !isSmartContractAddress) {
      return false
    }
    const contract = new Contract(address, ERC20_ABI, provider)
    try {
      await Promise.all([contract.name(), contract.symbol(), contract.decimals(), contract.totalSupply()])
      return true
    } catch (_e) {
      return false
    }
  }, [address, isSmartContractAddress, provider])

  const { data, isLoading } = useQuery({
    queryKey: [ReactQueryCacheKey.IsErc20ContractAddress, address, chainId],
    queryFn: fetchIsErc20,
  })
  return { isERC20ContractAddress: !!data, loading: isLoading }
}
