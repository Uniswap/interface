/* eslint-env node */

const fs = require('fs')
const { parseStringPromise, Builder } = require('xml2js')

const weekMs = 7 * 24 * 60 * 60 * 1000
const nowISO = new Date().toISOString()

const getTopTokensQuery = (chain) => `
  query {
    topTokens(pageSize: 100, page: 1, chain: ${chain}, orderBy: VOLUME) {
      address
    }
  }`

const getTopPoolsQuery = (v3Chain) => `
  query {
    topV3Pools(first: 50, chain: ${v3Chain}) {
      id
      address
    }
    topV2Pairs(first: 50, chain: ETHEREUM) {
      address
    }
  }
`

const chains = ['ETHEREUM', 'ARBITRUM', 'OPTIMISM', 'POLYGON', 'BASE', 'BNB', 'CELO']

const nftTopCollectionsQuery = `
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

fs.readFile('./public/tokens-sitemap.xml', 'utf8', async (err, data) => {
  const tokenURLs = {}
  try {
    const sitemap = await parseStringPromise(data)
    if (sitemap.urlset.url) {
      sitemap.urlset.url.forEach((url) => {
        const lastMod = new Date(url.lastmod).getTime()
        if (lastMod < Date.now() - weekMs) {
          url.lastmod = nowISO
        }
        tokenURLs[url.loc] = true
      })
    }

    for (const chainName of chains) {
      const tokensResponse = await fetch('https://api.uniswap.org/v1/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://app.uniswap.org',
        },
        body: JSON.stringify({ query: getTopTokensQuery(chainName) }),
      })
      const tokensJSON = await tokensResponse.json()
      const tokenAddresses = tokensJSON.data.topTokens.map((token) => token.address.toLowerCase())

      tokenAddresses.forEach((address) => {
        const tokenURL = `https://app.uniswap.org/explore/tokens/${chainName.toLowerCase()}/${address}`
        if (!(tokenURL in tokenURLs)) {
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
    const path = './public/tokens-sitemap.xml'
    fs.writeFile(path, xml, (error) => {
      if (error) throw error
      const stats = fs.statSync(path)
      const fileSizeBytes = stats.size
      const fileSizeMegabytes = fileSizeBytes / (1024 * 1024)

      if (fileSizeMegabytes > 50) {
        throw new Error('Generated tokens-sitemap.xml file size exceeds 50MB')
      }
      console.log('Tokens sitemap updated')
    })
  } catch (e) {
    console.error(e)
  }
})

fs.readFile('./public/nfts-sitemap.xml', 'utf8', async (err, data) => {
  const collectionURLs = {}
  try {
    const sitemap = await parseStringPromise(data)
    if (sitemap.urlset.url) {
      sitemap.urlset.url.forEach((url) => {
        const lastMod = new Date(url.lastmod).getTime()
        if (lastMod < Date.now() - weekMs) {
          url.lastmod = nowISO
        }
        collectionURLs[url.loc] = true
      })
    }

    const nftResponse = await fetch('https://interface.gateway.uniswap.org/v1/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://app.uniswap.org',
      },
      body: JSON.stringify({ query: nftTopCollectionsQuery }),
    })
    const nftJSON = await nftResponse.json()
    const collectionAddresses = nftJSON.data.topCollections.edges.map((edge) => edge.node.nftContracts[0].address)
    collectionAddresses.forEach((address) => {
      const collectionURL = `https://app.uniswap.org/nfts/collection/${address}`
      if (!(collectionURL in collectionURLs)) {
        sitemap.urlset.url.push({
          loc: [collectionURL],
          lastmod: [nowISO],
          priority: [0.7],
        })
      }
    })

    const builder = new Builder()
    const xml = builder.buildObject(sitemap)
    const path = './public/nfts-sitemap.xml'
    fs.writeFile(path, xml, (error) => {
      if (error) throw error
      const stats = fs.statSync(path)
      const fileSizeBytes = stats.size
      const fileSizeMegabytes = fileSizeBytes / (1024 * 1024)

      if (fileSizeMegabytes > 50) {
        throw new Error('Generated nfts-sitemap.xml file size exceeds 50MB')
      }
      console.log('NFT collections sitemap updated')
    })
  } catch (e) {
    console.error(e)
  }
})

fs.readFile('./public/pools-sitemap.xml', 'utf8', async (err, data) => {
  const poolURLs = {}
  try {
    const sitemap = await parseStringPromise(data)
    if (sitemap.urlset.url) {
      sitemap.urlset.url.forEach((url) => {
        const lastMod = new Date(url.lastmod).getTime()
        if (lastMod < Date.now() - weekMs) {
          url.lastmod = nowISO
        }
        poolURLs[url.loc] = true
      })
    }

    for (const chainName of chains) {
      const poolsResponse = await fetch('https://api.uniswap.org/v1/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://app.uniswap.org',
        },
        body: JSON.stringify({ query: getTopPoolsQuery(chainName) }),
      })
      const poolsJSON = await poolsResponse.json()
      const v3PoolAddresses = poolsJSON.data.topV3Pools?.map((pool) => pool.address.toLowerCase()) ?? []
      const v2PoolAddresses = poolsJSON.data.topV2Pairs?.map((pool) => pool.address.toLowerCase()) ?? []
      const poolAddresses = v3PoolAddresses.concat(v2PoolAddresses)

      poolAddresses.forEach((address) => {
        const poolUrl = `https://app.uniswap.org/explore/pools/${chainName.toLowerCase()}/${address}`
        if (!(poolUrl in poolURLs)) {
          sitemap.urlset.url.push({
            loc: [poolUrl],
            lastmod: [nowISO],
            priority: [0.8],
          })
        }
      })
    }

    const builder = new Builder()
    const xml = builder.buildObject(sitemap)
    const path = './public/pools-sitemap.xml'
    fs.writeFile(path, xml, (error) => {
      if (error) throw error
      const stats = fs.statSync(path)
      const fileSizeBytes = stats.size
      const fileSizeMegabytes = fileSizeBytes / (1024 * 1024)

      if (fileSizeMegabytes > 50) {
        throw new Error('Generated pools-sitemap.xml file size exceeds 50MB')
      }
      console.log('Pools sitemap updated')
    })
  } catch (e) {
    console.error(e)
  }
})
