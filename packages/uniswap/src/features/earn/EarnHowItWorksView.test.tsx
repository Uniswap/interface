import { fireEvent } from '@testing-library/react-native'
import { EarnHowItWorksView } from 'uniswap/src/features/earn/EarnHowItWorksView'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { renderWithProviders } from 'uniswap/src/test/render'

const mockPlatform = vi.hoisted(() => ({ isWebPlatform: true }))
const mockOpenUri = vi.hoisted(() => vi.fn(() => Promise.resolve()))

vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    get isWebPlatform(): boolean {
      return mockPlatform.isWebPlatform
    },
  }
})

vi.mock('uniswap/src/utils/linking', () => ({
  openUri: mockOpenUri,
}))

describe(EarnHowItWorksView, () => {
  beforeEach(() => {
    mockPlatform.isWebPlatform = true
    mockOpenUri.mockClear()
  })

  it('renders the web continue CTA and opens Earn help', () => {
    const onContinue = vi.fn()
    const { getByText, queryByTestId } = renderWithProviders(<EarnHowItWorksView onContinue={onContinue} />)

    expect(queryByTestId(TestID.EarnLegalDisclaimer)).toBeNull()
    expect(getByText('explore.earn.howItWorks.acknowledgement')).toBeDefined()

    fireEvent.press(getByText('common.help'))
    fireEvent.press(getByText('common.button.continue'))

    expect(mockOpenUri).toHaveBeenCalledOnce()
    expect(onContinue).toHaveBeenCalledOnce()
  })

  it('renders the mobile CTA without the web header', () => {
    mockPlatform.isWebPlatform = false
    const onContinue = vi.fn()
    const { getByText, queryByTestId, queryByText } = renderWithProviders(
      <EarnHowItWorksView onContinue={onContinue} />,
    )

    expect(queryByTestId(TestID.EarnLegalDisclaimer)).toBeNull()
    expect(getByText('explore.earn.howItWorks.acknowledgement')).toBeDefined()
    expect(queryByText('common.help')).toBeNull()

    fireEvent.press(getByText('common.button.continue'))

    expect(onContinue).toHaveBeenCalledOnce()
  })
})
