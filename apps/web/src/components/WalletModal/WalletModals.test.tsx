import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { EmbeddedWalletConnectionsModal } from '~/components/WalletModal/EmbeddedWalletModal'
import { OtherWalletsModal } from '~/components/WalletModal/OtherWalletsModal'
import { StandardWalletModal } from '~/components/WalletModal/StandardWalletModal'
import { useOrderedWallets } from '~/features/wallet/connection/hooks/useOrderedWalletConnectors'
import { useSignInWithPasskey } from '~/hooks/useSignInWithPasskey'
import { mocked } from '~/test-utils/mocked'
import { fireEvent, render } from '~/test-utils/render'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal()),
  useFeatureFlag: vi.fn(),
  getFeatureFlag: vi.fn(),
}))

vi.mock('~/features/accounts/store/hooks', async () => ({
  ...(await vi.importActual('~/features/accounts/store/hooks')),
  useWalletWithId: vi.fn(() => undefined),
}))

vi.mock('~/components/AccountDrawer/MiniPortfolio/hooks', () => ({
  useAccountDrawer: vi.fn(() => ({ close: vi.fn(), open: vi.fn(), toggle: vi.fn(), isOpen: false })),
  useShowMoonpayText: vi.fn(() => false),
}))

vi.mock('~/features/wallet/connection/hooks/useOrderedWalletConnectors', () => ({
  useOrderedWallets: vi.fn(() => []),
}))

vi.mock('~/components/Web3Provider/constants', async () => ({
  ...(await vi.importActual('~/components/Web3Provider/constants')),
  useRecentConnectorId: vi.fn(() => undefined),
}))

vi.mock('~/components/AccountDrawer/menuState', async () => ({
  ...(await vi.importActual('~/components/AccountDrawer/menuState')),
  useSetMenu: vi.fn(() => vi.fn()),
  useSetMenuCallback: vi.fn(() => vi.fn()),
}))

vi.mock('~/hooks/useModalState', () => ({
  useModalState: vi.fn(() => ({ openModal: vi.fn(), isOpen: false, closeModal: vi.fn(), toggleModal: vi.fn() })),
}))

vi.mock('~/hooks/useSignInWithPasskey', () => ({
  useSignInWithPasskey: vi.fn(() => ({ signInWithPasskeyAsync: vi.fn() })),
}))

describe('EmbeddedWalletConnectionsModal', () => {
  beforeEach(() => {
    mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.EmbeddedWallet)
    mocked(useOrderedWallets).mockReturnValue([])
  })

  it('renders correctly', () => {
    const { asFragment } = render(<EmbeddedWalletConnectionsModal />)
    expect(asFragment()).toMatchSnapshot()
  })

  it('calls signInWithPasskeyAsync when Log In is clicked', () => {
    const mockSignInWithPasskeyAsync = vi.fn()
    mocked(useSignInWithPasskey).mockReturnValue({
      signInWithPasskeyAsync: mockSignInWithPasskeyAsync,
    } as unknown as ReturnType<typeof useSignInWithPasskey>)

    const { getByRole } = render(<EmbeddedWalletConnectionsModal />)
    fireEvent.click(getByRole('button', { name: 'Log in' }))

    expect(mockSignInWithPasskeyAsync).toHaveBeenCalledOnce()
  })
})

describe('StandardWalletModal', () => {
  beforeEach(() => {
    mocked(useFeatureFlag).mockReturnValue(false)
    mocked(useOrderedWallets).mockReturnValue([])
  })

  it('renders correctly', () => {
    const { asFragment } = render(<StandardWalletModal />)
    expect(asFragment()).toMatchSnapshot()
  })
})

describe('OtherWalletsModal', () => {
  beforeEach(() => {
    mocked(useOrderedWallets).mockReturnValue([])
  })

  it('renders correctly with EW disabled', () => {
    mocked(useFeatureFlag).mockReturnValue(false)
    const { asFragment } = render(<OtherWalletsModal />)
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders correctly with EW enabled', () => {
    mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.EmbeddedWallet)
    const { asFragment } = render(<OtherWalletsModal />)
    expect(asFragment()).toMatchSnapshot()
  })
})
