import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { TradingApi } from '@universe/api'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useActiveAddress } from '~/features/accounts/store/hooks'
import { useGetSwapDelegationInfo } from '~/hooks/useGetSwapDelegationInfo'
import { useIsEmbeddedWallet } from '~/hooks/useIsEmbeddedWallet'
import { renderHook } from '~/test-utils/render'

vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQuery: vi.fn(),
}))

vi.mock('~/hooks/useIsEmbeddedWallet', () => ({
  useIsEmbeddedWallet: vi.fn(),
}))

vi.mock('~/features/accounts/store/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/features/accounts/store/hooks')>()),
  useActiveAddress: vi.fn(),
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/chains/hooks/useEnabledChains')>()),
  useEnabledChains: vi.fn(),
}))

const EW_ADDRESS = '0x1111111111111111111111111111111111111111'
const UNISWAP_DELEGATION = '0x2222222222222222222222222222222222222222'
const OTHER_DELEGATION = '0x3333333333333333333333333333333333333333'

type DelegationResponse = TradingApi.WalletCheckDelegationResponseBody

function buildResponse(details: Partial<Record<UniverseChainId, TradingApi.DelegationDetails>>): DelegationResponse {
  return { requestId: 'test', delegationDetails: { [EW_ADDRESS]: details } } as unknown as DelegationResponse
}

function setup(params: { isEmbeddedWallet: boolean; address?: string; data?: DelegationResponse }): void {
  vi.mocked(useIsEmbeddedWallet).mockReturnValue(params.isEmbeddedWallet)
  vi.mocked(useActiveAddress).mockReturnValue(params.address as ReturnType<typeof useActiveAddress>)
  vi.mocked(useEnabledChains).mockReturnValue({
    chains: [UniverseChainId.Mainnet, UniverseChainId.Base],
  } as unknown as ReturnType<typeof useEnabledChains>)
  vi.mocked(useQuery).mockReturnValue({ data: params.data } as unknown as UseQueryResult<DelegationResponse>)
}

describe('useGetSwapDelegationInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('surfaces delegation address + inclusion when an EW needs fresh delegation', () => {
    setup({
      isEmbeddedWallet: true,
      address: EW_ADDRESS,
      data: buildResponse({
        [UniverseChainId.Mainnet]: {
          isWalletDelegatedToUniswap: false,
          currentDelegationAddress: null,
          latestDelegationAddress: UNISWAP_DELEGATION,
        },
      }),
    })

    const { result } = renderHook(() => useGetSwapDelegationInfo())

    expect(result.current(UniverseChainId.Mainnet)).toEqual({
      delegationAddress: UNISWAP_DELEGATION,
      delegationInclusion: true,
      isWalletDelegatedToUniswap: false,
    })
  })

  it('routes an already-delegated EW through 7702 (address set) without activation inclusion', () => {
    setup({
      isEmbeddedWallet: true,
      address: EW_ADDRESS,
      data: buildResponse({
        [UniverseChainId.Mainnet]: {
          isWalletDelegatedToUniswap: true,
          currentDelegationAddress: UNISWAP_DELEGATION,
          latestDelegationAddress: UNISWAP_DELEGATION,
        },
      }),
    })

    const { result } = renderHook(() => useGetSwapDelegationInfo())

    expect(result.current(UniverseChainId.Mainnet)).toEqual({
      delegationAddress: UNISWAP_DELEGATION,
      delegationInclusion: false,
      isWalletDelegatedToUniswap: true,
    })
  })

  it('returns no delegation when an EW is delegated to a non-Uniswap contract', () => {
    setup({
      isEmbeddedWallet: true,
      address: EW_ADDRESS,
      data: buildResponse({
        [UniverseChainId.Mainnet]: {
          isWalletDelegatedToUniswap: false,
          currentDelegationAddress: OTHER_DELEGATION,
          latestDelegationAddress: UNISWAP_DELEGATION,
        },
      }),
    })

    const { result } = renderHook(() => useGetSwapDelegationInfo())

    expect(result.current(UniverseChainId.Mainnet)).toEqual({
      delegationAddress: undefined,
      delegationInclusion: false,
      isWalletDelegatedToUniswap: undefined,
    })
  })

  it('returns no delegation when the EW has no delegation details for the chain', () => {
    setup({ isEmbeddedWallet: true, address: EW_ADDRESS, data: buildResponse({}) })

    const { result } = renderHook(() => useGetSwapDelegationInfo())

    expect(result.current(UniverseChainId.Base)).toEqual({
      delegationAddress: undefined,
      delegationInclusion: false,
      isWalletDelegatedToUniswap: undefined,
    })
  })

  it('returns no delegation when called without a chainId', () => {
    setup({
      isEmbeddedWallet: true,
      address: EW_ADDRESS,
      data: buildResponse({
        [UniverseChainId.Mainnet]: {
          isWalletDelegatedToUniswap: false,
          currentDelegationAddress: null,
          latestDelegationAddress: UNISWAP_DELEGATION,
        },
      }),
    })

    const { result } = renderHook(() => useGetSwapDelegationInfo())

    expect(result.current(undefined)).toEqual({ delegationAddress: undefined, delegationInclusion: false })
  })

  it('returns no delegation and disables the query for non-embedded wallets', () => {
    setup({
      isEmbeddedWallet: false,
      address: EW_ADDRESS,
      // Even if stale data is present, a non-EW account must never route to 7702.
      data: buildResponse({
        [UniverseChainId.Mainnet]: {
          isWalletDelegatedToUniswap: false,
          currentDelegationAddress: null,
          latestDelegationAddress: UNISWAP_DELEGATION,
        },
      }),
    })

    const { result } = renderHook(() => useGetSwapDelegationInfo())

    expect(result.current(UniverseChainId.Mainnet)).toEqual({
      delegationAddress: undefined,
      delegationInclusion: false,
    })
    // The delegation query is gated off so regular wallets make no extra request.
    expect(vi.mocked(useQuery).mock.calls[0]?.[0]).toMatchObject({ enabled: false })
  })
})
