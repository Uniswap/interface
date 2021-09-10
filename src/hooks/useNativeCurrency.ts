import { Currency } from '@swapr/sdk'
import { useActiveWeb3React } from '.'

export function useNativeCurrency(): Currency {
  const { chainId } = useActiveWeb3React()
  // fallback to ether if chain id is not defined
  if (!chainId) return Currency.ETHER
  return Currency.getNative(chainId) || Currency.ETHER
}
