import { ListLaunchpadsResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import type { Mock } from 'vitest'
import { vi } from 'vitest'
import { useLaunchpads } from '~/pages/Launches/data/useLaunchpads'
import { renderHook, waitFor } from '~/test-utils/render'

vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2', () => ({
  dataApiServiceClientV2: {
    listLaunches: vi.fn(),
    listLaunchpads: vi.fn(),
  },
}))

const mockListLaunchpads = dataApiServiceClientV2.listLaunchpads as Mock

describe('useLaunchpads', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the launchpad registry and an id lookup map', async () => {
    mockListLaunchpads.mockResolvedValue(
      new ListLaunchpadsResponse({
        launchpads: [
          { id: 'noxa', name: 'Noxa', logoUrl: 'https://example.com/noxa.png' },
          { id: 'pump-fun', name: 'pump.fun', protocol: 'doppler' },
        ],
      }),
    )

    const { result } = renderHook(() => useLaunchpads())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.launchpads).toHaveLength(2)
    expect(result.current.launchpadById.get('noxa')?.name).toBe('Noxa')
    expect(result.current.launchpadById.get('pump-fun')?.protocol).toBe('doppler')
    expect(result.current.isError).toBe(false)
  })
})
