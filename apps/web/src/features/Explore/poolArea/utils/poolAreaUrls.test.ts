import { getPoolAreaNavigation, getPoolAreaUrls } from '~/features/Explore/poolArea/utils/poolAreaUrls'

const HOOK_ADDRESS = '0x000000000000000000000000000000000000abcd'

describe('getPoolAreaUrls', () => {
  it('carries the Positions network and query state into discovery', () => {
    const searchParams = new URLSearchParams('chain=base&search=ETH&status=1&featureFlagOverride=hooks_explore_ux')

    expect(getPoolAreaUrls({ pathname: '/positions', searchParams })).toEqual({
      positions: '/positions?chain=base&search=ETH&status=1&featureFlagOverride=hooks_explore_ux',
      pools: '/explore/pools/base?search=ETH&status=1&featureFlagOverride=hooks_explore_ux',
      hooks: '/explore/hooks/base?search=ETH&status=1&featureFlagOverride=hooks_explore_ux',
    })
    expect(searchParams.get('chain')).toBe('base')
  })

  it.each(['/explore/pools/base', '/explore/hooks/base'])(
    'uses the path network on %s instead of a conflicting query',
    (pathname) => {
      expect(getPoolAreaUrls({ pathname, searchParams: new URLSearchParams('chain=ethereum&period=7d') })).toEqual({
        positions: '/positions?period=7d&chain=base',
        pools: '/explore/pools/base?period=7d',
        hooks: '/explore/hooks/base?period=7d',
      })
    },
  )

  it('does not pass a hook deployment network back into the discovery lists', () => {
    const searchParams = new URLSearchParams('chain=ethereum&period=30d&featureFlagOverride=hooks_explore_ux')

    expect(getPoolAreaUrls({ pathname: `/explore/hooks/base/${HOOK_ADDRESS}`, searchParams })).toEqual({
      positions: '/positions?period=30d&featureFlagOverride=hooks_explore_ux',
      pools: '/explore/pools?period=30d&featureFlagOverride=hooks_explore_ux',
      hooks: '/explore/hooks?period=30d&featureFlagOverride=hooks_explore_ux',
    })
    expect(searchParams.get('chain')).toBe('ethereum')
  })

  it.each(['/explore', '/explore/pools', '/explore/hooks', '/explore/hooks/unknown'])(
    'keeps all networks authoritative on %s',
    (pathname) => {
      expect(getPoolAreaUrls({ pathname, searchParams: new URLSearchParams('chain=base&period=1d') })).toEqual({
        positions: '/positions?period=1d',
        pools: '/explore/pools?period=1d',
        hooks: '/explore/hooks?period=1d',
      })
    },
  )

  it.each(['/explore/base', '/explore/tokens/base', `/explore/pools/base/${HOOK_ADDRESS}`])(
    'retains the current Explore network from %s',
    (pathname) => {
      expect(getPoolAreaUrls({ pathname, searchParams: new URLSearchParams() })).toEqual({
        positions: '/positions?chain=base',
        pools: '/explore/pools/base',
        hooks: '/explore/hooks/base',
      })
    },
  )

  it('round-trips a selected network and repeated query parameters through Hooks', () => {
    const initialParams = new URLSearchParams('chain=base&filter=one&filter=two')
    const hooksUrl = new URL(
      getPoolAreaUrls({ pathname: '/positions', searchParams: initialParams }).hooks,
      'https://uniswap.org',
    )
    const positionsUrl = new URL(
      getPoolAreaUrls({ pathname: hooksUrl.pathname, searchParams: hooksUrl.searchParams }).positions,
      'https://uniswap.org',
    )

    expect(positionsUrl.pathname).toBe('/positions')
    expect(positionsUrl.searchParams.get('chain')).toBe('base')
    expect(positionsUrl.searchParams.getAll('filter')).toEqual(['one', 'two'])
    expect(initialParams.toString()).toBe('chain=base&filter=one&filter=two')
  })

  it('preserves Positions handling of Solana while offering unscoped EVM discovery', () => {
    expect(getPoolAreaUrls({ pathname: '/positions', searchParams: new URLSearchParams('chain=solana') })).toEqual({
      positions: '/positions?chain=solana',
      pools: '/explore/pools',
      hooks: '/explore/hooks',
    })
  })

  it('does not reinterpret invalid numeric Positions chain values', () => {
    expect(getPoolAreaUrls({ pathname: '/positions', searchParams: new URLSearchParams('chain=8453') })).toEqual({
      positions: '/positions?chain=8453',
      pools: '/explore/pools',
      hooks: '/explore/hooks',
    })
  })
})

