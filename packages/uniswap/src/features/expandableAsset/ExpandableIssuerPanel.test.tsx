import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { UniverseChainId } from '@universe/chains'
import { Flex } from '@universe/mycelium'
import type { ReactNode } from 'react'
import { mapRankedRwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/mapRankedRwa'
import { makeRankedRwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/rankedRwaTestHelpers'
import type { Rwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import { ExpandableIssuerRows } from 'uniswap/src/features/expandableAsset/ExpandableIssuerPanel'
import type { RenderIssuerRowArgs } from 'uniswap/src/features/expandableAsset/types'
import { fireEvent, render } from 'uniswap/src/test/test-utils'

const ENABLED_CHAINS = [UniverseChainId.Mainnet, UniverseChainId.Base, UniverseChainId.ArbitrumOne]

const MULTICHAIN_TOKENS = [
  { chainId: UniverseChainId.Base, address: '0xbase' },
  { chainId: UniverseChainId.Mainnet, address: '0xmainnet' },
]

function singleIssuerRwa({
  multichain = false,
  volume24hUsd = 1,
  priceUsd = 1,
}: { multichain?: boolean; volume24hUsd?: number; priceUsd?: number } = {}): Rwa {
  const rwa = mapRankedRwa({
    token: makeRankedRwa({
      symbol: 'TSLA',
      issuerTokens: [
        {
          symbol: 'TSLAX',
          name: 'Tesla (xStocks)',
          logoUrl: '',
          issuer: 'xstocks',
          priceUsd,
          volume24hUsd,
          marketCapUsd: 1,
          chainTokens: multichain ? MULTICHAIN_TOKENS : [MULTICHAIN_TOKENS[0]!],
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

describe('ExpandableIssuerRows issuer stats', () => {
  const NETWORKS_LABEL_KEY = 'explore.tokens.table.networks'

  it('shows each issuer price instead of its network count when showIssuerStats is set', () => {
    const { getByText, queryByText } = render(
      <ExpandableIssuerRows
        asset={singleIssuerRwa({ multichain: true, priceUsd: 248.42 })}
        enabledChainIds={ENABLED_CHAINS}
        variant="search"
        showIssuerStats
      />,
    )
    expect(getByText('$248.42')).toBeTruthy()
    expect(queryByText(NETWORKS_LABEL_KEY)).toBeNull()
  })

  it('keeps the network count subline and no price by default', () => {
    const { getByText, queryByText } = render(
      <ExpandableIssuerRows
        asset={singleIssuerRwa({ multichain: true, priceUsd: 248.42 })}
        enabledChainIds={ENABLED_CHAINS}
        variant="search"
      />,
    )
    expect(getByText(NETWORKS_LABEL_KEY)).toBeTruthy()
    expect(queryByText('$248.42')).toBeNull()
  })

  it('shows no network count or price for an issuer with zeroed metrics when showIssuerStats is set', () => {
    const { getByText, queryByText } = render(
      <ExpandableIssuerRows
        asset={singleIssuerRwa({ multichain: true, volume24hUsd: 0, priceUsd: 0 })}
        enabledChainIds={ENABLED_CHAINS}
        variant="search"
        showIssuerStats
      />,
    )
    expect(queryByText(NETWORKS_LABEL_KEY)).toBeNull()
    expect(queryByText(/^\$/)).toBeNull()
  })
})
