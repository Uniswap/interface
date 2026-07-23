import { AccountSwitcherScreen } from 'src/app/features/accounts/AccountSwitcherScreen'
import { preloadedExtensionState } from 'src/test/fixtures/redux'
import { cleanup, render } from 'src/test/test-utils'

const preloadedState = preloadedExtensionState()

const SAMPLE_DAPP = 'http://example.com'

vi.mock('src/app/features/dapp/DappContext', async (importOriginal) => {
  const real = await importOriginal<typeof import('src/app/features/dapp/DappContext')>()
  return { ...real, useDappContext: vi.fn(() => ({ dappUrl: SAMPLE_DAPP })) }
})

vi.mock('src/app/features/dapp/hooks', async () => {
  const { ACCOUNT, ACCOUNT3 } = await import('wallet/src/test/fixtures')
  return { useDappConnectedAccounts: vi.fn(() => [ACCOUNT, ACCOUNT3]) }
})

describe('AccountSwitcherScreen', () => {
  it('renders correctly', async () => {
    const tree = render(<AccountSwitcherScreen />, { preloadedState })

    expect(tree).toMatchSnapshot()
    cleanup()
  })
})
