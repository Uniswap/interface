import { waitFor } from '@testing-library/react-native'
import { useTokenProjects } from 'wallet/src/features/dataApi/tokenProjects'
import { tokenProjectToCurrencyInfos } from 'wallet/src/features/dataApi/utils'
import { SAMPLE_CURRENCY_ID_1 } from 'wallet/src/test/fixtures'
import { TokenProjects } from 'wallet/src/test/gqlFixtures'
import { renderHook } from 'wallet/src/test/test-utils'

describe(useTokenProjects, () => {
  it('returns undefined when there is no data', async () => {
    const { result } = renderHook(() => useTokenProjects([SAMPLE_CURRENCY_ID_1]), {
      resolvers: {
        Query: {
          tokenProjects: () => null,
        },
      },
    })

    await waitFor(() => {
      expect(result.current.loading).toEqual(false)
      expect(result.current.data).toBe(undefined)
    })
  })

  it('renders without error', async () => {
    const { result } = renderHook(() => useTokenProjects([SAMPLE_CURRENCY_ID_1]), {
      resolvers: {
        Query: {
          tokenProjects: () => TokenProjects,
        },
      },
    })

    await waitFor(() => {
      const data = result.current.data
      expect(data).toEqual(tokenProjectToCurrencyInfos(TokenProjects))
    })
  })
})
