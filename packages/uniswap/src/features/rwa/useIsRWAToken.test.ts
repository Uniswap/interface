import type { Currency } from '@uniswap/sdk-core'
import { useListRwasQuery } from 'uniswap/src/data/rest/listRwas'
import { useIsRWAToken } from 'uniswap/src/features/rwa/useIsRWAToken'
import { renderHook } from 'uniswap/src/test/test-utils'

vi.mock('uniswap/src/data/rest/listRwas', () => ({
  useListRwasQuery: vi.fn(),
}))

const MAINNET_CHAIN_ID = 1
const BNB_CHAIN_ID = 56
const TSLA_MAINNET_ADDRESS = '0xf6b1117ec07684D3958caD8BEb1b302bfD21103f'
const TSLA_BNB_ADDRESS = '0x2494b603319d4d9f9715c9f4496d9e0364b59d93'
const OTHER_BNB_ADDRESS = '0x1111111111111111111111111111111111111111'

const mockUseListRwasQuery = vi.mocked(useListRwasQuery)

function currency(chainId: number, address: string): Currency {
  return { chainId, address, isNative: false } as unknown as Currency
}

function mockRwaData(): void {
  mockUseListRwasQuery.mockReturnValue({
    data: {
      rwas: [
        {
          symbol: 'TSLA',
          name: 'Tesla',
          logoUrl: 'https://example.com/tesla.png',
          issuerTokens: [
            { chainId: MAINNET_CHAIN_ID, address: TSLA_MAINNET_ADDRESS, issuer: 'ondo' },
            { chainId: BNB_CHAIN_ID, address: TSLA_BNB_ADDRESS, issuer: 'ondo' },
          ],
          issuerData: {
            ondo: { name: 'Ondo', symbol: 'TSLA.on', logoUrl: 'https://example.com/ondo.png' },
          },
        },
      ],
    },
  } as never)
}

describe(useIsRWAToken, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRwaData()
  })

  it('does not fetch and returns false when disabled', () => {
    const { result } = renderHook(() => useIsRWAToken(currency(BNB_CHAIN_ID, TSLA_BNB_ADDRESS), { enabled: false }))

    expect(mockUseListRwasQuery).toHaveBeenCalledWith({ chainIds: [BNB_CHAIN_ID], enabled: false })
    expect(result.current).toBe(false)
  })

  it('matches non-preferred chain RWA tokens from the raw listRwas response when enabled', () => {
    const { result } = renderHook(() => useIsRWAToken(currency(BNB_CHAIN_ID, TSLA_BNB_ADDRESS), { enabled: true }))

    expect(mockUseListRwasQuery).toHaveBeenCalledWith({ chainIds: [BNB_CHAIN_ID], enabled: true })
    expect(result.current).toBe(true)
  })

  it('returns false when the selected token is not in the raw listRwas response', () => {
    const { result } = renderHook(() => useIsRWAToken(currency(BNB_CHAIN_ID, OTHER_BNB_ADDRESS), { enabled: true }))

    expect(result.current).toBe(false)
  })

  it('defaults to enabled when no options are passed', () => {
    const { result } = renderHook(() => useIsRWAToken(currency(BNB_CHAIN_ID, TSLA_BNB_ADDRESS)))

    expect(mockUseListRwasQuery).toHaveBeenCalledWith({ chainIds: [BNB_CHAIN_ID], enabled: true })
    expect(result.current).toBe(true)
  })
})
