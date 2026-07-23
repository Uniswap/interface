import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import type { ReactNode } from 'react'
import { Flex } from 'ui/src'
import { mapRankedRwa } from 'uniswap/src/data/rest/rwa/mapRankedRwa'
import { makeRankedRwa } from 'uniswap/src/data/rest/rwa/rankedRwaTestHelpers'
import type { Rwa } from 'uniswap/src/data/rest/rwa/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ExpandableIssuerRows } from 'uniswap/src/features/expandableAsset/ExpandableIssuerPanel'
import type { RenderIssuerRowArgs } from 'uniswap/src/features/expandableAsset/types'
import { fireEvent, render } from 'uniswap/src/test/test-utils'

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

describe('ExpandableIssuerRows renderIssuerRow seam', () => {
  it('renders the default per-issuer TouchableArea (testID + tap → onIssuerPress) when renderIssuerRow is omitted', () => {
    const onIssuerPress = vi.fn()
    const rwa = singleIssuerRwa()
    const { getByTestId } = render(
      <ExpandableIssuerRows
        asset={rwa}
        enabledChainIds={ENABLED_CHAINS}
        variant="search"
        onIssuerPress={onIssuerPress}
      />,
    )
    fireEvent.press(getByTestId('search-rwa-issuer-TSLA-xstocks'))
    expect(onIssuerPress).toHaveBeenCalledWith(rwa.issuerTokens[0])
  })

  it('renders renderIssuerRow in place of the built-in TouchableArea (ownsTouchable, isRowFocused=false, nav onPress)', () => {
    const onIssuerPress = vi.fn()
    const rwa = singleIssuerRwa()
    let captured: RenderIssuerRowArgs | undefined
    const renderIssuerRow = vi.fn((args: RenderIssuerRowArgs): ReactNode => {
      captured = args
      return <Flex testID="injected-issuer-row">{args.children}</Flex>
    })
    const { getByTestId } = render(
      <ExpandableIssuerRows
        asset={rwa}
        enabledChainIds={ENABLED_CHAINS}
        variant="search"
        onIssuerPress={onIssuerPress}
        renderIssuerRow={renderIssuerRow}
      />,
    )
    // The render-prop output is rendered in place of the panel's own TouchableArea...
    expect(getByTestId('injected-issuer-row')).toBeTruthy()
    // ...and the row-locator testID is preserved (moved to the wrapper for this path).
    expect(getByTestId('search-rwa-issuer-TSLA-xstocks')).toBeTruthy()
    // Expanded sub-row contract: owns its single touchable, not focus-driven, receives the navigation onPress.
    expect(renderIssuerRow).toHaveBeenCalledTimes(1)
    expect(captured?.ownsTouchable).toBe(true)
    expect(captured?.isRowFocused).toBe(false)
    expect(captured?.menuControl).toBeUndefined()
    expect(captured?.issuer).toBe(rwa.issuerTokens[0])
    captured?.onPress()
    expect(onIssuerPress).toHaveBeenCalledWith(rwa.issuerTokens[0])
  })
})
