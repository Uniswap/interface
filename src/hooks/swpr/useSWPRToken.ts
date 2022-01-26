import { SWPR, Token } from '@swapr/sdk'
import { useMemo } from 'react'
import { useActiveWeb3React } from '..'

export const useSWPRToken = () => {
  const { chainId } = useActiveWeb3React()

  return useMemo(() => {
    const SWPRConfig = SWPR[chainId || 1]

    return new Token(
      chainId || 1,
      chainId === 4 ? '0x022e292b44b5a146f2e8ee36ff44d3dd863c915c' : SWPRConfig.address,
      SWPRConfig.decimals,
      SWPRConfig.symbol,
      SWPRConfig.name
    )
  }, [chainId])
}
