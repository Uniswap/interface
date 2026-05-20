import { OnchainItemListOptionType } from 'uniswap/src/components/lists/items/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useWalletSearchResults } from 'uniswap/src/features/search/SearchModal/hooks/useWalletSearchResults'
import { renderHook } from 'uniswap/src/test/test-utils'

const VITALIK_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
const OTHER_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678'

const { mockUseENS, mockUseUnitagsAddressQuery, mockUseUnitagsUsernameQuery, mockUseIsSmartContractAddress } =
  vi.hoisted(() => ({
    mockUseENS: vi.fn(),
    mockUseUnitagsAddressQuery: vi.fn(),
    mockUseUnitagsUsernameQuery: vi.fn(),
    mockUseIsSmartContractAddress: vi.fn(),
  }))

vi.mock('uniswap/src/features/ens/useENS', () => ({
  useENS: mockUseENS,
}))

vi.mock('uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery', () => ({
  useUnitagsAddressQuery: mockUseUnitagsAddressQuery,
}))

vi.mock('uniswap/src/data/apiClients/unitagsApi/useUnitagsUsernameQuery', () => ({
  useUnitagsUsernameQuery: mockUseUnitagsUsernameQuery,
}))

vi.mock('uniswap/src/features/address/useIsSmartContractAddress', () => ({
  useIsSmartContractAddress: mockUseIsSmartContractAddress,
}))

describe('useWalletSearchResults', () => {
  beforeEach(() => {
    mockUseENS.mockReturnValue({ address: null, name: null, loading: false })
    mockUseUnitagsAddressQuery.mockReturnValue({ data: undefined, isLoading: false })
    mockUseUnitagsUsernameQuery.mockReturnValue({ data: undefined, isLoading: false })
    mockUseIsSmartContractAddress.mockReturnValue({ isSmartContractAddress: false, loading: false })
  })

  it('returns an ENSAddress entry when useENS resolves a name', () => {
    mockUseENS.mockReturnValue({ address: VITALIK_ADDRESS, name: 'vitalik.eth', loading: false })

    const { result } = renderHook(() => useWalletSearchResults('vitalik.eth', UniverseChainId.Mainnet))

    expect(result.current.wallets).toEqual([
      expect.objectContaining({
        type: OnchainItemListOptionType.ENSAddress,
        address: VITALIK_ADDRESS,
        ensName: 'vitalik.eth',
      }),
    ])
    expect(result.current.exactENSMatch).toBe(true)
    expect(result.current.loading).toBe(false)
  })

  it('returns no wallets when ENS does not resolve and no unitag matches', () => {
    // Mirrors the broken-e2e state: useENS silently returns null because the underlying
    // RPC call fails (e2e builds point mainnet RPC at a Playwright-only localhost Anvil).
    // The hook should produce an empty wallet list — no exception, no stale entry.
    const { result } = renderHook(() => useWalletSearchResults('vitalik.eth', UniverseChainId.Mainnet))

    expect(result.current.wallets).toEqual([])
    expect(result.current.exactENSMatch).toBe(false)
    expect(result.current.loading).toBe(false)
  })

  it('prioritizes a unitag-by-name match over an ENS result', () => {
    mockUseENS.mockReturnValue({ address: VITALIK_ADDRESS, name: 'vitalik.eth', loading: false })
    mockUseUnitagsUsernameQuery.mockReturnValue({
      data: { address: OTHER_ADDRESS, username: 'vitalik' },
      isLoading: false,
    })

    const { result } = renderHook(() => useWalletSearchResults('vitalik', UniverseChainId.Mainnet))

    expect(result.current.wallets[0]).toEqual(
      expect.objectContaining({
        type: OnchainItemListOptionType.Unitag,
        address: OTHER_ADDRESS,
        unitag: 'vitalik',
      }),
    )
    expect(result.current.exactUnitagMatch).toBe(true)
  })

  it('reports loading while ENS is in flight', () => {
    mockUseENS.mockReturnValue({ address: null, name: null, loading: true })

    const { result } = renderHook(() => useWalletSearchResults('vitalik.eth', UniverseChainId.Mainnet))

    expect(result.current.loading).toBe(true)
  })
})
