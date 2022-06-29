import { render, screen } from '@testing-library/react'
import { ReactChildren } from 'react'
import { ApplicationModal } from 'state/application/reducer'
import { ThemeProvider } from 'styled-components/macro'
import { getTheme } from 'theme'

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

const mockDispatch = jest.fn()
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: () => mockDispatch,
}))

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
  render(
    <ThemeProvider theme={getTheme(false)}>
      <WalletModal pendingTransactions={[]} confirmedTransactions={[]} />
    </ThemeProvider>
  )
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
