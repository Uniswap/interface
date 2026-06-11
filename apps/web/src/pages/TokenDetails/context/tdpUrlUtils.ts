import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { getTokenDetailsURL } from '~/appGraphql/data/util'
import { withoutChainSearchParam } from '~/utils/params/chainQueryParam'

export function getTokenDetailsURLForMultichainEntry({
  entry,
  searchParams,
}: {
  entry: MultichainTokenEntry
  searchParams: URLSearchParams
}): string {
  const path = getTokenDetailsURL({
    address: entry.isNative ? null : entry.address,
    chain: toGraphQLChain(entry.chainId),
  })
  const params = withoutChainSearchParam(searchParams)
  const query = params.toString()
  return `${path}${query ? `?${query}` : ''}`
}
