import { TransactionWarningBanner } from 'wallet/src/components/dappRequests/TransactionWarningBanner'
import { TransactionErrorType, TransactionRiskLevel } from 'wallet/src/features/dappRequests/types'
import { renderWithProviders } from 'wallet/src/test/render'

vi.mock('react-i18next', async () => {
  const { default: sourceTranslations } = await import('uniswap/src/i18n/locales/source/en-US.json')
  const translations: Record<string, string> = sourceTranslations

  return {
    useTranslation: (): { t: (key: string) => string } => ({
      t: (key: string): string => translations[key] ?? key,
    }),
    Trans: ({ i18nKey }: { i18nKey: string }): string => translations[i18nKey] ?? i18nKey,
  }
})

vi.mock('wallet/src/components/dappRequests/DappScanInfoModal', () => ({
  DappScanInfoModal: (): null => null,
}))

// Copy is pinned as literals on purpose: reading it from the locale file would let a wording
// regression pass unnoticed.
const SCAN_INCOMPLETE_TITLE = 'Safety check unavailable'
const SCAN_INCOMPLETE_DESCRIPTION = 'This request could not be checked for safety. Only continue if you trust this app.'
const SCAN_INCOMPLETE_ACKNOWLEDGEMENT = 'I understand the risks'

// The wallet test renderer runs on react-native-web under jsdom, so queries return DOM nodes even
// though they are typed as RNTL instances; the theme token survives in the rendered class list.
function markup(node: unknown): string {
  return (node as { outerHTML: string }).outerHTML
}

describe('TransactionWarningBanner scan failure', () => {
  it('shows the warning copy with an acknowledgement checkbox for a permanent scan failure', () => {
    const { getByText, queryByText } = renderWithProviders(
      <TransactionWarningBanner
        riskLevel={TransactionRiskLevel.None}
        scanFailureError={TransactionErrorType.ScanUnavailable}
        onConfirmRisk={vi.fn()}
      />,
    )

    expect(getByText(SCAN_INCOMPLETE_TITLE)).toBeTruthy()
    expect(getByText(SCAN_INCOMPLETE_DESCRIPTION)).toBeTruthy()
    expect(getByText(SCAN_INCOMPLETE_ACKNOWLEDGEMENT)).toBeTruthy()
    expect(queryByText(/may be malicious/)).toBeNull()
    expect(queryByText(/permanent loss of funds/)).toBeNull()
  })

  it('shows the same warning copy without a checkbox for a transient scan failure', () => {
    const { getByText, queryByText } = renderWithProviders(
      <TransactionWarningBanner
        riskLevel={TransactionRiskLevel.None}
        scanFailureError={TransactionErrorType.ScanFailed}
        onConfirmRisk={vi.fn()}
      />,
    )

    expect(getByText(SCAN_INCOMPLETE_TITLE)).toBeTruthy()
    expect(getByText(SCAN_INCOMPLETE_DESCRIPTION)).toBeTruthy()
    expect(queryByText(SCAN_INCOMPLETE_ACKNOWLEDGEMENT)).toBeNull()
  })

  it('renders a permanent scan failure in the warning theme, not the critical one', () => {
    const { getByText } = renderWithProviders(
      <TransactionWarningBanner
        riskLevel={TransactionRiskLevel.None}
        scanFailureError={TransactionErrorType.ScanUnavailable}
        onConfirmRisk={vi.fn()}
      />,
    )

    const title = getByText(SCAN_INCOMPLETE_TITLE)
    expect(markup(title)).toContain('statusWarning')
    expect(markup(title)).not.toContain('statusCritical')
  })

  it('leaves the malicious verdict banner untouched', () => {
    const { getByText } = renderWithProviders(
      <TransactionWarningBanner riskLevel={TransactionRiskLevel.Critical} onConfirmRisk={vi.fn()} />,
    )

    const title = getByText('Malicious request detected')
    expect(markup(title)).toContain('statusCritical')
    expect(getByText('Signing messages or transactions from this app could result in a loss of funds.')).toBeTruthy()
    expect(getByText('I understand the risks')).toBeTruthy()
  })
})
