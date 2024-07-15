import { Contract } from '@ethersproject/contracts'
import { useCallback } from 'react'
import ERC20_ABI from 'uniswap/src/abis/erc20.json'
import { WalletChainId } from 'uniswap/src/types/chains'
import { useAsyncData } from 'utilities/src/react/hooks'
import { useIsSmartContractAddress } from 'wallet/src/features/transactions/transfer/hooks/useIsSmartContractAddress'
import { useProvider } from 'wallet/src/features/wallet/context'

export function useIsErc20Contract(address: string | undefined, chainId: WalletChainId): boolean {
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
    } catch (e) {
      return false
    }
  }, [address, isSmartContractAddress, provider])

  return Boolean(useAsyncData(fetchIsErc20).data)
}
