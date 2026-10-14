import { renderHook } from '@testing-library/react'
import { UniverseChainId } from '@universe/chains'
import { useReadContract } from 'wagmi'
import { usePositionOwnerV2 } from '~/hooks/usePositionOwnerV2'

vi.mock('wagmi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('wagmi')>()),
  useReadContract: vi.fn(),
}))

const mockedUseReadContract = vi.mocked(useReadContract)

const ACCOUNT = '0x1111111111111111111111111111111111111111'
const PAIR = '0x2222222222222222222222222222222222222222'

function mockBalanceRead(balance: bigint | undefined): void {
  mockedUseReadContract.mockReturnValue({ data: balance } as unknown as ReturnType<typeof useReadContract>)
}

function renderOwner({ account }: { account: typeof ACCOUNT | undefined }) {
  return renderHook(() => usePositionOwnerV2({ account, address: PAIR, chainId: UniverseChainId.Mainnet }))
}

describe('usePositionOwnerV2', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('is undefined while the balance read has not settled', () => {
    mockBalanceRead(undefined)
    expect(renderOwner({ account: ACCOUNT }).result.current).toBeUndefined()
  })

  it('is false once the read settles at a zero balance', () => {
    mockBalanceRead(0n)
    expect(renderOwner({ account: ACCOUNT }).result.current).toBe(false)
  })

  it('is true once the read settles at a positive balance', () => {
    mockBalanceRead(1n)
    expect(renderOwner({ account: ACCOUNT }).result.current).toBe(true)
  })

  it('does not issue the read without an account', () => {
    mockBalanceRead(undefined)
    renderOwner({ account: undefined })
    expect(mockedUseReadContract).toHaveBeenCalledWith(
      expect.objectContaining({ args: undefined, query: { enabled: false } }),
    )
  })
})
