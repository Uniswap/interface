/* eslint-env node */

const fs = require('fs')
const { parseStringPromise, Builder } = require('xml2js')

fs.readFile('./public/sitemap.xml', 'utf8', async (err, data) => {
  try {
    const sitemap = await parseStringPromise(data)

    const lastmodDate = new Date().toISOString()
    if (sitemap.urlset.url) {
      sitemap.urlset.url.forEach((url) => {
        url['$'].lastmod = lastmodDate
      })
    }
    const builder = new Builder()
    const xml = builder.buildObject(sitemap)
    fs.writeFile('./public/sitemap.xml', xml, (error) => {
      if (error) throw error
      console.log('Sitemap updated')
    })
  } catch {
    throw new Error('Error parsing sitemap.xml')
  }
})
