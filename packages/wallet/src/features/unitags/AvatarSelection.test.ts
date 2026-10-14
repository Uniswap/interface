import { act } from '@testing-library/react-native'
import { useAvatarSelectionHandler } from 'wallet/src/features/unitags/AvatarSelection'
import { selectPhotoFromLibrary } from 'wallet/src/features/unitags/photoSelection'
import { renderHook } from 'wallet/src/test/test-utils'

const { mockUseEnabledChains, mockUseWalletNfts } = vi.hoisted(() => ({
  mockUseEnabledChains: vi.fn(),
  mockUseWalletNfts: vi.fn(),
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: mockUseEnabledChains,
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/nfts/useWalletNfts', () => ({
  useWalletNfts: mockUseWalletNfts,
}))

vi.mock('wallet/src/features/unitags/photoSelection', () => ({
  selectPhotoFromLibrary: vi.fn(),
}))

const ADDRESS = '0xBF15C8386c5320aB16bd3A0aa16418f3bc8d98C6'

function mockWalletNfts({
  nfts = [],
  isPending = false,
  isError = false,
}: {
  nfts?: unknown[]
  isPending?: boolean
  isError?: boolean
}): void {
  mockUseWalletNfts.mockReturnValue({ nfts, isPending, isError })
}

describe('useAvatarSelectionHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseEnabledChains.mockReturnValue({ chains: [] })
  })

  function renderAvatarSelection(): ReturnType<typeof renderHook<ReturnType<typeof useAvatarSelectionHandler>, []>> {
    return renderHook(() =>
      useAvatarSelectionHandler({
        address: ADDRESS,
        avatarImageUri: undefined,
        setAvatarImageUri: vi.fn(),
      }),
    )
  }

  it('reports hasNFTs true and opens the modal once the wallet is known to have NFTs', async () => {
    mockWalletNfts({ nfts: [{ tokenId: '1' }] })

    const { result } = renderAvatarSelection()
    expect(result.current.hasNFTs).toBe(true)

    await act(async () => {
      await result.current.avatarSelectionHandler()
    })

    expect(result.current.showModal).toBe(true)
    expect(selectPhotoFromLibrary).not.toHaveBeenCalled()
  })

  it('goes straight to camera roll when the wallet is confirmed to have zero NFTs', async () => {
    mockWalletNfts({ nfts: [] })

    const { result } = renderAvatarSelection()

    await act(async () => {
      await result.current.avatarSelectionHandler()
    })

    expect(result.current.showModal).toBe(false)
    expect(selectPhotoFromLibrary).toHaveBeenCalledTimes(1)
  })

  it('opens the modal instead of assuming zero NFTs while the eligibility check is still pending', async () => {
    mockWalletNfts({ nfts: [], isPending: true })

    const { result } = renderAvatarSelection()
    expect(result.current.hasNFTs).toBe(false)

    await act(async () => {
      await result.current.avatarSelectionHandler()
    })

    expect(result.current.showModal).toBe(true)
    expect(selectPhotoFromLibrary).not.toHaveBeenCalled()
  })

  it('opens the modal instead of assuming zero NFTs when the eligibility check errors', async () => {
    mockWalletNfts({ nfts: [], isError: true })

    const { result } = renderAvatarSelection()

    await act(async () => {
      await result.current.avatarSelectionHandler()
    })

    expect(result.current.showModal).toBe(true)
    expect(selectPhotoFromLibrary).not.toHaveBeenCalled()
  })
})
