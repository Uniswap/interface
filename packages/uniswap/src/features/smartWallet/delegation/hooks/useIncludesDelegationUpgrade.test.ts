import { useFeatureFlag } from '@universe/gating'
import { useUniswapContextSelector } from 'uniswap/src/contexts/UniswapContext'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useIncludesDelegationUpgrade } from 'uniswap/src/features/smartWallet/delegation/hooks/useIncludesDelegationUpgrade'
import type { SwapDelegationInfo } from 'uniswap/src/features/smartWallet/delegation/types'
import { renderHook } from 'uniswap/src/test/test-utils'
import type { Mock } from 'vitest'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: vi.fn(),
}))

vi.mock('uniswap/src/contexts/UniswapContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/contexts/UniswapContext')>()),
  useUniswapContextSelector: vi.fn(),
}))

const mockUseFeatureFlag = useFeatureFlag as Mock
const mockUseUniswapContextSelector = useUniswapContextSelector as Mock

const UPGRADE_DELEGATION_INFO: SwapDelegationInfo = {
  delegationAddress: '0x000000000000000000000000000000000000dead',
  delegationInclusion: true,
  isWalletDelegatedToUniswap: true,
}

const FRESH_DELEGATION_INFO: SwapDelegationInfo = {
  delegationAddress: '0x000000000000000000000000000000000000dead',
  delegationInclusion: true,
  isWalletDelegatedToUniswap: false,
}

function setup({ flagEnabled, delegationInfo }: { flagEnabled: boolean; delegationInfo?: SwapDelegationInfo }): void {
  mockUseFeatureFlag.mockReturnValue(flagEnabled)
  mockUseUniswapContextSelector.mockReturnValue(delegationInfo ? (): SwapDelegationInfo => delegationInfo : undefined)
}

describe('useIncludesDelegationUpgrade', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns true when the flag is on and the included delegation is a Uniswap re-delegation', () => {
    setup({ flagEnabled: true, delegationInfo: UPGRADE_DELEGATION_INFO })
    const { result } = renderHook(() =>
      useIncludesDelegationUpgrade({ chainId: UniverseChainId.Mainnet, includesDelegation: true }),
    )
    expect(result.current).toBe(true)
  })

  it('returns false for a first-time activation (wallet not yet delegated to Uniswap)', () => {
    setup({ flagEnabled: true, delegationInfo: FRESH_DELEGATION_INFO })
    const { result } = renderHook(() =>
      useIncludesDelegationUpgrade({ chainId: UniverseChainId.Mainnet, includesDelegation: true }),
    )
    expect(result.current).toBe(false)
  })

  it('returns false when the pending transaction does not include a delegation', () => {
    setup({ flagEnabled: true, delegationInfo: UPGRADE_DELEGATION_INFO })
    const { result } = renderHook(() =>
      useIncludesDelegationUpgrade({ chainId: UniverseChainId.Mainnet, includesDelegation: false }),
    )
    expect(result.current).toBe(false)
  })

  it('returns false when the feature flag is off', () => {
    setup({ flagEnabled: false, delegationInfo: UPGRADE_DELEGATION_INFO })
    const { result } = renderHook(() =>
      useIncludesDelegationUpgrade({ chainId: UniverseChainId.Mainnet, includesDelegation: true }),
    )
    expect(result.current).toBe(false)
  })

  it('returns false when no delegation info source is available (no UniswapContext provider)', () => {
    setup({ flagEnabled: true, delegationInfo: undefined })
    const { result } = renderHook(() =>
      useIncludesDelegationUpgrade({ chainId: UniverseChainId.Mainnet, includesDelegation: true }),
    )
    expect(result.current).toBe(false)
  })
})
