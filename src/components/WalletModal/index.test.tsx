import { ReactChildren } from 'react'
import { ApplicationModal } from 'state/application/reducer'

import { render, screen } from '../../test-utils'
import WalletModal from './index'

jest.mock('@lingui/macro', () => ({ Trans: ({ children }: { children: ReactChildren }) => children }))

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

// test('Loads Wallet Modal on mobile', async () => {
//   render(<WalletModal pendingTransactions={[]} confirmedTransactions={[]} />)
// })

// test('Loads Wallet Modal on MetaMask browser', async () => {
//   render(<WalletModal pendingTransactions={[]} confirmedTransactions={[]} />)
// })

// test('Loads Wallet Modal on Coinbase Wallet browser', async () => {
//   render(<WalletModal pendingTransactions={[]} confirmedTransactions={[]} />)
// })
