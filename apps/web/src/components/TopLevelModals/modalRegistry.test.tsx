import { act, screen } from '@testing-library/react'
import { ModalRenderer, modalRegistry } from 'components/TopLevelModals/modalRegistry'
import { useAppSelector } from 'state/hooks'
import { mocked } from 'test-utils/mocked'
import { render } from 'test-utils/render'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

vi.mock('components/claim/AddressClaimModal', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-address-claim-modal">Address Claim Modal</div>,
}))

vi.mock('components/ConnectedAccountBlocked', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-connected-account-blocked">Connected Account Blocked</div>,
}))

vi.mock('components/AccountDrawer/UniwalletModal', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-uniwallet-modal">Uniwallet Modal</div>,
}))

vi.mock('components/Banner/shared/OutageBanners', () => ({
  __esModule: true,
  OutageBanners: () => <div data-testid="mock-outage-banners">Outage Banners</div>,
}))

vi.mock('components/AccountDrawer/MiniPortfolio/Activity/OffchainActivityModal', () => ({
  __esModule: true,
  OffchainActivityModal: () => <div data-testid="mock-offchain-activity-modal">Offchain Activity Modal</div>,
}))

vi.mock('components/TopLevelModals/UkDisclaimerModal', () => ({
  __esModule: true,
  UkDisclaimerModal: () => <div data-testid="mock-uk-disclaimer-modal">UK Disclaimer Modal</div>,
}))

vi.mock('state/hooks', () => ({
  useAppSelector: vi.fn(),
  useAppDispatch: vi.fn(),
}))

describe('ModalRegistry', () => {
  describe('ModalRenderer', () => {
    it('renders nothing when modal name is not in registry', () => {
      const { container } = render(
        <ModalRenderer modalName={'INVALID_MODAL' as (typeof ModalName)[keyof typeof ModalName]} />,
      )
      expect(container.innerHTML).toBe(
        '<span style="display: contents;" class=""><div style="display: contents;"></div></span>',
      )
    })

    it('renders AddressClaimModal when modal is open', async () => {
      mocked(useAppSelector).mockReturnValue({ application: { openModal: { name: ModalName.AddressClaim } } })
      await act(async () => {
        render(<ModalRenderer modalName={ModalName.AddressClaim} />)
      })
      expect(screen.getByTestId('mock-address-claim-modal')).toBeInTheDocument()
    })

    it('renders ConnectedAccountBlocked when modal is open', async () => {
      mocked(useAppSelector).mockReturnValue({ application: { openModal: { name: ModalName.BlockedAccount } } })
      await act(async () => {
        render(<ModalRenderer modalName={ModalName.BlockedAccount} />)
      })
      expect(screen.getByTestId('mock-connected-account-blocked')).toBeInTheDocument()
    })

    it('does not render modal when shouldMount returns false', async () => {
      mocked(useAppSelector).mockReturnValue({ application: { openModal: null } })
      await act(async () => {
        render(<ModalRenderer modalName={ModalName.AddressClaim} />)
      })
      expect(screen.queryByTestId('mock-address-claim-modal')).not.toBeInTheDocument()
    })

    it('renders always mounted modals regardless of state', async () => {
      mocked(useAppSelector).mockReturnValue({ application: { openModal: null } })
      await act(async () => {
        render(<ModalRenderer modalName={ModalName.Banners} />)
      })
      expect(screen.getByTestId('mock-outage-banners')).toBeInTheDocument()
    })

    it('renders modals with custom props', async () => {
      mocked(useAppSelector).mockReturnValue({ application: { openModal: { name: ModalName.UniWalletConnect } } })
      await act(async () => {
        render(<ModalRenderer modalName={ModalName.UniWalletConnect} />)
      })
      expect(screen.getByTestId('mock-uniwallet-modal')).toBeInTheDocument()
    })

    it('handles modal state from useModalState hook', async () => {
      mocked(useAppSelector).mockReturnValue({ application: { openModal: { name: ModalName.OffchainActivity } } })
      await act(async () => {
        render(<ModalRenderer modalName={ModalName.OffchainActivity} />)
      })
      expect(screen.getByTestId('mock-offchain-activity-modal')).toBeInTheDocument()
    })

    it('renders UK Disclaimer modal when always mounted', async () => {
      mocked(useAppSelector).mockReturnValue({ application: { openModal: null } })
      await act(async () => {
        render(<ModalRenderer modalName={ModalName.UkDisclaimer} />)
      })
      expect(screen.getByTestId('mock-uk-disclaimer-modal')).toBeInTheDocument()
    })
  })

  describe('modalRegistry', () => {
    it('has all required modal configurations', () => {
      const requiredModals = [
        ModalName.AddressClaim,
        ModalName.BlockedAccount,
        ModalName.UniWalletConnect,
        ModalName.Banners,
        ModalName.OffchainActivity,
        ModalName.UkDisclaimer,
        ModalName.TestnetMode,
        ModalName.GetTheApp,
        ModalName.PrivacyPolicy,
        ModalName.PrivacyChoices,
        ModalName.FeatureFlags,
        ModalName.AddLiquidity,
        ModalName.RemoveLiquidity,
        ModalName.ClaimFee,
        ModalName.DevFlags,
      ] as const

      requiredModals.forEach((modalName) => {
        expect(modalRegistry[modalName]).toBeDefined()
        expect(modalRegistry[modalName]?.component).toBeDefined()
        expect(typeof modalRegistry[modalName]?.shouldMount).toBe('function')
      })
    })

    it('has correct isAlwaysMounted flags', () => {
      const alwaysMountedModals = [
        ModalName.Banners,
        ModalName.OffchainActivity,
        ModalName.UkDisclaimer,
        ModalName.DevFlags,
      ]

      alwaysMountedModals.forEach((modalName) => {
        expect(modalRegistry[modalName]?.shouldMount(null)).toBe(true)
      })
    })

    it('has correct shouldMount logic for conditional modals', () => {
      expect(
        modalRegistry[ModalName.AddressClaim]?.shouldMount({
          application: {
            openModal: { name: ModalName.AddressClaim },
          },
        }),
      ).toBe(true)

      expect(
        modalRegistry[ModalName.AddressClaim]?.shouldMount({
          application: {
            openModal: null,
          },
        }),
      ).toBe(false)
    })

    it('has correct shouldMount logic for always mounted modals', () => {
      expect(
        modalRegistry[ModalName.Banners]?.shouldMount({
          application: {
            openModal: null,
          },
        }),
      ).toBe(true)
      expect(
        modalRegistry[ModalName.OffchainActivity]?.shouldMount({
          application: {
            openModal: null,
          },
        }),
      ).toBe(true)
      expect(
        modalRegistry[ModalName.DevFlags]?.shouldMount({
          application: {
            openModal: null,
          },
        }),
      ).toBe(true)
    })

    it('has components for all modals', () => {
      Object.entries(modalRegistry).forEach(([, config]) => {
        expect(config.component).toBeDefined()
      })
    })
  })
})
