import { useQuery } from '@tanstack/react-query'
import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { GetTokenResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { UniverseChainId } from '@universe/chains'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { getGetTokenQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { currencyIdToRestContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { useRwaIssuer } from 'uniswap/src/features/rwa/hooks/useRwaIssuer'
import type { RWAMatch } from 'uniswap/src/features/rwa/rwaMatch'
import type { RWAToken } from 'uniswap/src/features/rwa/types'
import { renderHook, waitFor } from 'uniswap/src/test/test-utils'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

const { mockUseIsTokenCategoriesEnabled } = vi.hoisted(() => ({ mockUseIsTokenCategoriesEnabled: vi.fn() }))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useIsTokenCategoriesEnabled: mockUseIsTokenCategoriesEnabled,
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2', () => ({
  dataApiServiceClientV2: { getToken: vi.fn() },
}))

const mockGetToken = vi.mocked(dataApiServiceClientV2.getToken)

const XAGM_ID = buildCurrencyId(UniverseChainId.Mainnet, '0x123ffe0a3C62878dcbee2742227dc8990058d9E1')
const MATRIXDOCK = {
  id: 'coingecko-matrixdock-ecosystem',
  displayName: 'Matrixdock',
  logoUrl: 'https://example.com/matrixdock.jpg',
}

const GROUP_TOKEN: RWAToken = {
  chainId: UniverseChainId.Mainnet,
  address: '0x0000000000000000000000000000000000000001',
  issuer: 'ondo',
  issuerDisplayName: 'Ondo',
  issuerLogoUrl: 'https://example.com/ondo.png',
  name: 'Tesla (Ondo)',
  symbol: 'TSLAON',
  logoUrl: '',
}
const GROUP_MATCH: RWAMatch = {
  asset: { symbol: 'TSLA', name: 'Tesla', icon: '', tokens: [GROUP_TOKEN], category: RwaCategory.STOCKS },
  token: GROUP_TOKEN,
}

describe(useRwaIssuer, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseIsTokenCategoriesEnabled.mockReturnValue(true)
    mockGetToken.mockResolvedValue(new GetTokenResponse({ token: { issuer: MATRIXDOCK } }))
  })

  it('takes the issuer from the group match without fetching the token', () => {
    const { result } = renderHook(() => useRwaIssuer({ rwaMatch: GROUP_MATCH, currencyId: XAGM_ID }))

    expect(result.current).toEqual({ issuer: GROUP_TOKEN, isLoading: false })
    expect(mockGetToken).not.toHaveBeenCalled()
  })

  it('falls back to the GetToken issuer for an ungrouped token when token categories are on', async () => {
    const { result } = renderHook(() => useRwaIssuer({ rwaMatch: undefined, currencyId: XAGM_ID }))

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.issuer).toEqual({
      issuer: 'coingecko-matrixdock-ecosystem',
      issuerDisplayName: 'Matrixdock',
      issuerLogoUrl: 'https://example.com/matrixdock.jpg',
    })
  })

  it('returns nothing when the backend names no issuer', async () => {
    // Distinct token so the cached Matrixdock response can't satisfy this query.
    const stockId = buildCurrencyId(UniverseChainId.Mainnet, '0xfebded1b0986a8ee107f5ab1a1c5a813491deceb')
    mockGetToken.mockResolvedValue(new GetTokenResponse({ token: { symbol: 'CRCLx' } }))

    const { result } = renderHook(() => useRwaIssuer({ rwaMatch: undefined, currencyId: stockId }))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockGetToken).toHaveBeenCalledTimes(1)
    expect(result.current.issuer).toBeUndefined()
  })

  it('does not fetch when token categories are off', () => {
    mockUseIsTokenCategoriesEnabled.mockReturnValue(false)

    const { result } = renderHook(() => useRwaIssuer({ rwaMatch: undefined, currencyId: XAGM_ID }))

    expect(result.current).toEqual({ issuer: undefined, isLoading: false })
    expect(mockGetToken).not.toHaveBeenCalled()
  })

  it('does not report the page token read as loading while disabled', async () => {
    mockUseIsTokenCategoriesEnabled.mockReturnValue(false)
    const pendingId = buildCurrencyId(UniverseChainId.Mainnet, '0x45804880de22913dafe09f4980848ece6ecbaf78')
    const params = currencyIdToRestContractInput(pendingId)
    mockGetToken.mockReturnValue(new Promise<GetTokenResponse>(() => {}))

    const { result } = renderHook(() => ({
      page: useQuery(getGetTokenQueryOptions({ params })),
      rwaIssuer: useRwaIssuer({ rwaMatch: undefined, currencyId: pendingId }),
    }))

    await waitFor(() => expect(mockGetToken).toHaveBeenCalledTimes(1))
    expect(result.current.page.isLoading).toBe(true)
    expect(result.current.rwaIssuer).toEqual({ issuer: undefined, isLoading: false })
  })
})
