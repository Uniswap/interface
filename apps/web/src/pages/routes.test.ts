import fs from 'fs'
import React from 'react'
import { parseStringPromise } from 'xml2js'
import { EMBED_BASE_PATH, isEmbedPath } from '~/pages/embedPaths'
import { EMBED_ENTRY_ROUTES, findRouteByPath, routes } from '~/pages/RouteDefinitions'

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
