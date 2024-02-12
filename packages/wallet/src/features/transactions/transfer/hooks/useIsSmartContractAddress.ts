import { useCallback } from 'react'
import { useAsyncData } from 'utilities/src/react/hooks'
import { ChainId } from 'wallet/src/constants/chains'
import { useProvider } from 'wallet/src/features/wallet/context'

export function useIsSmartContractAddress(
  address: string | undefined,
  chainId: ChainId
): {
  loading: boolean
  isSmartContractAddress: boolean
} {
  const provider = useProvider(chainId)

  const fetchIsSmartContractAddress = useCallback(async () => {
    if (!address) {
      return false
    }
    const code = await provider?.getCode(address)
    // provider.getCode(address) will return a hex string if a smart contract is deployed at that address
    // returning just 0x means there's no code and it's not a smart contract
    return code !== '0x'
  }, [provider, address])

  const { data, isLoading } = useAsyncData(fetchIsSmartContractAddress)
  return { isSmartContractAddress: !!data, loading: isLoading }
}
