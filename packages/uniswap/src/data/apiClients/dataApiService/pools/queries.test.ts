import type { PlainMessage } from '@bufbuild/protobuf'
import type { ListPoolsResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { getConnectQueryRetryDelay, shouldRetryConnectQuery } from '@universe/api'
import { getListPoolsInfiniteQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/pools/queries'

function nextPageParamFor(lastPage: PlainMessage<ListPoolsResponse>): string | undefined {
  const { getNextPageParam } = getListPoolsInfiniteQueryOptions({ params: { chainIds: [1] } })
  return getNextPageParam(lastPage, [lastPage], '', ['']) ?? undefined
}

describe(getListPoolsInfiniteQueryOptions, () => {
  it('uses the shared ConnectRPC retry policy — the global policy only retries FetchError 500s, which never matches a ConnectRPC error', () => {
    const options = getListPoolsInfiniteQueryOptions({ params: { chainIds: [1] } })
    expect(options.retry).toBe(shouldRetryConnectQuery)
    expect(options.retryDelay).toBe(getConnectQueryRetryDelay)
  })

  // A ranked walk that hits its candidate budget serves a short — possibly empty — page with a
  // resume cursor; the backend never puts a token on a genuinely final page (limit+1 lookahead).
  it('follows the nextPageToken of an empty page: it is a budget-slice resume cursor, not an end-of-list', () => {
    expect(nextPageParamFor({ pools: [], page: { nextPageToken: 'resume-from-frontier' } })).toBe(
      'resume-from-frontier',
    )
  })

  it('stops when the page carries no nextPageToken', () => {
    expect(nextPageParamFor({ pools: [], page: { nextPageToken: '' } })).toBeUndefined()
    expect(nextPageParamFor({ pools: [], page: undefined })).toBeUndefined()
  })
})
