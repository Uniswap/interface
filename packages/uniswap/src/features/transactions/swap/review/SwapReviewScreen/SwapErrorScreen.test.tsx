import { fireEvent, screen } from '@testing-library/react-native'
import { SharedEventName } from '@uniswap/analytics-events'
import type { ReactNode } from 'react'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { SwapErrorScreen } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapErrorScreen'
import { renderWithProviders } from 'uniswap/src/test/render'
import { TraceContext } from 'utilities/src/telemetry/trace/TraceContext'

const mocks = vi.hoisted(() => ({
  isWebPlatform: false,
  errorContent: {
    title: 'Swap failed',
    message: 'Your funds are safe.',
    buttonText: 'Retry swap',
    supportArticleURL: undefined as string | undefined,
  },
  sendAnalyticsEvent: vi.fn(),
  openUri: vi.fn(),
}))

vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    get isWebPlatform(): boolean {
      return mocks.isWebPlatform
    },
  }
})

vi.mock('uniswap/src/features/telemetry/send', () => ({ sendAnalyticsEvent: mocks.sendAnalyticsEvent }))

vi.mock('uniswap/src/utils/linking', () => ({ openUri: mocks.openUri }))

vi.mock('uniswap/src/features/transactions/errors', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/features/transactions/errors')>()
  return { ...actual, getErrorContent: (): typeof mocks.errorContent => mocks.errorContent }
})

vi.mock('uniswap/src/features/transactions/components/TransactionModal/TransactionModal', () => ({
  TransactionModalInnerContainer: ({ children }: { children?: ReactNode }): ReactNode => children,
}))

vi.mock('uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext', () => ({
  useTransactionModalContext: (): { bottomSheetViewStyles: object } => ({ bottomSheetViewStyles: {} }),
}))

vi.mock(
  'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore',
  () => ({
    useTransactionSettingsStore: (selector: (s: { selectedProtocols: string[] }) => unknown): unknown =>
      selector({ selectedProtocols: [] }),
    useTransactionSettingsActions: (): { setSelectedProtocols: () => void } => ({ setSelectedProtocols: vi.fn() }),
  }),
)

function renderScreen(): { resubmitSwap: () => void; setSubmissionError: (e: Error | undefined) => void } {
  const resubmitSwap = vi.fn()
  const setSubmissionError = vi.fn()
  renderWithProviders(
    <TraceContext.Provider value={{ screen: 'swap-review' }}>
      <SwapErrorScreen
        submissionError={new Error('boom')}
        setSubmissionError={setSubmissionError}
        resubmitSwap={resubmitSwap}
        onPressRetry={undefined}
        onClose={vi.fn()}
      />
    </TraceContext.Provider>,
  )
  return { resubmitSwap, setSubmissionError }
}

describe('SwapErrorScreen', () => {
  beforeEach(() => {
    mocks.isWebPlatform = false
    mocks.errorContent.supportArticleURL = undefined
    mocks.sendAnalyticsEvent.mockClear()
    mocks.openUri.mockClear()
  })

  it('retries and logs the old Trace press event on native', () => {
    const { resubmitSwap, setSubmissionError } = renderScreen()
    expect(screen.getByText('Swap failed')).toBeTruthy()
    expect(screen.getByText('Your funds are safe.')).toBeTruthy()

    fireEvent.press(screen.getByText('Retry swap'))

    expect(resubmitSwap).toHaveBeenCalledTimes(1)
    expect(setSubmissionError).toHaveBeenCalledWith(undefined)
    expect(mocks.sendAnalyticsEvent).toHaveBeenCalledTimes(1)
    expect(mocks.sendAnalyticsEvent).toHaveBeenCalledWith(SharedEventName.ELEMENT_CLICKED, {
      screen: 'swap-review',
      modal: ModalName.SwapError,
      element: ElementName.BackButton,
    })
  })

  it('retries without an analytics event on web, where the old button never logged', () => {
    mocks.isWebPlatform = true
    const { resubmitSwap } = renderScreen()

    fireEvent.press(screen.getByText('Retry swap'))

    expect(resubmitSwap).toHaveBeenCalledTimes(1)
    expect(mocks.sendAnalyticsEvent).not.toHaveBeenCalled()
  })

  it('hides learn more without a support article', () => {
    renderScreen()
    expect(screen.queryByText('Learn more')).toBeNull()
  })

  it('opens the support article in the external browser from learn more', () => {
    mocks.errorContent.supportArticleURL = 'https://support.uniswap.org/article'
    renderScreen()

    fireEvent.press(screen.getByText('Learn more'))

    expect(mocks.openUri).toHaveBeenCalledWith({
      uri: 'https://support.uniswap.org/article',
      openExternalBrowser: true,
    })
    expect(mocks.sendAnalyticsEvent).not.toHaveBeenCalled()
  })
})
