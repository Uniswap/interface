import { Resolvers } from '@apollo/client'
import { waitFor } from '@testing-library/react-native'
import { useTokenProjects } from 'wallet/src/features/dataApi/tokenProjects'
import { gqlTokenToCurrencyInfo } from 'wallet/src/features/dataApi/utils'
import { token, tokenProject } from 'wallet/src/test/fixtures'
import { createArray, renderHook } from 'wallet/src/test/test-utils'
import { useSearchTokens } from './searchTokens'

const searchTokens = createArray(5, () =>
  token({
    // There is no isSpam field in the query document, so we remove it from the token object
    project: tokenProject({ isSpam: null }),
  })
)

const resolvers: Resolvers = {
  Query: {
    searchTokens: () => searchTokens,
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
      expect(result.current.data).toEqual(searchTokens.map(gqlTokenToCurrencyInfo))
    })
  })
})
