/* eslint-env node */

const fs = require('fs')
const { parseStringPromise, Builder } = require('xml2js')

const weekMs = 7 * 24 * 60 * 60 * 1000
const nowISO = new Date().toISOString()

const getTokensQuery = (chain) => `
  query {
    topTokens(pageSize: 100, page: 1, chain: ${chain}, orderBy: VOLUME) {
      address
    }
  }
`
const chains = ['ETHEREUM', 'ARBITRUM', 'OPTIMISM', 'POLYGON', 'BASE', 'BNB', 'CELO']

const nftQuery = `
  query {
    topCollections(first: 100, duration: MAX) {
      edges {
        node {
          nftContracts {
            address
          }
        }
      }
    }
  }
`

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
      const tokensResponse = await fetch('https://api.uniswap.org/v1/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://app.uniswap.org',
        },
        body: JSON.stringify({ query: getTokensQuery(chainName) }),
      })
      const tokensJSON = await tokensResponse.json()
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

    const nftResponse = await fetch('https://api.uniswap.org/v1/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://app.uniswap.org',
      },
      body: JSON.stringify({ query: nftQuery }),
    })
    const nftJSON = await nftResponse.json()
    const collectionAddresses = nftJSON.data.topCollections.edges.map((edge) => edge.node.nftContracts[0].address)
    collectionAddresses.forEach((address) => {
      const collectionURL = `https://app.uniswap.org/nfts/collection/${address}`
      if (!(collectionURL in sitemapURLs)) {
        sitemap.urlset.url.push({
          loc: [collectionURL],
          lastmod: [nowISO],
          priority: [0.7],
        })
      }
    })

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
