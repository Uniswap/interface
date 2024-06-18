import { ChainId, NativeCurrency, Token } from '@taraswap/sdk-core'
import { nativeOnChain } from 'constants/tokens'
import { useMemo } from 'react'

export default function useNativeCurrency(chainId: ChainId | null | undefined): NativeCurrency | Token {
  return useMemo(
    () =>
      chainId
        ? nativeOnChain(chainId)
        : // display mainnet when not connected
          nativeOnChain(ChainId.MAINNET),
    [chainId]
  )
}
