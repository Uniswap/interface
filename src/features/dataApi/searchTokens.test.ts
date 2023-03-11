/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { MockedResponse } from '@apollo/client/testing'
import { SearchTokensDocument, SearchTokensQuery } from 'src/data/__generated__/types-and-hooks'
import { useTokenProjects } from 'src/features/dataApi/tokenProjects'
import { gqlTokenToCurrencyInfo } from 'src/features/dataApi/utils'
import { SearchTokens } from 'src/test/gqlFixtures'
import { renderHook } from 'src/test/test-utils'
import { sleep } from 'src/utils/timing'
import { useSearchTokens } from './searchTokens'

const mock: MockedResponse<SearchTokensQuery> = {
  request: {
    query: SearchTokensDocument,
    variables: {
      searchQuery: '',
    },
  },
  result: {
    data: {
      searchTokens: SearchTokens,
    },
  },
}

describe(useTokenProjects, () => {
  it('returns undefined when there is no data', async () => {
    const emptyMock = { ...mock, result: { data: {} } }
    const { result } = renderHook(() => useSearchTokens('', null, false), {
      mocks: [emptyMock],
    })

    await sleep(1000)

    expect(result.current.loading).toEqual(false)
    expect(result.current.data).toBe(undefined)
  })

  it('renders without error', async () => {
    const { result } = renderHook(() => useSearchTokens('', null, false), {
      mocks: [mock],
    })

    await sleep(1000)

    const data = result.current.data
    expect(data).toEqual([
      gqlTokenToCurrencyInfo(SearchTokens[1]!, null),
      gqlTokenToCurrencyInfo(SearchTokens[3]!, null),
      gqlTokenToCurrencyInfo(SearchTokens[0]!, null),
      gqlTokenToCurrencyInfo(SearchTokens[2]!, null),
      gqlTokenToCurrencyInfo(SearchTokens[4]!, null),
      gqlTokenToCurrencyInfo(SearchTokens[6]!, null),
      gqlTokenToCurrencyInfo(SearchTokens[5]!, null),
      gqlTokenToCurrencyInfo(SearchTokens[7]!, null),
      gqlTokenToCurrencyInfo(SearchTokens[8]!, null),
    ])
  })
})
