/* eslint-env node */

const fs = require('fs')
const parser = require('xml2json')

fs.readFile('./public/sitemap.xml', 'utf8', (err, data) => {
  try {
    const sitemap = parser.toJson(data)
    const siteMapJson = JSON.parse(sitemap)
    const lastmodDate = new Date().toISOString()
    if (siteMapJson.urlset.url) {
      siteMapJson.urlset.url.forEach((url) => {
        url.lastmod = lastmodDate
      })
    }
    const newSitemap = parser.toXml(siteMapJson)
    fs.writeFile('./public/sitemap.xml', newSitemap, (error) => {
      if (error) throw error
      console.log('Sitemap updated')
    })
  } catch {
    throw new Error('Error parsing sitemap.xml')
  }
})
