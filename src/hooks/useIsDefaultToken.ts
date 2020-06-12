import { Token } from '@uniswap/sdk'

import { ALL_TOKENS } from '../constants/tokens'

export function isDefaultToken(token?: Token): boolean {
  return Boolean(token && ALL_TOKENS[token.chainId]?.[token.address])
}

export default function useIsDefaultToken(token?: Token): boolean {
  return isDefaultToken(token)
}
