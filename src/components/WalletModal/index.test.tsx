import * as connectionUtils from 'connection/utils'

import { nativeOnChain } from '../../constants/tokens'
import { render, screen } from '../../test-utils'
import WalletModal from './index'

afterEach(() => {
  jest.clearAllMocks()
  jest.resetModules()
})

const mockEth = () => nativeOnChain(1)

const UserAgentMock = jest.requireMock('utils/userAgent')
jest.mock('utils/userAgent', () => ({
  isMobile: false,
}))

jest.mock('.../../state/application/hooks', () => {
  return {
    useModalIsOpen: () => true,
    useToggleWalletModal: () => {
      return
    },
  }
})

jest.mock('hooks/useStablecoinPrice', () => {
  return {
    useStablecoinValue: () => {
      return
    },
  }
})

jest.mock('lib/hooks/useCurrencyBalance', () => {
  return {
    __esModule: true,
    default: () => {
      return
    },
    useTokenBalance: () => {
      return
    },
  }
})

jest.mock('lib/hooks/useNativeCurrency', () => () => mockEth)

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
  expect(screen.getAllByTestId('wallet-modal-option')).toHaveLength(3)
})

it('loads Wallet Modal on desktop with generic Injected', async () => {
  jest.spyOn(connectionUtils, 'getIsInjected').mockReturnValue(true)
  jest.spyOn(connectionUtils, 'getIsMetaMask').mockReturnValue(false)
  jest.spyOn(connectionUtils, 'getIsCoinbaseWallet').mockReturnValue(false)

  render(<WalletModal pendingTransactions={[]} confirmedTransactions={[]} />)
  expect(screen.getByText('Browser Wallet')).toBeInTheDocument()
  expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument()
  expect(screen.getByText('WalletConnect')).toBeInTheDocument()
  expect(screen.getAllByTestId('wallet-modal-option')).toHaveLength(3)
})

it('loads Wallet Modal on desktop with MetaMask installed', async () => {
  jest.spyOn(connectionUtils, 'getIsInjected').mockReturnValue(true)
  jest.spyOn(connectionUtils, 'getIsMetaMask').mockReturnValue(true)
  jest.spyOn(connectionUtils, 'getIsCoinbaseWallet').mockReturnValue(false)

  render(<WalletModal pendingTransactions={[]} confirmedTransactions={[]} />)
  expect(screen.getByText('MetaMask')).toBeInTheDocument()
  expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument()
  expect(screen.getByText('WalletConnect')).toBeInTheDocument()
  expect(screen.getAllByTestId('wallet-modal-option')).toHaveLength(3)
})

it('loads Wallet Modal on mobile', async () => {
  UserAgentMock.isMobile = true

  jest.spyOn(connectionUtils, 'getIsInjected').mockReturnValue(false)
  jest.spyOn(connectionUtils, 'getIsMetaMask').mockReturnValue(false)
  jest.spyOn(connectionUtils, 'getIsCoinbaseWallet').mockReturnValue(false)

  render(<WalletModal pendingTransactions={[]} confirmedTransactions={[]} />)
  expect(screen.getByText('Open in Coinbase Wallet')).toBeInTheDocument()
  expect(screen.getByText('WalletConnect')).toBeInTheDocument()
  expect(screen.getAllByTestId('wallet-modal-option')).toHaveLength(2)
})

it('loads Wallet Modal on MetaMask browser', async () => {
  UserAgentMock.isMobile = true

  jest.spyOn(connectionUtils, 'getIsInjected').mockReturnValue(true)
  jest.spyOn(connectionUtils, 'getIsMetaMask').mockReturnValue(true)
  jest.spyOn(connectionUtils, 'getIsCoinbaseWallet').mockReturnValue(false)

  render(<WalletModal pendingTransactions={[]} confirmedTransactions={[]} />)
  expect(screen.getByText('MetaMask')).toBeInTheDocument()
  expect(screen.getAllByTestId('wallet-modal-option')).toHaveLength(1)
})

it('loads Wallet Modal on Coinbase Wallet browser', async () => {
  UserAgentMock.isMobile = true

  jest.spyOn(connectionUtils, 'getIsInjected').mockReturnValue(true)
  jest.spyOn(connectionUtils, 'getIsMetaMask').mockReturnValue(false)
  jest.spyOn(connectionUtils, 'getIsCoinbaseWallet').mockReturnValue(true)

  render(<WalletModal pendingTransactions={[]} confirmedTransactions={[]} />)
  expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument()
  expect(screen.getAllByTestId('wallet-modal-option')).toHaveLength(1)
})
