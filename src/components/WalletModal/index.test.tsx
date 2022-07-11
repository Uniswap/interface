import { ApplicationModal } from 'state/application/reducer'

import { render, screen } from '../../test-utils'
import WalletModal from './index'

beforeEach(() => {
  delete global.window.ethereum
})

afterAll(() => {
  delete global.window.ethereum
})

const UserAgentMock = jest.requireMock('utils/userAgent')
jest.mock('utils/userAgent', () => ({
  isMobile: false,
}))

jest.mock('.../../state/application/hooks', () => {
  return {
    useModalIsOpen: (_modal: ApplicationModal) => true,
    useToggleWalletModal: () => {
      return
    },
  }
})

jest.mock('@web3-react/core', () => {
  const web3React = jest.requireActual('@web3-react/core')
  return {
    useWeb3React: () => ({
      account: undefined,
      isActive: false,
      isActivating: false,
      connector: undefined,
    }),
    ...web3React,
  }
})

it('loads Wallet Modal on desktop', async () => {
  render(<WalletModal pendingTransactions={[]} confirmedTransactions={[]} />)
  expect(screen.getByText('Install MetaMask')).toBeInTheDocument()
  expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument()
  expect(screen.getByText('WalletConnect')).toBeInTheDocument()
  expect(screen.getByText('Fortmatic')).toBeInTheDocument()
  expect(screen.getAllByTestId('wallet-modal-option')).toHaveLength(4)
})

it('loads Wallet Modal on desktop with MetaMask installed', async () => {
  global.window.ethereum = { isMetaMask: true }

  render(<WalletModal pendingTransactions={[]} confirmedTransactions={[]} />)
  expect(screen.getByText('MetaMask')).toBeInTheDocument()
  expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument()
  expect(screen.getByText('WalletConnect')).toBeInTheDocument()
  expect(screen.getByText('Fortmatic')).toBeInTheDocument()
  expect(screen.getAllByTestId('wallet-modal-option')).toHaveLength(4)
})

it('loads Wallet Modal on mobile', async () => {
  UserAgentMock.isMobile = true

  render(<WalletModal pendingTransactions={[]} confirmedTransactions={[]} />)
  expect(screen.getByText('Open in Coinbase Wallet')).toBeInTheDocument()
  expect(screen.getByText('WalletConnect')).toBeInTheDocument()
  expect(screen.getByText('Fortmatic')).toBeInTheDocument()
  expect(screen.getAllByTestId('wallet-modal-option')).toHaveLength(3)
})

it('loads Wallet Modal on MetaMask browser', async () => {
  UserAgentMock.isMobile = true
  global.window.ethereum = { isMetaMask: true }

  render(<WalletModal pendingTransactions={[]} confirmedTransactions={[]} />)
  expect(screen.getByText('MetaMask')).toBeInTheDocument()
  expect(screen.getAllByTestId('wallet-modal-option')).toHaveLength(1)
})

it('loads Wallet Modal on Coinbase Wallet browser', async () => {
  UserAgentMock.isMobile = true
  global.window.ethereum = { isCoinbaseWallet: true }

  render(<WalletModal pendingTransactions={[]} confirmedTransactions={[]} />)
  expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument()
  expect(screen.getAllByTestId('wallet-modal-option')).toHaveLength(1)
})
