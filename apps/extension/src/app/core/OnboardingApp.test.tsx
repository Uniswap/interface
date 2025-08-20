import { render } from '@testing-library/react'
import OnboardingApp from 'src/app/core/OnboardingApp'
import { initializeReduxStore } from 'src/store/store'

jest.mock('wallet/src/features/transactions/contexts/WalletUniswapContext', () => ({
  WalletUniswapProvider: ({ children }: { children: React.ReactNode }) => children,
}))

describe('OnboardingApp', () => {
  // eslint-disable-next-line jest/expect-expect
  it('renders without error', async () => {
    initializeReduxStore()
    render(<OnboardingApp />)
  })
})
