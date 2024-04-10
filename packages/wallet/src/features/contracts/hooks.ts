import { Contract } from '@ethersproject/contracts'
import { useCallback } from 'react'
import ERC20_ABI from 'uniswap/src/abis/erc20.json'
import { useAsyncData } from 'utilities/src/react/hooks'
import { ChainId } from 'wallet/src/constants/chains'
import { useIsSmartContractAddress } from 'wallet/src/features/transactions/transfer/hooks/useIsSmartContractAddress'
import { useProvider } from 'wallet/src/features/wallet/context'

export function useIsErc20Contract(address: string | undefined, chainId: ChainId): boolean {
  const provider = useProvider(chainId)
  const { isSmartContractAddress } = useIsSmartContractAddress(address, chainId)

  const fetchIsErc20 = useCallback(async () => {
    if (!address || !provider || !isSmartContractAddress) {
      return false
    }
    const contract = new Contract(address, ERC20_ABI, provider)
    try {
      await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply(),
      ])
      return true
    } catch (e) {
      return false
    }
  }, [address, isSmartContractAddress, provider])

  return Boolean(useAsyncData(fetchIsErc20).data)
}
