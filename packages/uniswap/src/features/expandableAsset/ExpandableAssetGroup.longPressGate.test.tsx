import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { Flex } from 'ui/src'
import { mapRankedRwa } from 'uniswap/src/data/rest/rwa/mapRankedRwa'
import { makeRankedRwa } from 'uniswap/src/data/rest/rwa/rankedRwaTestHelpers'
import type { Rwa } from 'uniswap/src/data/rest/rwa/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ExpandableAssetGroup } from 'uniswap/src/features/expandableAsset/ExpandableAssetGroup'
import type { RenderIssuerRowArgs } from 'uniswap/src/features/expandableAsset/types'
import { act, render } from 'uniswap/src/test/test-utils'

// Capture the props ExpandableAssetGroup hands to its (platform-split) row container, so we can assert the long-press
// gate at the source instead of through the rendered touchable (this env returns DOM nodes from getByTestId, so the
// React `onLongPress` prop isn't observable there). The collapsed row's `renderIssuerRow` is invoked by
// ExpandableAssetGroup itself when it builds the header, so `menuControl` stays observable even with the row stubbed.
const { containerProps } = vi.hoisted(() => ({
  containerProps: [] as { onParentLongPress?: () => Promise<void> }[],
}))
vi.mock('uniswap/src/features/expandableAsset/ExpandableSearchRowContainer', () => ({
  ExpandableSearchRowContainer: (props: { onParentLongPress?: () => Promise<void> }) => {
    containerProps.push(props)
    return null
  },
}))
// Keep the gated long-press hermetic: the haptic + keyboard-dismiss are side effects, not what this test asserts.
vi.mock('utilities/src/device/keyboard/dismissNativeKeyboard', () => ({ dismissNativeKeyboard: vi.fn() }))
vi.mock('uniswap/src/features/settings/useHapticFeedback/useHapticFeedback', () => ({
  useHapticFeedback: () => ({ hapticFeedback: { success: vi.fn().mockResolvedValue(undefined) } }),
}))

const ENABLED_CHAINS = [UniverseChainId.Mainnet, UniverseChainId.Base, UniverseChainId.ArbitrumOne]

function singleIssuerRwa(): Rwa {
  const rwa = mapRankedRwa({
    token: makeRankedRwa({
      symbol: 'TSLA',
      issuerTokens: [
        {
          symbol: 'TSLAX',
          name: 'Tesla (xStocks)',
          logoUrl: '',
          issuer: 'xstocks',
          priceUsd: 1,
          volume24hUsd: 1,
          marketCapUsd: 1,
          chainTokens: [{ chainId: UniverseChainId.Base, address: '0xbase' }],
        },
      ],
    }),
    category: RwaCategory.STOCKS,
  })
  if (!rwa) {
    throw new Error('failed to build Rwa test fixture')
  }
  return rwa
}

describe('ExpandableAssetGroup collapsed-row long-press gate (isIssuerMenuReady)', () => {
  beforeEach(() => {
    containerProps.length = 0
  })

  it('does not wire the long-press while the issuer menu is unresolved (prevents the premature-open latch)', () => {
    render(
      <ExpandableAssetGroup
        asset={singleIssuerRwa()}
        enabledChainIds={ENABLED_CHAINS}
        isExpanded={false}
        onToggle={vi.fn()}
        onParentPress={vi.fn()}
        isIssuerMenuReady={() => false}
        renderIssuerRow={(args) => <Flex>{args.children}</Flex>}
      />,
    )
    // Gate closed → no long-press handler reaches the row on ANY render, so it can't fire the haptic or latch the
    // controlled menu open while the row is still menu-less (the regression this guards against). Assert across all
    // captured renders (not just the last) so the check can't be fooled by an extra/stray render.
    expect(containerProps.length).toBeGreaterThan(0)
    expect(containerProps.every((props) => props.onParentLongPress === undefined)).toBe(true)
  })

  it('wires the long-press once the issuer menu is ready, and it opens the controlled menu', async () => {
    let captured: RenderIssuerRowArgs | undefined
    render(
      <ExpandableAssetGroup
        asset={singleIssuerRwa()}
        enabledChainIds={ENABLED_CHAINS}
        isExpanded={false}
        onToggle={vi.fn()}
        onParentPress={vi.fn()}
        isIssuerMenuReady={() => true}
        renderIssuerRow={(args) => {
          captured = args
          return <Flex>{args.children}</Flex>
        }}
      />,
    )
    // Gate open → every render wires the long-press handler.
    const wired = containerProps
      .map((props) => props.onParentLongPress)
      .filter((handler): handler is () => Promise<void> => typeof handler === 'function')
    expect(wired.length).toBe(containerProps.length)
    expect(wired.length).toBeGreaterThan(0)
    expect(captured?.menuControl?.isOpen).toBe(false)
    await act(async () => {
      await wired.at(-1)?.()
    })
    // Firing the now-wired long-press opens the controlled menu the collapsed row shares with the shell.
    expect(captured?.menuControl?.isOpen).toBe(true)
  })
})
