import { waitFor } from '@testing-library/react-native'
import { useTokenProjects } from 'src/features/dataApi/tokenProjects'
import { renderHook } from 'src/test/test-utils'
import { tokenProjectToCurrencyInfos } from 'wallet/src/features/dataApi/utils'
import { SAMPLE_CURRENCY_ID_1 } from 'wallet/src/test/fixtures'
import { TokenProjects } from 'wallet/src/test/gqlFixtures'

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
