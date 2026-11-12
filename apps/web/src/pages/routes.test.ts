import fs from 'fs'
import React from 'react'
import { matchRoutes } from 'react-router'
import { USDC_ARC } from 'uniswap/src/constants/tokens'
import { parseStringPromise } from 'xml2js'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import type { RouterConfig } from '~/pages/routeDefinition'
import { EMBED_ENTRY_ROUTES, findRouteByPath, routes } from '~/pages/RouteDefinitions'
import { EMBED_BASE_PATH, isEmbedPath } from '~/utils/embedPaths'

vi.mock('~/pages/Swap', () => ({
  SwapPage: () => React.createElement(React.Fragment),
  Swap: () => React.createElement(React.Fragment),
}))

describe('Routes', () => {
  it('sitemap URLs should exist as Router paths', async () => {
    const contents = fs.readFileSync('./public/app-sitemap.xml', 'utf8')
    const sitemap = await parseStringPromise(contents)

    const sitemapPaths: string[] = sitemap.urlset.url.map((url: any) => new URL(url.loc).pathname)

    sitemapPaths
      .filter((p) => !p.includes('/0x'))
      .forEach((path: string) => {
        expect(findRouteByPath(path)).toBeDefined()
      })
  })

  /**
   * If you are updating the app routes, consider if you need to make a
   * corresponding update to the sitemap.xml file.
   */
  it('router definition should match snapshot', () => {
    expect(routes).toMatchSnapshot()
  })

  it('matches Arc NATIVE to its redirect before the generic token details route', () => {
    const redirectRoute = findRouteByPath(`/explore/tokens/arc/${NATIVE_CHAIN_ID}`)
    const redirectElement = redirectRoute?.getElement({})

    expect(redirectRoute?.path).toBe(`/explore/tokens/arc/${NATIVE_CHAIN_ID}`)
    expect(redirectElement).toMatchObject({
      props: { replace: true, to: `/explore/tokens/arc/${USDC_ARC.address}` },
    })
  })
})

describe('Hooks Explore routes', () => {
  it.each(['/explore/hooks', '/explore/hooks/ethereum'])('resolves %s before the generic Explore route', (path) => {
    expect(findRouteByPath(path)?.path).toBe('/explore/hooks')
  })

  it('preserves existing Explore metadata until the gated Hooks page mounts', () => {
    const path = '/explore/hooks/ethereum'
    const hooksRoute = findRouteByPath(path)
    const exploreRoute = routes.find((route) => route.path === '/explore')

    expect(hooksRoute?.getTitle(path)).toBe(exploreRoute?.getTitle(path))
    expect(hooksRoute?.getDescription(path)).toBe(exploreRoute?.getDescription(path))
  })

  it.each([
    [true, '/explore/hooks'],
    [false, '/explore'],
    [undefined, '/explore'],
  ] satisfies [RouterConfig['isHooksExploreEnabled'], string][])(
    'matches %s gate state to %s',
    (isHooksExploreEnabled, expectedPath) => {
      const enabledRoutes = routes.filter((route) => route.enabled({ isHooksExploreEnabled }))
      const routeTree = enabledRoutes.map((route) => ({
        path: route.path,
        children: route.nestedPaths.map((path) => ({ path })),
      }))

      for (const path of ['/explore/hooks', '/explore/hooks/ethereum']) {
        expect(matchRoutes(routeTree, path)?.[0]?.route.path).toBe(expectedPath)
      }
    },
  )
})

