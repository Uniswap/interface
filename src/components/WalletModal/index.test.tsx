import { ApplicationModal } from 'state/application/reducer'

import { render, screen } from '../../test-utils'
import WalletModal from './index'

const { location } = window

beforeEach(() => {
  jest.resetModules()
})

afterAll(() => {
  window.location = location
})

jest.doMock('../../utils/userAgent', () => {
  return {
    isMobile: true,
  }
})

jest.mock('.../../state/application/hooks', () => {
  return {
    useModalOpen: (_modal: ApplicationModal) => true,
    useWalletModalToggle: () => {
      return
    },
  }
})

jest.mock('hooks/useActiveWeb3React', () => {
  return {
    __esModule: true,
    default: () => ({
      account: undefined,
      isActive: false,
      isActivating: false,
      connector: undefined,
    }),
  }
})

test('Loads Wallet Modal on desktop', async () => {
  render(<WalletModal pendingTransactions={[]} confirmedTransactions={[]} />)
  expect(screen.getByText('Install MetaMask')).toBeInTheDocument()
  expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument()
  expect(screen.getByText('WalletConnect')).toBeInTheDocument()
  expect(screen.getByText('Fortmatic')).toBeInTheDocument()
})

test('Loads Wallet Modal on desktop with MetaMask installed', async () => {
  window.ethereum = { isMetaMask: true }

  render(<WalletModal pendingTransactions={[]} confirmedTransactions={[]} />)
  expect(screen.getByText('MetaMask')).toBeInTheDocument()
  expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument()
  expect(screen.getByText('WalletConnect')).toBeInTheDocument()
  expect(screen.getByText('Fortmatic')).toBeInTheDocument()
})

test('Loads Wallet Modal on mobile', async () => {
  jest.doMock('../../utils/userAgent', () => ({ isMobile: true }))

  render(<WalletModal pendingTransactions={[]} confirmedTransactions={[]} />)
  expect(screen.getByText('Open in Coinbase Wallet app.')).toBeInTheDocument()
  expect(screen.getByText('WalletConnect')).toBeInTheDocument()
  expect(screen.getByText('Fortmatic')).toBeInTheDocument()
})

test('Loads Wallet Modal on MetaMask browser', async () => {
  jest.doMock('../../utils/userAgent', () => ({ isMobile: true }))
  window.ethereum = { isMetaMask: true }

  render(<WalletModal pendingTransactions={[]} confirmedTransactions={[]} />)
  expect(screen.getByText('MetaMask')).toBeInTheDocument()
})

test('Loads Wallet Modal on Coinbase Wallet browser', async () => {
  jest.doMock('../../utils/userAgent', () => ({ isMobile: true }))
  window.ethereum = { isCoinbaseWallet: true }

  render(<WalletModal pendingTransactions={[]} confirmedTransactions={[]} />)
  expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument()
})
