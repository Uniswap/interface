const auctionImageUrls = ['http://localhost:3000/api/image/auctions/base/0x7e867b47a94df05188c08575e8B9a52F3F69c469']

test.each(auctionImageUrls)('auctionImageUrl: %s', async (url) => {
  const response = await fetch(new Request(url))
  expect(response.status).toBe(200)
  expect(response.headers.get('content-type')).toBe('image/png')
  // Satori renders the PNG lazily while the body streams, so a render error
  // (e.g. a multi-child <div> missing `display: flex`) surfaces as a 200 with
  // an empty body, not a failure status. Assert real bytes came back.
  const body = await response.arrayBuffer()
  expect(body.byteLength).toBeGreaterThan(0)
})

const invalidAuctionImageUrls = [
  'http://localhost:3000/api/image/auctions/invalidnetwork/0x7e867b47a94df05188c08575e8B9a52F3F69c469',
  'http://localhost:3000/api/image/auctions/base/0x0',
]

test.each(invalidAuctionImageUrls)('invalidAuctionImageUrl: %s', async (url) => {
  const response = await fetch(new Request(url))
  expect(response.status).toBe(404)
})