describe('Hook detail routes', () => {
  const path = '/explore/hooks/base/0x000000000000000000000000000000000000abcd'
  const routePath = '/explore/hooks/:chainName/:hookAddress'

  it('resolves the specific detail route before the Hooks list and generic Explore routes', () => {
    const detailRouteIndex = routes.findIndex((route) => route.path === routePath)

    expect(findRouteByPath(path)?.path).toBe(routePath)
    expect(detailRouteIndex).toBeLessThan(routes.findIndex((route) => route.path === '/explore/hooks'))
    expect(detailRouteIndex).toBeLessThan(routes.findIndex((route) => route.path === '/explore'))
  })

  it('keeps static metadata generic for the detail route', () => {
    const detailRoute = findRouteByPath(path)
    const exploreRoute = routes.find((route) => route.path === '/explore')

    expect(detailRoute?.getTitle(path)).toBe(exploreRoute?.getTitle(path))
    expect(detailRoute?.getDescription(path)).toBe(exploreRoute?.getDescription(path))
  })

  it.each([true, false, undefined])(
    'registers the direct detail route before the flag resolves (%s)',
    (isHooksExploreEnabled) => {
      const routeTree = routes
        .filter((route) => route.enabled({ isHooksExploreEnabled }))
        .map((route) => ({ path: route.path, children: route.nestedPaths.map((path) => ({ path })) }))

      expect(matchRoutes(routeTree, path)?.[0]?.route.path).toBe(routePath)
    },
  )
})

describe('Pools-area routes', () => {
  it.each(['/explore/pools', '/explore/pools/base'])('resolves %s before generic Explore', (path) => {
    expect(findRouteByPath(path)?.path).toBe('/explore/pools')
  })

  it('keeps the existing pool detail route', () => {
    expect(findRouteByPath('/explore/pools/base/0x123')?.path).toBe('/explore/pools/:chainName/:poolAddress')
  })

  it.each([true, false, undefined])('gates only the new Pools composition (%s)', (isHooksExploreEnabled) => {
    const routeTree = routes
      .filter((route) => route.enabled({ isHooksExploreEnabled }))
      .map((route) => ({ path: route.path, children: route.nestedPaths.map((path) => ({ path })) }))

    for (const path of ['/explore/pools', '/explore/pools/base']) {
      expect(matchRoutes(routeTree, path)?.[0]?.route.path).toBe(isHooksExploreEnabled ? '/explore/pools' : '/explore')
    }
    expect(matchRoutes(routeTree, '/explore/pools/base/0x123')?.[0]?.route.path).toBe(
      '/explore/pools/:chainName/:poolAddress',
    )
  })
})

describe('Embed routes', () => {
  it('adds only the /embed entry routes on top of the full app tree', () => {
    expect(EMBED_ENTRY_ROUTES.map((route) => route.path)).toEqual([EMBED_BASE_PATH, `${EMBED_BASE_PATH}/*`])
  })

  it('keeps the embed entry routes out of the main (sitemap-snapshotted) route tree', () => {
    routes.forEach((route) => {
      expect(isEmbedPath(route.path)).toBe(false)
    })
  })

  it('findRouteByPath resolves the /embed entry to a route definition', () => {
    expect(findRouteByPath(EMBED_BASE_PATH)?.path).toBe(EMBED_BASE_PATH)
  })

  it('findRouteByPath still resolves the full app routes from an embed document', () => {
    // The embed surface exposes the ENTIRE app, so standalone routes stay reachable.
    expect(findRouteByPath('/swap')?.path).toBe('/swap')
    expect(findRouteByPath('/send')?.path).toBe('/send')
    expect(findRouteByPath('/limit')?.path).toBe('/limit')
  })

  it('findRouteByPath does not resolve non-embed paths to embed routes', () => {
    expect(findRouteByPath('/swap')?.path).toBe('/swap')
    expect(findRouteByPath('/embedded')?.path).not.toBe(EMBED_BASE_PATH)
  })

  it.each([
    ['/embed', true],
    ['/embed/swap', true],
    ['/embed/anything/else', true],
    ['/embedded', false],
    ['/swap', false],
    ['/', false],
  ])('isEmbedPath(%s) is %s', (pathname, expected) => {
    expect(isEmbedPath(pathname)).toBe(expected)
  })
})
