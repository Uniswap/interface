import fs from 'fs'
import { parseStringPromise } from 'xml2js'

import { findRouteByPath, routes } from './RouteDefinitions'

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
