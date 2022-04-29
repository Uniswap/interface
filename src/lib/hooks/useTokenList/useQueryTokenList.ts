import { NativeCurrency } from '@uniswap/sdk-core'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

import useTokenList from '.'
import { useQueryTokens } from './querying'

export function useQueryCurrencies(query = ''): (WrappedTokenInfo | NativeCurrency)[] {
  return useQueryTokens(query, useTokenList())
}
