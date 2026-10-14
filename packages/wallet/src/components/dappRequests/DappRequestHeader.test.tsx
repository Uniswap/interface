import { DappRequestHeader } from 'wallet/src/components/dappRequests/DappRequestHeader'
import { render } from 'wallet/src/test/test-utils'

// A long Vercel preview hostname, matching the real-world report (a hard clip mid-character
// instead of the full origin being visible) — see the "connect request" bug in #apps-feedback.
const LONG_HOSTNAME = 'web-claude-upbeat-swirles-db66a5-uniswap.vercel.app'
const LONG_DAPP_URL = `https://${LONG_HOSTNAME}`

describe(DappRequestHeader, () => {
  it('renders the full hostname for a long dapp URL, with no part hidden by truncation', () => {
    const { getByText } = render(
      <DappRequestHeader dappInfo={{ name: LONG_HOSTNAME, url: LONG_DAPP_URL, icon: null }} title="Connect request" />,
    )

    // The full origin (including the TLD) must render as one findable text node — a
    // connect-request modal is the user's only signal for which site is asking for
    // permissions, so hiding any part of it (e.g. behind a tail ellipsis) would be a
    // security regression, not just a layout nit. Regression coverage for the underlying
    // "the row never shrinks, so it clips instead of wrapping" bug lives in
    // LinkButton.test.tsx's snapshot (`shrink-[1]`, no `whitespace-nowrap`/`text-ellipsis`),
    // since LinkButton is the component that actually owns that layout.
    expect(getByText(LONG_HOSTNAME)).toBeTruthy()
  })

  it('still renders a short hostname unchanged', () => {
    const { getByText } = render(
      <DappRequestHeader
        dappInfo={{ name: 'uniswap.org', url: 'https://app.uniswap.org', icon: null }}
        title="Connect request"
      />,
    )

    expect(getByText('app.uniswap.org')).toBeTruthy()
  })
})
