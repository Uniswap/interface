const tokenImageUrl = [
  'http://localhost:3000/api/image/tokens/ethereum/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  'http://localhost:3000/api/image/tokens/ethereum/NATIVE',
]

test.each(tokenImageUrl)('tokenImageUrl %s', async (url) => {
  const response = await fetch(new Request(url))
  expect(response.status).toBe(200)
  expect(response.headers.get('content-type')).toBe('image/png')
})

const invalidTokenImageUrl = [
  'http://localhost:3000/api/image/tokens/ethereum/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb49',
]

test.each(invalidTokenImageUrl)('invalidTokenImageUrl %s', async (url) => {
  const response = await fetch(new Request(url))
  expect(response.status).toBe(404)
})
