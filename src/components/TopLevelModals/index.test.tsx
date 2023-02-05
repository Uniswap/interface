import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { render, screen, waitFor } from '@testing-library/react'
import Web3Provider from 'components/Web3Provider'
import { DEFAULT_LOCALE } from 'constants/locales'
import catalog from 'locales/en-US'
import { en } from 'make-plural/plurals'
import { BLOCKED_ADDRESS } from 'mocks/handlers'
import { createTestStore } from 'mocks/store'
import { act } from 'react-dom/test-utils'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Provider as ReduxProvider } from 'react-redux'
import { HashRouter } from 'react-router-dom'

import ThemeProvider from '../../theme'
import TopLevelModals from '.'

let mockAccountValue = '0x48c89D77ae34Ae475e4523b25aB01e363dce5A78'
jest.mock('lib/hooks/useBlockNumber', () => () => 16564735)
jest.mock('@web3-react/core', () => {
  const actual = jest.requireActual('@web3-react/core')
  return {
    ...actual,
    useWeb3React: () => ({ ...actual.useWeb3React(), account: mockAccountValue }),
  }
})

const queryClient = new QueryClient()

i18n.load({
  [DEFAULT_LOCALE]: catalog.messages,
})
i18n.loadLocaleData({
  [DEFAULT_LOCALE]: { plurals: en },
})
i18n.activate(DEFAULT_LOCALE)

const MockedI18nProvider = ({ children }: any) => <I18nProvider i18n={i18n}>{children}</I18nProvider>

const SUT = () => (
  <ReduxProvider store={createTestStore()}>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <MockedI18nProvider>
          <Web3Provider>
            <ThemeProvider>
              <TopLevelModals />
            </ThemeProvider>
          </Web3Provider>
        </MockedI18nProvider>
      </HashRouter>
    </QueryClientProvider>
  </ReduxProvider>
)

test('blocks risky addresses', async () => {
  const { getByText } = render(<SUT />)
  act(() => {
    mockAccountValue = BLOCKED_ADDRESS
  })
  await waitFor(() => {
    getByText('Blocked Address')
  })
  expect(getByText('Blocked Address')).toBeInTheDocument()
})

test('does not block normal addresses', async () => {
  render(<SUT />)

  act(() => {
    mockAccountValue = '0x48c89D77ae34Ae475e4523b25aB01e363dce5A78'
  })
  expect(screen.queryByText('Blocked Address')).toBe(null)
})
