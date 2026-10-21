import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, renderHook, waitFor } from '@testing-library/react-native'
import { GetTokenResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { LaunchMethod } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import { createElement, type PropsWithChildren } from 'react'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'
import { useTokenLaunchProvenance } from 'uniswap/src/features/dataApi/useTokenLaunchProvenance'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2', () => ({
  dataApiServiceClientV2: { getToken: vi.fn() },
}))

const BANKR_TOKEN = buildCurrencyId(UniverseChainId.Mainnet, '0x1111111111111111111111111111111111111111')
const NEXT_TOKEN = buildCurrencyId(UniverseChainId.Mainnet, '0x2222222222222222222222222222222222222222')

const mockGetToken = vi.mocked(dataApiServiceClientV2.getToken)

function launchedBy(id: string, name: string): GetTokenResponse {
  return new GetTokenResponse({
    token: { launchProvenance: { launchpad: { id, name }, launchMethod: LaunchMethod.INSTANT } },
  })
}

describe(useTokenLaunchProvenance, () => {
  let queryClient: QueryClient

  function Wrapper({ children }: PropsWithChildren): JSX.Element {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    mockGetToken.mockReset().mockResolvedValue(launchedBy('bankr', 'Bankr'))
  })

  afterEach(() => {
    cleanup()
    queryClient.clear()
  })

  it('reads the launchpad off the served token', async () => {
    const { result } = renderHook(() => useTokenLaunchProvenance(BANKR_TOKEN), { wrapper: Wrapper })

    await waitFor(() =>
      expect(result.current).toEqual({
        launchpad: { id: 'bankr', name: 'Bankr', logoUrl: undefined },
        method: LaunchProvenanceMethod.InstantLaunch,
      }),
    )
  })

  it('shows nothing rather than the previous token while the next one loads', async () => {
    const { result, rerender } = renderHook((currencyId: string) => useTokenLaunchProvenance(currencyId), {
      initialProps: BANKR_TOKEN,
      wrapper: Wrapper,
    })
    await waitFor(() => expect(result.current?.launchpad.id).toBe('bankr'))

    mockGetToken.mockReturnValueOnce(new Promise<never>(() => {}))
    rerender(NEXT_TOKEN)

    expect(mockGetToken).toHaveBeenCalledTimes(2)
    expect(result.current).toBeUndefined()
  })
})
