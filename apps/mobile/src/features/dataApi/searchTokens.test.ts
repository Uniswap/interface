/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { MockedResponse } from '@apollo/client/testing'
import { useTokenProjects } from 'src/features/dataApi/tokenProjects'
import { SearchTokens } from 'src/test/gqlFixtures'
import { renderHook } from 'src/test/test-utils'
import { sleep } from 'utilities/src/time/timing'
import {
  SearchTokensDocument,
  SearchTokensQuery,
} from 'wallet/src/data/__generated__/types-and-hooks'
import { gqlTokenToCurrencyInfo } from 'wallet/src/features/dataApi/utils'
import { ALL_GQL_CHAINS, useSearchTokens } from './searchTokens'

const mock: MockedResponse<SearchTokensQuery> = {
  request: {
    query: SearchTokensDocument,
    variables: {
      searchQuery: '',
      chains: ALL_GQL_CHAINS,
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
