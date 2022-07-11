import { ApplicationModal } from 'state/application/reducer'

import { render, screen } from '../../test-utils'
import WalletModal from './index'

beforeEach(() => {
  jest.resetModules()
})

afterAll(() => {
  jest.resetModules()
})

const UserAgentMock = jest.requireMock('utils/userAgent')
jest.mock('utils/userAgent', () => ({
  isMobile: false,
}))

jest.mock('.../../state/application/hooks', () => {
  return {
    useModalOpen: (_modal: ApplicationModal) => true,
    useWalletModalToggle: () => {
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

it.skip('loads Wallet Modal on desktop with generic Injected', async () => {
  jest.doMock('connection/utils', () => {
    const connectionUtils = jest.requireActual('connection/utils')
    return {
      getIsCoinbaseWallet: () => false,
      getIsMetaMask: () => false,
      getIsInjected: () => true,
      ...connectionUtils,
    }
  })

  render(<WalletModal pendingTransactions={[]} confirmedTransactions={[]} />)
  expect(screen.getByText('Injected')).toBeInTheDocument()
  expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument()
  expect(screen.getByText('WalletConnect')).toBeInTheDocument()
  expect(screen.getByText('Fortmatic')).toBeInTheDocument()
  expect(screen.getAllByTestId('wallet-modal-option')).toHaveLength(4)
})

it('loads Wallet Modal on desktop with MetaMask installed', async () => {
  jest.doMock('connection/utils', () => {
    const connectionUtils = jest.requireActual('connection/utils')
    return {
      getIsCoinbaseWallet: () => false,
      getIsMetaMask: () => true,
      getIsInjected: () => true,
      ...connectionUtils,
    }
  })

  render(<WalletModal pendingTransactions={[]} confirmedTransactions={[]} />)
  expect(screen.getByText('MetaMask')).toBeInTheDocument()
  expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument()
  expect(screen.getByText('WalletConnect')).toBeInTheDocument()
  expect(screen.getByText('Fortmatic')).toBeInTheDocument()
  expect(screen.getAllByTestId('wallet-modal-option')).toHaveLength(4)
})

it.skip('loads Wallet Modal on mobile', async () => {
  UserAgentMock.isMobile = true
  jest.doMock('connection/utils', () => {
    const connectionUtils = jest.requireActual('connection/utils')
    return {
      getIsCoinbaseWallet: () => false,
      getIsMetaMask: () => false,
      getIsInjected: () => false,
      ...connectionUtils,
    }
  })

  render(<WalletModal pendingTransactions={[]} confirmedTransactions={[]} />)
  expect(screen.getByText('Open in Coinbase Wallet')).toBeInTheDocument()
  expect(screen.getByText('WalletConnect')).toBeInTheDocument()
  expect(screen.getByText('Fortmatic')).toBeInTheDocument()
  expect(screen.getAllByTestId('wallet-modal-option')).toHaveLength(3)
})

it.skip('loads Wallet Modal on MetaMask browser', async () => {
  UserAgentMock.isMobile = true
  jest.doMock('connection/utils', () => {
    const connectionUtils = jest.requireActual('connection/utils')
    return {
      getIsCoinbaseWallet: () => false,
      getIsMetaMask: () => true,
      getIsInjected: () => true,
      ...connectionUtils,
    }
  })

  render(<WalletModal pendingTransactions={[]} confirmedTransactions={[]} />)
  expect(screen.getByText('MetaMask')).toBeInTheDocument()
  expect(screen.getAllByTestId('wallet-modal-option')).toHaveLength(1)
})

it.skip('loads Wallet Modal on Coinbase Wallet browser', async () => {
  UserAgentMock.isMobile = true
  jest.doMock('connection/utils', () => {
    const connectionUtils = jest.requireActual('connection/utils')
    return {
      getIsCoinbaseWallet: () => true,
      getIsMetaMask: () => false,
      getIsInjected: () => true,
      ...connectionUtils,
    }
  })

  render(<WalletModal pendingTransactions={[]} confirmedTransactions={[]} />)
  expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument()
  expect(screen.getAllByTestId('wallet-modal-option')).toHaveLength(1)
})
