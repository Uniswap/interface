import { MockedResponse } from '@apollo/client/testing'
import { TokenProjectsDocument, TokenProjectsQuery } from 'src/data/__generated__/types-and-hooks'
import { useTokenProjects } from 'src/features/dataApi/tokenProjects'
import { currencyIdToContractInput, tokenProjectToCurrencyInfos } from 'src/features/dataApi/utils'
import { MainnetEth } from 'src/test/fixtures'
import { TokenProjects } from 'src/test/gqlFixtures'
import { renderHook } from 'src/test/test-utils'
import { currencyId } from 'src/utils/currencyId'
import { sleep } from 'src/utils/timing'

const _currencyId = currencyId(MainnetEth)

const mock: MockedResponse<TokenProjectsQuery> = {
  request: {
    query: TokenProjectsDocument,
    variables: {
      contracts: [currencyIdToContractInput(_currencyId)],
    },
  },
  result: {
    data: {
      tokenProjects: TokenProjects,
    },
  },
}

describe(useTokenProjects, () => {
  it('returns undefined when there is no data', async () => {
    const emptyMock = { ...mock, result: { data: {} } }
    const { result } = renderHook(() => useTokenProjects([_currencyId]), {
      mocks: [emptyMock],
    })

    await sleep(1000)

    expect(result.current.loading).toEqual(false)
    expect(result.current.data).toBe(undefined)
  })

  it('renders without error', async () => {
    const { result } = renderHook(() => useTokenProjects([_currencyId]), {
      mocks: [mock],
    })

    await sleep(1000)

    const data = result.current.data
    expect(data).toEqual(tokenProjectToCurrencyInfos(TokenProjects))
  })
})
