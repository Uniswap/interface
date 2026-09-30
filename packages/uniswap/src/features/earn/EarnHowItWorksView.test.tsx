import { fireEvent } from '@testing-library/react-native'
import { TestID } from '@universe/test'
import { EarnHowItWorksView } from 'uniswap/src/features/earn/EarnHowItWorksView'
import { EarnEventName } from 'uniswap/src/features/telemetry/constants/features'
import type { EarnAnalyticsBaseProperties } from 'uniswap/src/features/telemetry/types'
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

const mockSendEvent = vi.hoisted(() => vi.fn())

// Trace impressions send through the untyped analytics module, not sendAnalyticsEvent.
vi.mock('utilities/src/telemetry/analytics/analytics', () => ({
  analytics: { sendEvent: mockSendEvent },
}))

describe(EarnHowItWorksView, () => {
  beforeEach(() => {
    mockPlatform.isWebPlatform = true
    mockOpenUri.mockClear()
    mockSendEvent.mockClear()
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

  it('logs exactly one viewed impression when analytics properties are provided', () => {
    const analyticsProperties: EarnAnalyticsBaseProperties = {
      surface: 'web',
      entry_point: 'global_modal',
      vault_id: '1-0xvault',
    }
    const { rerender } = renderWithProviders(
      <EarnHowItWorksView analyticsProperties={analyticsProperties} onContinue={vi.fn()} />,
    )
    rerender(<EarnHowItWorksView analyticsProperties={{ ...analyticsProperties }} onContinue={vi.fn()} />)

    const viewedCalls = mockSendEvent.mock.calls.filter(([name]) => name === EarnEventName.EarnHowItWorksViewed)
    expect(viewedCalls).toHaveLength(1)
    expect(viewedCalls[0]?.[1]).toEqual(expect.objectContaining(analyticsProperties))
  })

  it('does not log a viewed impression without analytics properties', () => {
    renderWithProviders(<EarnHowItWorksView onContinue={vi.fn()} />)

    expect(mockSendEvent).not.toHaveBeenCalledWith(EarnEventName.EarnHowItWorksViewed, expect.anything())
  })

  it('logs the viewed impression once the gated analytics properties resolve after mount', () => {
    const analyticsProperties: EarnAnalyticsBaseProperties = {
      surface: 'web',
      entry_point: 'global_modal',
      vault_id: '1-0xvault',
      has_existing_position: true,
    }
    const { rerender } = renderWithProviders(
      <EarnHowItWorksView analyticsProperties={undefined} onContinue={vi.fn()} />,
    )
    expect(mockSendEvent).not.toHaveBeenCalledWith(EarnEventName.EarnHowItWorksViewed, expect.anything())

    rerender(<EarnHowItWorksView analyticsProperties={analyticsProperties} onContinue={vi.fn()} />)

    const viewedCalls = mockSendEvent.mock.calls.filter(([name]) => name === EarnEventName.EarnHowItWorksViewed)
    expect(viewedCalls).toHaveLength(1)
    expect(viewedCalls[0]?.[1]).toEqual(expect.objectContaining(analyticsProperties))
  })
})
