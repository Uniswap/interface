import { waitFor } from '@testing-library/react-native'
import { useTokenProjects } from 'uniswap/src/features/dataApi/tokenProjects'
import { tokenProjectToCurrencyInfos } from 'uniswap/src/features/dataApi/utils'
// TODO: https://linear.app/uniswap/issue/WEB-4376/move-universepackageswalletsrcfeaturesdataapi-tests-to-uniswap-pkg
import { SAMPLE_CURRENCY_ID_1, usdcTokenProject } from 'wallet/src/test/fixtures'
import { renderHook } from 'wallet/src/test/test-utils'
import { queryResolvers } from 'wallet/src/test/utils'

describe(useTokenProjects, () => {
  it('returns undefined when there is no data', async () => {
    const { resolvers } = queryResolvers({
      tokenProjects: () => undefined,
    })
    const { result } = renderHook(() => useTokenProjects([SAMPLE_CURRENCY_ID_1]), {
      resolvers,
    })

    await waitFor(() => {
      expect(result.current.loading).toEqual(false)
      expect(result.current.data).toBe(undefined)
    })
  })

  it('renders without error', async () => {
    const { resolvers, resolved } = queryResolvers({
      tokenProjects: () => [usdcTokenProject()],
    })
    const { result } = renderHook(() => useTokenProjects([SAMPLE_CURRENCY_ID_1]), {
      resolvers,
    })

    await waitFor(async () => {
      const data = result.current.data
      expect(data).toEqual(tokenProjectToCurrencyInfos(await resolved.tokenProjects))
    })
  })
})
