import { Token } from '@uniswap/sdk-core'
import { useAccount } from 'hooks/useAccount'
import { useMemo } from 'react'
import { useAppSelector } from 'state/hooks'
import { deserializeToken } from 'state/user/utils'
import { UserAddedToken } from 'types/tokens'

function useUserAddedTokensOnChain(chainId: number | undefined | null): Token[] {
  const serializedTokensMap = useAppSelector(({ user: { tokens } }) => tokens)

  return useMemo(() => {
    if (!chainId) {
      return []
    }
    const tokenMap: Token[] = serializedTokensMap?.[chainId]
      ? Object.values(serializedTokensMap[chainId]).map((value) => deserializeToken(value, UserAddedToken))
      : []
    return tokenMap
  }, [serializedTokensMap, chainId])
}

export function useUserAddedTokens(): Token[] {
  return useUserAddedTokensOnChain(useAccount().chainId)
}
