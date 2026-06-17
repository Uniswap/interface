import { MultichainContextMenuAddressSubview } from 'uniswap/src/components/MultichainTokenDetails/MultichainContextMenuAddressSubview'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { RwaMultichainCopyButton } from 'uniswap/src/features/search/SearchModal/RwaMultichainCopyButton'
import { ON_PRESS_EVENT_PAYLOAD } from 'uniswap/src/test/fixtures'
import { WETH } from 'uniswap/src/test/fixtures/lib/sdk' // real ERC-20 SDK Token (isNative === false)
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { benignSafetyInfo } from 'uniswap/src/test/fixtures/wallet/currencies'
import { fireEvent, render } from 'uniswap/src/test/test-utils'
import { currencyId } from 'uniswap/src/utils/currencyId'

// Mutable platform getter so the native-null test can flip isWebPlatform:false WITHOUT a whole-file mock
// (which would break the web smoke + prop-controlled tests below, both of which need isWebPlatform:true).
// Defaults to true (web), matching the suite's default test platform.
const { mockIsWebPlatform } = vi.hoisted(() => ({ mockIsWebPlatform: { value: true } }))

vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    get isWebPlatform(): boolean {
      return mockIsWebPlatform.value
    },
  }
})

// useSearchTokenMenuItems (the action set) reads the active address from the accounts store; mock that hook so the
// trigger renders without a real store context.
vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useActiveAddress: vi.fn(() => '0xTestAddress'),
}))

const CI = buildCurrencyInfo({
  currencyId: currencyId(WETH),
  currency: WETH,
  logoUrl: null,
  safetyInfo: benignSafetyInfo,
})
const ENTRIES: MultichainTokenEntry[] = [
  { chainId: UniverseChainId.Mainnet, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', isNative: false },
  { chainId: UniverseChainId.ArbitrumOne, address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', isNative: false },
]

describe(RwaMultichainCopyButton, () => {
  it('renders the … trigger without crashing for a multichain issuer (web)', () => {
    const tree = render(<RwaMultichainCopyButton primaryCurrencyInfo={CI} orderedEntries={ENTRIES} isVisible />)
    // Web renders the <Flex><ContextMenu><ContextMenuTriggerButton/></…> wrapper → non-null.
    // (Distinguishes "rendered-but-closed" from the native "rendered-nothing" case below.)
    expect(tree.toJSON()).not.toBeNull()
    // Menu content is closed until opened → label absent (documents the closed state, NOT fan-out coverage).
    expect(tree.queryByText('common.copy.address')).toBeNull()
  })

  it('renders nothing on native (web-only guard)', () => {
    // The component returns null on native (its MultichainContextMenuAddressSubview uses a web <div>). Returning null
    // still leaves the provider-wrapper chrome in the tree, so compare against the exact baseline of rendering a
    // null-returning child through the same providers — the component must contribute ZERO additional nodes.
    const NullChild = (): null => null
    const baseline = JSON.stringify(render(<NullChild />).toJSON())

    mockIsWebPlatform.value = false
    try {
      const tree = render(<RwaMultichainCopyButton primaryCurrencyInfo={CI} orderedEntries={ENTRIES} isVisible />)
      expect(JSON.stringify(tree.toJSON())).toEqual(baseline)
    } finally {
      mockIsWebPlatform.value = true
    }
  })

  // Render the SAME per-chain panel node RwaMultichainCopyButton builds (MultichainContextMenuAddressSubview)
  // directly — its props are public — and assert the fan-out renders real chain names + fires onCopyAddress with
  // (address, chainId) on a row press. Proves the per-chain fan-out content deterministically.
  it('renders a per-chain address row for every entry and copies (address, chainId) on press', () => {
    const onCopyAddress = vi.fn()
    const { queryByText, getAllByTestId } = render(
      <MultichainContextMenuAddressSubview
        orderedEntries={ENTRIES}
        title="common.copy.address"
        onCopyAddress={onCopyAddress}
        onBack={vi.fn()}
      />,
    )

    expect(queryByText('Ethereum')).toBeTruthy()
    expect(queryByText('Arbitrum')).toBeTruthy()

    const rows = getAllByTestId(TestID.MultichainCopyAddress)
    expect(rows).toHaveLength(ENTRIES.length)
    fireEvent.press(rows[0]!, ON_PRESS_EVENT_PAYLOAD)
    expect(onCopyAddress).toHaveBeenCalledWith(ENTRIES[0]!.address, ENTRIES[0]!.chainId)
  })
})
