const poolImageUrls = [
  'http://localhost:3000/api/image/pools/ethereum/0xA43fe16908251ee70EF74718545e4FE6C5cCEc9f',
  'http://localhost:3000/api/image/pools/base/0xc9034c3E7F58003E6ae0C8438e7c8f4598d5ACAA',
]

test.each(poolImageUrls)('poolImageUrl: %s', async (url) => {
  const response = await fetch(new Request(url))
  expect(response.status).toBe(200)
  expect(response.headers.get('content-type')).toBe('image/png')
})

const invalidPoolImageUrls = [
  'http://localhost:3000/api/image/pools/ethereum/0x123',
  'http://localhost:3000/api/image/pools/blast/invalid',
]

test.each(invalidPoolImageUrls)('invalidPoolImageUrl: %s', async (url) => {
  const response = await fetch(new Request(url))
  expect(response.status).toBe(404)
})
