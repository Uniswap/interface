import { waitFor } from '@testing-library/react-native'
import { useTokenProjects } from 'wallet/src/features/dataApi/tokenProjects'
import { gqlTokenToCurrencyInfo } from 'wallet/src/features/dataApi/utils'
import { token } from 'wallet/src/test/fixtures'
import { createArray, renderHook } from 'wallet/src/test/test-utils'
import { queryResolvers } from 'wallet/src/test/utils'
import { useSearchTokens } from './searchTokens'

describe(useTokenProjects, () => {
  it('returns undefined when there is no data', async () => {
    const { resolvers } = queryResolvers({
      searchTokens: () => null,
    })
    const { result } = renderHook(() => useSearchTokens('', null, false), {
      resolvers,
    })

    await waitFor(() => {
      expect(result.current.loading).toEqual(false)
      expect(result.current.data).toBe(undefined)
    })
  })

  it('renders without error', async () => {
    const { resolvers, resolved } = queryResolvers({
      searchTokens: () => createArray(5, token),
    })
    const { result } = renderHook(() => useSearchTokens('', null, false), {
      resolvers,
    })

    await waitFor(async () => {
      expect(result.current.data).toEqual((await resolved.searchTokens).map(gqlTokenToCurrencyInfo))
    })
  })
})
