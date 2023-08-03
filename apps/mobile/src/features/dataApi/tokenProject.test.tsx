import { MockedResponse } from '@apollo/client/testing'
import { useTokenProjects } from 'src/features/dataApi/tokenProjects'
import { TokenProjects } from 'src/test/gqlFixtures'
import { renderHook } from 'src/test/test-utils'
import { sleep } from 'utilities/src/time/timing'
import {
  TokenProjectsDocument,
  TokenProjectsQuery,
} from 'wallet/src/data/__generated__/types-and-hooks'
import {
  currencyIdToContractInput,
  tokenProjectToCurrencyInfos,
} from 'wallet/src/features/dataApi/utils'
import { MainnetEth } from 'wallet/src/test/fixtures'
import { currencyId } from 'wallet/src/utils/currencyId'

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
