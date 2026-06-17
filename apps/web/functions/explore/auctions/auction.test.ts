// Scope snapshots to just the meta tags the middleware injects (it stamps
// every injected tag with data-rh="true"). Catches unintended UX changes
// in OG/Twitter card output without coupling to the SPA HTML template.
export {}

function extractInjectedAuctionMetaTags(body: string): string {
  return (body.match(/<meta[^>]*data-rh="true"[^>]*>/g) ?? []).join('\n')
}

const auctions = [
  {
    address: '0x7e867b47a94df05188c08575e8B9a52F3F69c469',
    network: 'base',
    image: 'http://localhost:3000/api/image/auctions/base/0x7e867b47a94df05188c08575e8B9a52F3F69c469',
  },
]

test.each(auctions)('should inject metadata for valid auctions', async (auction) => {
  const url = 'http://localhost:3000/explore/auctions/' + auction.network + '/' + auction.address
  const body = await fetch(new Request(url)).then((res) => res.text())
  const injectedMetaTags = extractInjectedAuctionMetaTags(body)

  expect(injectedMetaTags).toContain('<meta property="og:title" content="Bid on ')
  expect(injectedMetaTags).toContain('<meta property="og:description" content="Bid on ')
  expect(injectedMetaTags).toContain('<meta name="description" content="Bid on ')
  expect(body).toContain(`<meta property="og:image" content="${auction.image}" data-rh="true">`)
  expect(body).toContain(`<meta property="og:image:width" content="1200" data-rh="true">`)
  expect(body).toContain(`<meta property="og:image:height" content="630" data-rh="true">`)
  expect(body).toContain(`<meta property="og:type" content="website" data-rh="true">`)
  expect(body).toContain(`<meta property="og:url" content="${url}" data-rh="true">`)
  expect(injectedMetaTags).toContain('<meta property="twitter:title" content="Bid on ')
  expect(body).toContain(`<meta property="twitter:image" content="${auction.image}" data-rh="true">`)
  expect(body).not.toContain('<meta property="og:title" content="Uniswap Interface" data-rh="true">')
})

const invalidAuctions = [
  'http://localhost:3000/explore/auctions/invalidnetwork/0x7e867b47a94df05188c08575e8B9a52F3F69c469',
  'http://localhost:3000/explore/auctions/base/0x0',
]

test.each(invalidAuctions)('should not inject metadata for invalid auctions', async (url) => {
  const body = await fetch(new Request(url)).then((res) => res.text())
  const injectedMetaTags = extractInjectedAuctionMetaTags(body)

  expect(injectedMetaTags).not.toContain('og:title')
  expect(injectedMetaTags).not.toContain('og:image')
  expect(injectedMetaTags).not.toContain('twitter:title')
})
