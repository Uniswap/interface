import { ReferralCodeModal } from 'pages/Referral/Components/ReferralCodeModal'
import { render, screen } from 'test-utils/render'

jest.mock('components/Identicon/StatusIcon', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('hooks/useAccount', () => ({
  useAccount: () => ({ address: '0x0000000000000000000000000000000000000000' }),
}))

jest.mock('hooks/useEthersSigner', () => ({
  useEthersSigner: () => ({ signMessage: jest.fn() }),
}))

beforeEach(() => {
  window.matchMedia =
    window.matchMedia ||
    ((() => ({
      addListener: jest.fn(),
      removeListener: jest.fn(),
    })) as unknown as typeof window.matchMedia)
})

describe('ReferralCodeModal', () => {
  it('renders enabled confirm button when prefilled code is provided', () => {
    render(<ReferralCodeModal isOpen onClose={jest.fn()} initialCode="ABC" />)

    const button = screen.getByRole('button', { name: 'Confirm' })
    expect(button).toBeInTheDocument()
    expect(button).toBeEnabled()
  })
})
