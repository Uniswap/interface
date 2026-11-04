const fs = require('fs')
const { parseStringPromise, Builder } = require('xml2js')

// Inline version of normalizeTokenAddressForCache to avoid PNG import issues
// Copied from @universe/chains
function normalizeTokenAddressForCache(address) {
  if (address === 'NATIVE' || address === 'native') {
    return 'native'
  }

  // Simple EVM address validation and normalization
  if (address && typeof address === 'string' && address.startsWith('0x') && address.length === 42) {
    return address.toLowerCase()
  }

  // For non-EVM addresses (like Solana), return as-is
  return address
}

const weekMs = 7 * 24 * 60 * 60 * 1000
const nowISO = new Date().toISOString()

// Should be kept in sync with PROD_ENTRY_GATEWAY_API_BASE_URL in packages/api/src/clients/base/entryGatewayUrls.ts
const DATA_API_V2_URL = 'https://entry-gateway.backend-prod.api.uniswap.org/data.v2.DataApiService'
const POOLS_PER_CHAIN = 50

// Explore URL slug → chain id for the chains whose top pools get sitemap entries
const poolChains = {
  ethereum: 1,
  arbitrum: 42161,
  optimism: 10,
  polygon: 137,
  base: 8453,
  bnb: 56,
  celo: 42220,
  unichain: 130,
  avalanche: 43114,
  soneium: 1868,
  worldchain: 480,
  zksync: 324,
  zora: 7777777,
}

fs.readFile('./public/tokens-sitemap.xml', 'utf8', async (_err, data) => {
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

    const tokensResponse = await fetch(
      'https://interface.gateway.uniswap.org/v2/uniswap.explore.v1.ExploreStatsService/TokenRankings?connect=v1&encoding=json&message=' +
        encodeURIComponent(JSON.stringify({ chainId: 'ALL_NETWORKS' })),
      {
        method: 'GET',
        headers: {
          accept: '*/*',
          origin: 'https://app.uniswap.org',
          'content-type': 'application/json',
        },
      },
    )

    const tokensJSON = await tokensResponse.json()
    const tokenAddresses = tokensJSON.tokenRankings.TRENDING.tokens.map((token) => {
      return { chainName: token.chain.toLowerCase(), address: token.address ? token.address : 'NATIVE' }
    })

    tokenAddresses.forEach(({ chainName, address }) => {
      const tokenURL = `https://app.uniswap.org/explore/tokens/${chainName}/${normalizeTokenAddressForCache(address)}`
      if (!(tokenURL in tokenURLs)) {
        sitemap.urlset.url.push({
          loc: [tokenURL],
          lastmod: [nowISO],
          priority: [0.8],
        })
      }
    })

    const builder = new Builder()
    const xml = builder.buildObject(sitemap)
    const path = './public/tokens-sitemap.xml'
    fs.writeFile(path, xml, (error) => {
      if (error) {
        throw error
      }
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

fs.readFile('./public/pools-sitemap.xml', 'utf8', async (_err, data) => {
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

    for (const [chainSlug, chainId] of Object.entries(poolChains)) {
      // Top pools by TVL across every protocol version; poolId is the pair/pool address, or the pool id for v4
      const poolsResponse = await fetch(`${DATA_API_V2_URL}/ListPools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Connect-Protocol-Version': '1',
        },
        body: JSON.stringify({
          chainIds: [chainId],
          sort: { orderBy: 'POOLS_ORDER_BY_TVL', ascending: false },
          page: { pageSize: POOLS_PER_CHAIN },
        }),
      })
      const poolsJSON = await poolsResponse.json()
      const poolIds = (poolsJSON.pools ?? []).map((rankedPool) => rankedPool.pool?.poolId).filter(Boolean)

      poolIds.forEach((poolId) => {
        const poolUrl = `https://app.uniswap.org/explore/pools/${chainSlug}/${normalizeTokenAddressForCache(poolId)}`
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
      if (error) {
        throw error
      }
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
