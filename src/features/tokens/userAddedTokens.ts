// Copied some parts from https://github.com/Uniswap/interface/blob/main/src/state/user/hooks.tsx

import { Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { SerializedToken } from 'src/features/tokenLists/types'
import { getKeys } from 'src/utils/objects'

export function serializeToken(token: Token): SerializedToken {
  return {
    chainId: token.chainId,
    address: token.address,
    decimals: token.decimals,
    symbol: token.symbol,
    name: token.name,
  }
}

export function deserializeToken(serializedToken: SerializedToken): Token {
  return new Token(
    serializedToken.chainId,
    serializedToken.address,
    serializedToken.decimals,
    serializedToken.symbol,
    serializedToken.name
  )
}

export function useUserAddedTokens(): Token[] {
  const serializedTokensMap = useAppSelector((state) => state.tokens.customTokens)

  return useMemo(() => {
    let result: Token[] = []
    for (const chainId of getKeys(serializedTokensMap)) {
      result = result.concat(
        Object.values(serializedTokensMap[chainId] ?? {}).map(deserializeToken)
      )
    }
    return result
  }, [serializedTokensMap])
}
