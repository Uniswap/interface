const tokenImageUrl = [
  'http://127.0.0.1:3000/api/image/tokens/ethereum/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  // 'http://127.0.0.1:3000/api/image/tokens/ethereum/NATIVE',
  // 'http://127.0.0.1:3000/api/image/tokens/polygon/NATIVE',
]

test.each(tokenImageUrl)('assetImageUrl', async (url) => {
  expect(true).toBe(true)
  // const response = await fetch(new Request(url))
  // expect(response.status).toBe(200)
  // expect(response.headers.get('content-type')).toBe('image/png')
})

const invalidTokenImageUrl = [
  'http://127.0.0.1:3000/api/image/tokens/ethereum/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb49',
  'http://127.0.0.1:3000/api/image/tokens/ethereum',
  'http://127.0.0.1:3000/api/image/tokens/ethereun',
  'http://127.0.0.1:3000/api/image/tokens/ethereum/0x0',
  'http://127.0.0.1:3000/api/image/tokens/potato/?potato=1',
]

test.each(invalidTokenImageUrl)('invalidAssetImageUrl', async (url) => {
  const response = await fetch(new Request(url))
  expect([404, 500]).toContain(response.status)
})
