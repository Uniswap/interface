/* eslint-disable @typescript-eslint/no-var-requires */
import { AccountSwitcherScreen } from 'src/app/features/accounts/AccountSwitcherScreen'
import { preloadedExtensionState } from 'src/test/fixtures/redux'
import { cleanup, render } from 'src/test/test-utils'

const preloadedState = preloadedExtensionState()

const SAMPLE_DAPP = 'http://example.com'

jest.mock('src/app/features/dapp/DappContext', () => {
  const real = jest.requireActual('src/app/features/dapp/DappContext')
  return { ...real, useDappContext: jest.fn(() => ({ dappUrl: SAMPLE_DAPP })) }
})

jest.mock('src/app/features/dapp/hooks', () => {
  const { ACCOUNT, ACCOUNT3 } = require('wallet/src/test/fixtures')
  return { useDappConnectedAccounts: jest.fn(() => [ACCOUNT, ACCOUNT3]) }
})

describe('AccountSwitcherScreen', () => {
  it('renders correctly', async () => {
    const tree = render(<AccountSwitcherScreen />, { preloadedState })

    expect(tree).toMatchSnapshot()
    cleanup()
  })
})
