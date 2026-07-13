import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { usePoolsFailedNetworks } from 'uniswap/src/features/portfolio/pools/usePoolsFailedNetworks'
import { usePortfolioAddresses } from '~/pages/Portfolio/hooks/usePortfolioAddresses'
import { usePoolsSectionWarning } from '~/pages/Portfolio/Overview/hooks/usePoolsSectionWarning'
import { mocked } from '~/test-utils/mocked'
import { renderHook } from '~/test-utils/render'

vi.mock('uniswap/src/features/portfolio/pools/usePoolsFailedNetworks', () => ({
  usePoolsFailedNetworks: vi.fn(),
}))

vi.mock('~/pages/Portfolio/hooks/usePortfolioAddresses', () => ({
  usePortfolioAddresses: vi.fn(),
}))

const EVM_ADDRESS = '0x0000000000000000000000000000000000000001'

function mockFailedNetworks({ failedChainIds }: { failedChainIds: UniverseChainId[] }): void {
  mocked(usePoolsFailedNetworks).mockReturnValue({
    failedChainIds,
    hasResolved: true,
    isPoolsUnavailable: false,
  })
}

describe('usePoolsSectionWarning', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked(usePortfolioAddresses).mockReturnValue({
      evmAddress: EVM_ADDRESS,
      svmAddress: undefined,
      isExternalWallet: false,
    })
  })

  it('returns the outage message when chains have failed', () => {
    mockFailedNetworks({ failedChainIds: [UniverseChainId.Base] })

    const { result } = renderHook(() => usePoolsSectionWarning({ enabled: true }))

    expect(result.current.warningMessage).toBeTruthy()
  })

  it('returns no warning message when no chains have failed', () => {
    mockFailedNetworks({ failedChainIds: [] })

    const { result } = renderHook(() => usePoolsSectionWarning({ enabled: true }))

    expect(result.current.warningMessage).toBeUndefined()
  })

  it('forwards the resolved addresses, chain, and enabled flag to usePoolsFailedNetworks', () => {
    mockFailedNetworks({ failedChainIds: [] })

    renderHook(() => usePoolsSectionWarning({ chainId: UniverseChainId.Base, enabled: false }))

    expect(usePoolsFailedNetworks).toHaveBeenCalledWith({
      evmAddress: EVM_ADDRESS,
      svmAddress: undefined,
      chainId: UniverseChainId.Base,
      enabled: false,
    })
  })
})
