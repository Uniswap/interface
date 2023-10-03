import fs from 'fs'
import parser from 'xml2json'

import { routes } from './RouteDefinitions'

describe('Routes', () => {
  it('sitemap URLs should exist as Router paths', async () => {
    const pathNames: string[] = routes.map((routeDef) => routeDef.path)
    const result = await new Promise<boolean>((resolve) => {
      fs.readFile('./public/sitemap.xml', 'utf8', (err, data) => {
        try {
          const sitemap = parser.toJson(data)
          const sitemapPaths = JSON.parse(sitemap).urlset.url.map((url: any) => new URL(url.loc).pathname)

          sitemapPaths.forEach((path: string) => {
            if (!pathNames.includes(path)) {
              console.log(`${path} is missing from Routes`)
              resolve(false)
            }
          })

          resolve(true)
        } catch {
          resolve(false)
        }
      })
    })
    expect(result).toBeTruthy()
  })

  /**
   * If you are updating the sitemap or app routes, consider if you need to make a
   * corresponding update in the other file.
   */

  it('sitemap should match snapshot', () => {
    const result = fs.readFileSync('./public/sitemap.xml', 'utf8')
    expect(result).toMatchSnapshot()
  })

  it('router definition should match snapshot', () => {
    expect(routes).toMatchSnapshot()
  })
})
