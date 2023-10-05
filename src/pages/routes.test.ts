import fs from 'fs'
import { parseStringPromise } from 'xml2js'

import { routes } from './RouteDefinitions'

describe('Routes', () => {
  it('sitemap URLs should exist as Router paths', async () => {
    const pathNames: string[] = routes.map((routeDef) => routeDef.path)
    const contents = fs.readFileSync('./public/sitemap.xml', 'utf8')
    const sitemap = await parseStringPromise(contents)

    const sitemapPaths = sitemap.urlset.url.map((url: any) => new URL(url['$'].loc).pathname)

    sitemapPaths.forEach((path: string) => {
      expect(pathNames).toContain(path)
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
