import { Token } from '@uniswap/sdk'

import useIsDefaultToken from './useIsDefaultToken'
import { useAllTokens } from './Tokens'

export default function useIsCustomAddedToken(token?: Token): boolean {
  const allTokens = useAllTokens()
  const isDefaultToken = useIsDefaultToken(token)
  return Boolean(token && allTokens[token.address] && !isDefaultToken)
}
