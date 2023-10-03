import fs from 'fs'
import parser from 'xml2json'

import { routes } from './RouteDefinitions'

describe('Routes', () => {
  it('sitemap URLs should exist as Router paths', async () => {
    const pathNames: string[] = routes.map((routeDef) => routeDef.path)
    await new Promise<boolean>((resolve) => {
      fs.readFile('./public/sitemap.xml', 'utf8', (err, data) => {
        try {
          const sitemap = parser.toJson(data)
          const sitemapPaths = JSON.parse(sitemap).urlset.url.map((url: any) => new URL(url.loc).pathname)

          sitemapPaths.forEach((path: string) => {
            expect(pathNames).toContain(path)
            if (!pathNames.includes(path)) {
              throw new Error(`${path} is missing from Routes`)
            }
          })

          resolve(true)
        } catch {
          throw new Error('Error parsing sitemap.xml')
        }
      })
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
