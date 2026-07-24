import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import type { ReactNode } from 'react'
import { Flex } from 'ui/src'
import { mapRankedRwa } from 'uniswap/src/data/rest/rwa/mapRankedRwa'
import { makeRankedRwa } from 'uniswap/src/data/rest/rwa/rankedRwaTestHelpers'
import type { Rwa } from 'uniswap/src/data/rest/rwa/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ExpandableAssetGroup } from 'uniswap/src/features/expandableAsset/ExpandableAssetGroup'
import type { RenderIssuerRowArgs } from 'uniswap/src/features/expandableAsset/types'
import { render } from 'uniswap/src/test/test-utils'

const ENABLED_CHAINS = [UniverseChainId.Mainnet, UniverseChainId.Base, UniverseChainId.ArbitrumOne]

function makeIssuer(slug: string, symbol: string) {
  return {
    symbol,
    name: `Tesla (${slug})`,
    logoUrl: '',
    issuer: slug,
    priceUsd: 1,
    volume24hUsd: 1,
    marketCapUsd: 1,
    chainTokens: [{ chainId: UniverseChainId.Base, address: `0x${slug}` }],
  }
}

function rwaWithIssuers(issuers: Array<[string, string]>): Rwa {
  const rwa = mapRankedRwa({
    token: makeRankedRwa({ symbol: 'TSLA', issuerTokens: issuers.map(([slug, symbol]) => makeIssuer(slug, symbol)) }),
    category: RwaCategory.STOCKS,
  })
  if (!rwa) {
    throw new Error('failed to build Rwa test fixture')
  }
  return rwa
}

describe('ExpandableAssetGroup renderIssuerRow wiring', () => {
  it('wraps the collapsed single-issuer identity with ownsTouchable=false + a controlled menuControl', () => {
    const rwa = rwaWithIssuers([['xstocks', 'TSLAX']])
    let captured: RenderIssuerRowArgs | undefined
    const renderIssuerRow = vi.fn((args: RenderIssuerRowArgs): ReactNode => {
      captured = args
      return <Flex testID="injected">{args.children}</Flex>
    })
    render(
      <ExpandableAssetGroup
        asset={rwa}
        enabledChainIds={ENABLED_CHAINS}
        isExpanded={false}
        onToggle={vi.fn()}
        onParentPress={vi.fn()}
        focusedRowControl={{ rowIndex: 2, focusedRowIndex: 2, setFocusedRowIndex: vi.fn() }}
        renderIssuerRow={renderIssuerRow}
      />,
    )
    expect(renderIssuerRow).toHaveBeenCalledTimes(1)
    expect(captured?.ownsTouchable).toBe(false)
    expect(captured?.isRowFocused).toBe(true) // focusedRowIndex === rowIndex
    expect(captured?.issuer).toBe(rwa.issuerTokens[0])
    expect(captured?.menuControl?.isOpen).toBe(false)
    expect(typeof captured?.menuControl?.openMenu).toBe('function')
    expect(typeof captured?.menuControl?.closeMenu).toBe('function')
  })

  it('embeds the category tag inside the collapsed single-issuer menu row exactly once (not duplicated by the shell)', () => {
    // A single-issuer Stocks-shelf row shows a category tag. It must render ONCE — inside the row body, before the
    // hover `…` (so the order is tag, then `…`) — and NOT also by the shell header.
    const rwa = rwaWithIssuers([['ondo', 'TSLAON']])
    const { getAllByText } = render(
      <ExpandableAssetGroup
        asset={rwa}
        enabledChainIds={ENABLED_CHAINS}
        isExpanded={false}
        onToggle={vi.fn()}
        onParentPress={vi.fn()}
        renderIssuerRow={(args) => <Flex testID="injected">{args.children}</Flex>}
      />,
    )
    expect(getAllByText('Stocks')).toHaveLength(1)
  })

  it('passes isRowFocused=false for a single-issuer row that is not the focused row', () => {
    const rwa = rwaWithIssuers([['ondo', 'TSLAON']])
    let captured: RenderIssuerRowArgs | undefined
    render(
      <ExpandableAssetGroup
        asset={rwa}
        enabledChainIds={ENABLED_CHAINS}
        isExpanded={false}
        onToggle={vi.fn()}
        onParentPress={vi.fn()}
        focusedRowControl={{ rowIndex: 3, focusedRowIndex: 1, setFocusedRowIndex: vi.fn() }}
        renderIssuerRow={(args) => {
          captured = args
          return <Flex testID="injected">{args.children}</Flex>
        }}
      />,
    )
    expect(captured?.isRowFocused).toBe(false)
  })

  it('does not wrap (or render sub-rows for) a collapsed multi-issuer parent row', () => {
    const rwa = rwaWithIssuers([
      ['xstocks', 'TSLAX'],
      ['ondo', 'TSLAON'],
    ])
    const renderIssuerRow = vi.fn((): ReactNode => null)
    render(
      <ExpandableAssetGroup
        asset={rwa}
        enabledChainIds={ENABLED_CHAINS}
        isExpanded={false}
        onToggle={vi.fn()}
        renderIssuerRow={renderIssuerRow}
      />,
    )
    expect(renderIssuerRow).not.toHaveBeenCalled()
  })

  it('forwards renderIssuerRow to the expanded multi-issuer sub-rows with ownsTouchable=true (no menuControl)', () => {
    const rwa = rwaWithIssuers([
      ['xstocks', 'TSLAX'],
      ['ondo', 'TSLAON'],
    ])
    const calls: RenderIssuerRowArgs[] = []
    const renderIssuerRow = vi.fn((args: RenderIssuerRowArgs): ReactNode => {
      calls.push(args)
      return <Flex testID={`injected-${args.issuer.issuer}`}>{args.children}</Flex>
    })
    render(
      <ExpandableAssetGroup
        asset={rwa}
        enabledChainIds={ENABLED_CHAINS}
        isExpanded={true}
        onToggle={vi.fn()}
        onIssuerPress={vi.fn()}
        renderIssuerRow={renderIssuerRow}
      />,
    )
    expect(renderIssuerRow).toHaveBeenCalledTimes(2)
    expect(calls.every((a) => a.ownsTouchable === true)).toBe(true)
    expect(calls.every((a) => a.isRowFocused === false)).toBe(true)
    expect(calls.every((a) => a.menuControl === undefined)).toBe(true)
  })
})
