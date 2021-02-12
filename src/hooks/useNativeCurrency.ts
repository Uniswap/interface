import { useWeb3React } from '@web3-react/core'
import { ChainId, Currency, NATIVE_CURRENCY } from 'dxswap-sdk'

export function useNativeCurrency(): Currency {
  const { chainId } = useWeb3React()
  return NATIVE_CURRENCY[chainId || ChainId.MAINNET]
}
