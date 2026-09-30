import { Code, ConnectError } from '@connectrpc/connect'
import { GetTokenGroupResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { UniverseChainId } from '@universe/chains'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { useGetTokenGroupQuery } from 'uniswap/src/data/apiClients/dataApiService/tokenGroups/useGetTokenGroupQuery'
import { renderHook, waitFor } from 'uniswap/src/test/test-utils'

const { mockUseEnabledChains } = vi.hoisted(() => ({ mockUseEnabledChains: vi.fn() }))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: mockUseEnabledChains,
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2', () => ({
  dataApiServiceClientV2: { getTokenGroup: vi.fn() },
}))

const mockGetTokenGroup = vi.mocked(dataApiServiceClientV2.getTokenGroup)

const MEMBER = { chainId: UniverseChainId.Mainnet, address: '0xAA20000000000000000000000000000000000102' }

describe(useGetTokenGroupQuery, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseEnabledChains.mockReturnValue({ chains: [UniverseChainId.Mainnet, UniverseChainId.Base] })
    mockGetTokenGroup.mockResolvedValue(new GetTokenGroupResponse({ group: { id: 'tsla' } }))
  })

  it('requests the group by member over the enabled chains without sparklines', async () => {
    const { result } = renderHook(() => useGetTokenGroupQuery({ member: MEMBER }))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetTokenGroup).toHaveBeenCalledTimes(1)
    expect(mockGetTokenGroup).toHaveBeenCalledWith({
      selector: { case: 'member', value: MEMBER },
      chainIds: [UniverseChainId.Mainnet, UniverseChainId.Base],
    })
    expect(result.current.data?.group?.id).toBe('tsla')
  })

  it('resolves null for an ungrouped token instead of erroring or retrying', async () => {
    mockGetTokenGroup.mockRejectedValue(new ConnectError('Token group not found', Code.NotFound))
    // Distinct member so the cached response from the previous case can't satisfy this query.
    const ungrouped = { chainId: UniverseChainId.Mainnet, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' }

    const { result } = renderHook(() => useGetTokenGroupQuery({ member: ungrouped }))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
    expect(mockGetTokenGroup).toHaveBeenCalledTimes(1)
  })

  it('does not fetch without a member or when disabled', () => {
    renderHook(() => useGetTokenGroupQuery({ member: undefined }))
    renderHook(() => useGetTokenGroupQuery({ member: MEMBER, enabled: false }))

    expect(mockGetTokenGroup).not.toHaveBeenCalled()
  })
})
