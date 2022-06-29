import { render, screen } from '@testing-library/react'
import { ApplicationModal } from 'state/application/reducer'

import WalletModal from './index'

jest.mock('.../../state/application/hooks', () => {
  return {
    useModalOpen: (_modal: ApplicationModal) => true,
  }
})

const mockDispatch = jest.fn()
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: () => mockDispatch,
}))

test('Loads Wallet Modal on desktop', async () => {
  render(<WalletModal pendingTransactions={[]} confirmedTransactions={[]} />)
  // expect(screen.getByText('Install MetaMask')).toBeInTheDocument()
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
