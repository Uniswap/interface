import { useMemo } from 'react'
import { getWrappedNativeAddress } from 'uniswap/src/constants/addresses'
import {
  Chain,
  SearchPopularTokensQuery,
  useSearchPopularTokensQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'

export type TopToken = NonNullable<NonNullable<SearchPopularTokensQuery['topTokens']>[0]>

// Popular tokens by top Uniswap trading volume
export function usePopularTokens(): {
  popularTokens: TopToken[] | undefined
  loading: boolean
} {
  // Load popular tokens by top Uniswap trading volume
  const { data, loading } = useSearchPopularTokensQuery()

  const popularTokens = useMemo(() => {
    if (!data || !data.topTokens) {
      return
    }

    // special case to replace weth with eth because the backend does not return eth data
    // eth will be defined only if all the required data is available
    // when eth data is not fully available, we do not replace weth with eth
    const eth = data?.eth && data?.eth.length > 0 && data?.eth?.[0]?.project ? data.eth[0] : null
    const wethAddress = getWrappedNativeAddress(UniverseChainId.Mainnet)

    return data.topTokens
      .map((token) => {
        if (!token) {
          return
        }

        const isWeth = areAddressesEqual(token.address, wethAddress) && token?.chain === Chain.Ethereum

        // manually replace weth with eth given backend only returns eth data as a proxy for eth
        if (isWeth && eth) {
          return eth
        }

        return token
      })
      .filter((t): t is TopToken => Boolean(t))
  }, [data])

  return { popularTokens, loading }
}
