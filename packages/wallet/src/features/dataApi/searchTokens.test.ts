/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Resolvers } from '@apollo/client'
import { waitFor } from '@testing-library/react-native'
import { useTokenProjects } from 'wallet/src/features/dataApi/tokenProjects'
import { gqlTokenToCurrencyInfo } from 'wallet/src/features/dataApi/utils'
import { SearchTokens } from 'wallet/src/test/gqlFixtures'
import { renderHook } from 'wallet/src/test/test-utils'
import { useSearchTokens } from './searchTokens'

const resolvers: Resolvers = {
  Query: {
    searchTokens: () => SearchTokens,
  },
}

describe(useTokenProjects, () => {
  it('returns undefined when there is no data', async () => {
    const { result } = renderHook(() => useSearchTokens('', null, false), {
      resolvers: {
        Query: {
          searchTokens: () => null,
        },
      },
    })

    await waitFor(() => {
      expect(result.current.loading).toEqual(false)
      expect(result.current.data).toBe(undefined)
    })
  })

  it('renders without error', async () => {
    const { result } = renderHook(() => useSearchTokens('', null, false), {
      resolvers,
    })

    await waitFor(() => {
      expect(result.current.data).toEqual([
        gqlTokenToCurrencyInfo(SearchTokens[0]!),
        gqlTokenToCurrencyInfo(SearchTokens[1]!),
        gqlTokenToCurrencyInfo(SearchTokens[2]!),
        gqlTokenToCurrencyInfo(SearchTokens[3]!),
        gqlTokenToCurrencyInfo(SearchTokens[4]!),
        gqlTokenToCurrencyInfo(SearchTokens[5]!),
        gqlTokenToCurrencyInfo(SearchTokens[6]!),
        gqlTokenToCurrencyInfo(SearchTokens[7]!),
        gqlTokenToCurrencyInfo(SearchTokens[8]!),
      ])
    })
  })
})
