import { fireEvent as rtlFireEvent } from '@testing-library/react'
import { Text } from 'ui/src'
import { buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { RwaIssuerRow } from 'uniswap/src/features/search/SearchModal/RwaIssuerRow'
import { WETH } from 'uniswap/src/test/fixtures/lib/sdk' // real ERC-20 SDK Token (isNative === false)
import { benignSafetyInfo } from 'uniswap/src/test/fixtures/wallet/currencies'
import { render } from 'uniswap/src/test/test-utils'
import { currencyId } from 'uniswap/src/utils/currencyId'

// useSearchTokenMenuItems (the action set the menu renders) reads the active address from the accounts store; mock
// that hook so the menu renders its actions without a real store context.
vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useActiveAddress: vi.fn(() => '0xTestAddress'),
}))

// Real single-chain ERC-20 CurrencyInfo (NOT the native currencyInfo() fixture, which is isNative:true).
const ci = buildCurrencyInfo({
  currencyId: currencyId(WETH),
  currency: WETH,
  logoUrl: null,
  safetyInfo: benignSafetyInfo,
})

const CHILD_TESTID = 'rwa-issuer-row-child'
const props = {
  isRowFocused: false,
  onPress: vi.fn(),
  children: <Text testID={CHILD_TESTID}>Issuer</Text>,
}

describe(RwaIssuerRow, () => {
  it('renders the menu actions (raw i18n keys) for a resolved single-chain issuer', () => {
    const { getByTestId, getByText } = render(<RwaIssuerRow {...props} currencyInfo={ci} ownsTouchable isRowFocused />)
    // Open the menu via right-click: fire contextMenu on the testID'd child; the event bubbles to the web
    // `<div onContextMenu>` wrapper (which renders no testID), calling openMenu() → internal.setTrue → isOpen=true.
    rtlFireEvent.contextMenu(getByTestId(CHILD_TESTID) as unknown as Element)
    // Action labels render as RAW KEYS (the uniswap vitest i18n mock returns the raw key for unmapped strings).
    expect(getByText('common.copy.address')).toBeDefined()
    expect(getByText('common.button.swap')).toBeDefined()
    expect(getByText('common.button.send')).toBeDefined()
  })

  it('renders a plain navigation row (no menu) when currencyInfo is undefined', () => {
    const { queryByText } = render(<RwaIssuerRow {...props} currencyInfo={undefined} ownsTouchable />)
    expect(queryByText('common.button.swap')).toBeNull()
  })

  // === multichain Copy fan-out ===
  // (web, default platform) multichain issuer: the row mounts and the Secondary right-click menu still opens
  // (single-chain Copy unregressed). The self-isOpen-controlled web … panel doesn't flip in jsdom, so the per-chain
  // fan-out content is exercised by RwaMultichainCopyButton's own tests instead.
  it('mounts the multichain row and keeps the right-click action set (web)', () => {
    const { getByTestId, getByText } = render(
      <RwaIssuerRow
        {...props}
        currencyInfo={ci}
        ownsTouchable
        isRowFocused
        issuerChainTokens={[
          { chainId: 1, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
          { chainId: 42161, address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' },
        ]}
      />,
    )
    // Open the Secondary (right-click) menu (fire contextMenu on the child → bubbles to the web <div>), then assert
    // the raw-key action label renders (confirms the multichain row's right-click action set is intact).
    rtlFireEvent.contextMenu(getByTestId(CHILD_TESTID) as unknown as Element)
    expect(getByText('common.button.swap')).toBeDefined()
  })

  it('keeps the single-chain row (no fan-out) for a single-chain issuer (web)', () => {
    // Single chain → TokenRowContextMenuButton path; same right-click action set, no per-chain panel.
    const { getByTestId, getByText } = render(
      <RwaIssuerRow
        {...props}
        currencyInfo={ci}
        ownsTouchable
        isRowFocused
        issuerChainTokens={[{ chainId: 1, address: '0xabc' }]}
      />,
    )
    rtlFireEvent.contextMenu(getByTestId(CHILD_TESTID) as unknown as Element)
    expect(getByText('common.button.swap')).toBeDefined()
  })
})
