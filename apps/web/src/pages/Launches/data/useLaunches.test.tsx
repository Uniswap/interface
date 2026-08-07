import { ListLaunchesResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { LaunchesOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { Mock } from 'vitest'
import { vi } from 'vitest'
import { LAUNCHES_API_PAGE_SIZE, useLaunches } from '~/pages/Launches/data/useLaunches'
import { act, renderHook, waitFor } from '~/test-utils/render'

vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2', () => ({
  dataApiServiceClientV2: {
    listLaunches: vi.fn(),
    listLaunchpads: vi.fn(),
  },
}))

const mockListLaunches = dataApiServiceClientV2.listLaunches as Mock

function createLaunch({
  launchpadId,
  symbol,
  chainId = UniverseChainId.Unichain,
  volume24hUsd,
}: {
  launchpadId: string
  symbol: string
  chainId?: UniverseChainId
  volume24hUsd?: number
}) {
  return {
    launchpadId,
    token: {
      chainId,
      address: '0x0000000000000000000000000000000000000001',
      symbol,
      name: symbol,
    },
    poolId: `0xpool-${symbol}`,
    launchedAt: BigInt(1_752_000_000),
    stats: { volume24hUsd },
  }
}

describe('useLaunches', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('passes launchpad, chain, and sort filters through to ListLaunches and returns launches', async () => {
    mockListLaunches.mockResolvedValue(
      new ListLaunchesResponse({
        launches: [createLaunch({ launchpadId: 'noxa', symbol: 'NOX', volume24hUsd: 1234.5 })],
        page: {},
      }),
    )

    const { result } = renderHook(() =>
      useLaunches({
        launchpadId: 'noxa',
        chainIds: [UniverseChainId.Unichain],
        sortBy: LaunchesOrderBy.VOLUME_1D,
      }),
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(mockListLaunches).toHaveBeenCalledWith({
      launchpadId: 'noxa',
      launchpadIds: [],
      chainIds: [UniverseChainId.Unichain],
      sortBy: LaunchesOrderBy.VOLUME_1D,
      ascending: false,
      filter: undefined,
      page: { pageSize: LAUNCHES_API_PAGE_SIZE, pageToken: undefined },
    })
    expect(result.current.launches).toHaveLength(1)
    expect(result.current.launches[0]?.token?.symbol).toBe('NOX')
    expect(result.current.launches[0]?.stats?.volume24hUsd).toBe(1234.5)
    expect(result.current.hasNextPage).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  it('forwards a multi-launchpad selection through launchpadIds', async () => {
    mockListLaunches.mockResolvedValue(new ListLaunchesResponse({ launches: [], page: {} }))

    const { result } = renderHook(() => useLaunches({ launchpadIds: ['noxa', 'flaunch'] }))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(mockListLaunches).toHaveBeenCalledWith(expect.objectContaining({ launchpadIds: ['noxa', 'flaunch'] }))
  })

  it('sends an empty launchpadIds (all launchpads) when the selection is empty', async () => {
    mockListLaunches.mockResolvedValue(new ListLaunchesResponse({ launches: [], page: {} }))

    const { result } = renderHook(() => useLaunches({ launchpadIds: [] }))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(mockListLaunches.mock.calls[0]?.[0]?.launchpadIds).toEqual([])
  })

  it('fetches the next page with the returned page token and flattens pages', async () => {
    mockListLaunches
      .mockResolvedValueOnce(
        new ListLaunchesResponse({
          launches: [createLaunch({ launchpadId: 'pump-fun', symbol: 'ONE' })],
          page: { nextPageToken: 'page-2' },
        }),
      )
      .mockResolvedValueOnce(
        new ListLaunchesResponse({
          launches: [createLaunch({ launchpadId: 'pump-fun', symbol: 'TWO' })],
          page: {},
        }),
      )

    const { result } = renderHook(() => useLaunches({ chainIds: [UniverseChainId.Base] }))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.hasNextPage).toBe(true)

    await act(async () => {
      await result.current.loadMore()
    })

    await waitFor(() => expect(result.current.launches).toHaveLength(2))
    expect(mockListLaunches).toHaveBeenCalledTimes(2)
    expect(mockListLaunches).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: { pageSize: LAUNCHES_API_PAGE_SIZE, pageToken: 'page-2' } }),
    )
    expect(result.current.launches.map((launch) => launch.token?.symbol)).toEqual(['ONE', 'TWO'])
    expect(result.current.hasNextPage).toBe(false)
  })

  it('restarts from the first page when the launchpad filter changes', async () => {
    mockListLaunches.mockResolvedValue(new ListLaunchesResponse({ launches: [], page: {} }))

    const { result, rerender } = renderHook((launchpadId: string) => useLaunches({ launchpadId }), {
      initialProps: 'zora',
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    rerender('believe')

    await waitFor(() =>
      expect(mockListLaunches).toHaveBeenLastCalledWith(
        expect.objectContaining({
          launchpadId: 'believe',
          page: { pageSize: LAUNCHES_API_PAGE_SIZE, pageToken: undefined },
        }),
      ),
    )
  })
})
