import { waitFor } from '@testing-library/react-native'
import { useSearchTokens } from 'uniswap/src/features/dataApi/searchTokens'
import { useTokenProjects } from 'uniswap/src/features/dataApi/tokenProjects'
import { gqlTokenToCurrencyInfo } from 'uniswap/src/features/dataApi/utils'
// TODO: https://linear.app/uniswap/issue/WEB-4376/move-universepackageswalletsrcfeaturesdataapi-tests-to-uniswap-pkg
import { token } from 'wallet/src/test/fixtures'
import { createArray, renderHook } from 'wallet/src/test/test-utils'
import { queryResolvers } from 'wallet/src/test/utils'

describe(useTokenProjects, () => {
  it('returns undefined when there is no data', async () => {
    const { resolvers } = queryResolvers({
      searchTokens: () => undefined,
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
