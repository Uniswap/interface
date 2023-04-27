import { NativeCurrency, Token } from '@uniswap/sdk-core'
import { SupportedChainId } from 'constants/chains'
import { nativeOnChain } from 'constants/tokens'
import { Maybe } from 'graphql/jsutils/Maybe'
import { useMemo } from 'react'

export default function useNativeCurrency(chainId: Maybe<SupportedChainId>): NativeCurrency | Token {
  return useMemo(
    () =>
      chainId
        ? nativeOnChain(chainId)
        : // display mainnet when not connected
          nativeOnChain(SupportedChainId.MAINNET),
    [chainId]
  )
}
