import { Token } from '@uniswap/sdk-core'
import { useAccount } from 'hooks/useAccount'
import { useMemo } from 'react'
import { useAppSelector } from 'state/hooks'
import { dismissedWarningTokensSelector } from 'uniswap/src/features/tokens/slice/selectors'
import { isSerializedToken } from 'uniswap/src/features/tokens/slice/types'
import { deserializeToken } from 'uniswap/src/utils/currency'

export function useUserAddedTokens(): Token[] {
  const chainId = useAccount().chainId
  const serializedTokensMap = useAppSelector(dismissedWarningTokensSelector)

  return useMemo(() => {
    if (!chainId || !Object.keys(serializedTokensMap).includes(chainId.toString())) {
      return []
    }
    const basicTokens = Object.values(serializedTokensMap[chainId])
    return basicTokens.filter(isSerializedToken).map(deserializeToken)
  }, [serializedTokensMap, chainId])
}
