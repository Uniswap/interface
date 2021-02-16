import { useWeb3React } from '@web3-react/core'
import { Currency } from 'dxswap-sdk'

export function useNativeCurrency(): Currency {
  const { chainId } = useWeb3React()
  // fallback to ether if chain id is not defined
  if (!chainId) return Currency.ETHER
  return Currency.getNative(chainId) || Currency.ETHER
}
