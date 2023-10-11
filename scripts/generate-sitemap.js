/* eslint-env node */

const fs = require('fs')
const { parseStringPromise, Builder } = require('xml2js')

const weekMs = 7 * 24 * 60 * 60 * 1000
const nowISO = new Date().toISOString()

const getQuery = (chain) => `
  query {
    topTokens(pageSize: 100, page: 1, chain: ${chain}, orderBy: VOLUME) {
      address
    }
  }
`
const chains = ['ETHEREUM', 'ARBITRUM', 'OPTIMISM', 'POLYGON', 'BASE', 'BNB', 'CELO']

fs.readFile('./public/sitemap.xml', 'utf8', async (err, data) => {
  const sitemapURLs = {}
  try {
    const sitemap = await parseStringPromise(data)
    if (sitemap.urlset.url) {
      sitemap.urlset.url.forEach((url) => {
        const lastMod = new Date(url.lastmod).getTime()
        if (lastMod < Date.now() - weekMs) {
          url.lastmod = nowISO
        }
        sitemapURLs[url.loc] = true
      })
    }

    for (const chainName of chains) {
      const response = await fetch('https://api.uniswap.org/v1/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://app.uniswap.org',
        },
        body: JSON.stringify({ query: getQuery(chainName) }),
      })
      const tokensJSON = await response.json()
      const tokenAddresses = tokensJSON.data.topTokens.map((token) => token.address.toLowerCase())

      tokenAddresses.forEach((address) => {
        const tokenURL = `https://app.uniswap.org/tokens/${chainName.toLowerCase()}/${address}`
        if (!(tokenURL in sitemapURLs)) {
          sitemap.urlset.url.push({
            loc: [tokenURL],
            lastmod: [nowISO],
            priority: [0.8],
          })
        }
      })
    }

    const builder = new Builder()
    const xml = builder.buildObject(sitemap)
    fs.writeFile('./public/sitemap.xml', xml, (error) => {
      if (error) throw error
      console.log('Sitemap updated')
    })
  } catch (e) {
    console.error(e)
  }
})