describe('getPoolAreaNavigation', () => {
  it.each([
    '/swap',
    '/liquidity/launch-auction',
    '/positions/add',
    '/positions/add/new',
    '/migrate/v2/ethereum/0x123',
    '/migrate/v3/ethereum/123',
  ])('retains only shared navigation parameters when leaving %s', (pathname) => {
    const searchParams = new URLSearchParams(
      [
        'inputCurrency=ETH&lng=fr-FR&featureFlagOverride=hooks_explore_ux',
        'outputCurrency=USDC&lng=de-DE&chain=base',
        'featureFlagOverrideOff=old_gate&experimentOverride=experiment%3Atest',
        'layerOverride=layer%3Aenabled&layerOverrideOff=layer%3Alegacy',
        'theme=dark&featureFlagOverride=second_gate&recipient=private&currencyA=ETH&depositState=private',
      ].join('&'),
    )
    const originalQuery = searchParams.toString()
    const positionsQuery = [
      'lng=fr-FR&featureFlagOverride=hooks_explore_ux&lng=de-DE&chain=base',
      'featureFlagOverrideOff=old_gate&experimentOverride=experiment%3Atest',
      'layerOverride=layer%3Aenabled&layerOverrideOff=layer%3Alegacy&featureFlagOverride=second_gate',
    ].join('&')
    const discoveryQuery = [
      'lng=fr-FR&featureFlagOverride=hooks_explore_ux&lng=de-DE',
      'featureFlagOverrideOff=old_gate&experimentOverride=experiment%3Atest',
      'layerOverride=layer%3Aenabled&layerOverrideOff=layer%3Alegacy&featureFlagOverride=second_gate',
    ].join('&')

    expect(getPoolAreaNavigation({ pathname, searchParams })).toEqual({
      positions: `/positions?${positionsQuery}`,
      pools: `/explore/pools/base?${discoveryQuery}`,
      hooks: `/explore/hooks/base?${discoveryQuery}`,
    })
    expect(searchParams.toString()).toBe(originalQuery)
  })

  it('applies explicit omissions to shared navigation parameters', () => {
    expect(
      getPoolAreaNavigation({
        pathname: '/swap',
        searchParams: new URLSearchParams(
          'chain=base&lng=fr-FR&featureFlagOverride=hooks_explore_ux&recipient=private',
        ),
        omitSearchParams: ['lng', 'featureFlagOverride'],
      }),
    ).toEqual({
      positions: '/positions?chain=base',
      pools: '/explore/pools/base',
      hooks: '/explore/hooks/base',
    })
  })

  it('keeps browser destinations relative and derives the network from the current route', () => {
    expect(
      getPoolAreaNavigation({
        pathname: '/explore/pools/base',
        searchParams: new URLSearchParams('chain=ethereum&qa=retained'),
      }),
    ).toEqual({
      positions: '/positions?qa=retained&chain=base',
      pools: '/explore/pools/base?qa=retained',
      hooks: '/explore/hooks/base?qa=retained',
    })
  })

  it('omits search-only parameters while retaining repeated values and the original query', () => {
    const searchParams = new URLSearchParams('result=pool&type=search&qa=retained&filter=one&filter=two')
    const originalQuery = searchParams.toString()
    const urls = getPoolAreaNavigation({
      pathname: '/explore/hooks/base',
      searchParams,
      omitSearchParams: ['result', 'type'],
    })

    expect(urls).toEqual({
      positions: '/positions?qa=retained&filter=one&filter=two&chain=base',
      pools: '/explore/pools/base?qa=retained&filter=one&filter=two',
      hooks: '/explore/hooks/base?qa=retained&filter=one&filter=two',
    })
    expect(searchParams.toString()).toBe(originalQuery)
  })
})
