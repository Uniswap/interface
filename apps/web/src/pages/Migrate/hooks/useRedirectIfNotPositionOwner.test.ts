import { renderHook } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from '@universe/chains'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { useReadContract } from 'wagmi'
import { useRedirectIfNotPositionOwner } from '~/pages/Migrate/hooks/useRedirectIfNotPositionOwner'

const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }))

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}))
vi.mock('uniswap/src/features/wallet/hooks/useWallet', () => ({ useWallet: vi.fn() }))
// Mocked at the wagmi seam rather than at `usePositionOwnerV2` so the pending-read case exercises the
// real tri-state contract this redirect depends on.
vi.mock('wagmi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('wagmi')>()),
  useReadContract: vi.fn(),
}))

const mockedUseWallet = vi.mocked(useWallet)
const mockedUseReadContract = vi.mocked(useReadContract)

const ACCOUNT = '0xAbCdEf0123456789AbCdEf0123456789AbCdEf01'
const OTHER_ACCOUNT = '0x1111111111111111111111111111111111111111'
const PAIR = '0x2222222222222222222222222222222222222222'

const V2_POSITION = {
  version: ProtocolVersion.V2,
  chainId: UniverseChainId.Mainnet,
  owner: undefined,
} as unknown as PositionInfo

const V3_POSITION = {
  version: ProtocolVersion.V3,
  chainId: UniverseChainId.Mainnet,
  owner: ACCOUNT,
} as unknown as PositionInfo

function mockPairBalance(balance: bigint | undefined): void {
  mockedUseReadContract.mockReturnValue({ data: balance } as unknown as ReturnType<typeof useReadContract>)
}

function renderRedirect(positionInfo: PositionInfo) {
  return renderHook(() => useRedirectIfNotPositionOwner({ positionInfo, pairAddress: PAIR }))
}

describe('useRedirectIfNotPositionOwner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseWallet.mockReturnValue({ evmAccount: { address: ACCOUNT } } as unknown as ReturnType<typeof useWallet>)
    mockPairBalance(undefined)
  })

  describe('v2 position (onchain pair-token balance)', () => {
    it('stays put while the balance read is still pending', () => {
      const { rerender } = renderRedirect(V2_POSITION)
      // The page re-renders many times before a cold RPC read returns; none of them may redirect.
      rerender()
      rerender()
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('redirects once the read settles with no pair tokens', () => {
      const { rerender } = renderRedirect(V2_POSITION)
      expect(mockNavigate).not.toHaveBeenCalled()

      mockPairBalance(0n)
      rerender()
      expect(mockNavigate).toHaveBeenCalledWith('/positions')
    })

    it('stays put once the read settles with pair tokens', () => {
      mockPairBalance(1n)
      renderRedirect(V2_POSITION)
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('v3 position (owner from the position read)', () => {
    it('stays put when the connected account is the owner, ignoring case', () => {
      mockedUseWallet.mockReturnValue({
        evmAccount: { address: ACCOUNT.toLowerCase() },
      } as unknown as ReturnType<typeof useWallet>)
      renderRedirect(V3_POSITION)
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('redirects when the connected account is not the owner', () => {
      mockedUseWallet.mockReturnValue({
        evmAccount: { address: OTHER_ACCOUNT },
      } as unknown as ReturnType<typeof useWallet>)
      renderRedirect(V3_POSITION)
      expect(mockNavigate).toHaveBeenCalledWith('/positions')
    })
  })
})
