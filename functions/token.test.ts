const tokens = [
  {
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    network: 'ethereum',
    symbol: 'USDC',
    image: 'http://127.0.0.1:3000/api/image/tokens/ethereum/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  },
  {
    address: 'NATIVE',
    network: 'ethereum',
    symbol: 'ETH',
    image: 'http://127.0.0.1:3000/api/image/tokens/ethereum/NATIVE',
  },
  {
    address: 'NATIVE',
    network: 'polygon',
    symbol: 'MATIC',
    image: 'http://127.0.0.1:3000/api/image/tokens/polygon/NATIVE',
  },
  {
    address: '0x1f52145666c862ed3e2f1da213d479e61b2892af',
    network: 'arbitrum',
    symbol: 'FUC',
    image: 'http://127.0.0.1:3000/api/image/tokens/arbitrum/0x1f52145666c862ed3e2f1da213d479e61b2892af',
  },
  {
    address: '0x6982508145454ce325ddbe47a25d4ec3d2311933',
    network: 'ethereum',
    symbol: 'PEPE',
    image: 'http://127.0.0.1:3000/api/image/tokens/ethereum/0x6982508145454ce325ddbe47a25d4ec3d2311933',
  },
]

test.each(tokens)('should inject metadata for valid tokens', async (token) => {
  const url = 'http://127.0.0.1:3000/tokens/' + token.network + '/' + token.address
  const body = await fetch(new Request(url)).then((res) => res.text())
  expect(body).toMatchSnapshot()
  expect(body).toContain(`<meta property="og:title" content="Get ${token.symbol} on Uniswap"/>`)
  expect(body).toContain(`<meta property="og:image" content="${token.image}"/>`)
  expect(body).toContain(`<meta property="og:image:width" content="1200"/>`)
  expect(body).toContain(`<meta property="og:image:height" content="630"/>`)
  expect(body).toContain(`<meta property="og:type" content="website"/>`)
  expect(body).toContain(`<meta property="og:url" content="${url}"/>`)
  expect(body).toContain(`<meta property="og:image:alt" content="Get ${token.symbol} on Uniswap"/>`)
  expect(body).toContain(`<meta property="twitter:card" content="summary_large_image"/>`)
  expect(body).toContain(`<meta property="twitter:title" content="Get ${token.symbol} on Uniswap"/>`)
  expect(body).toContain(`<meta property="twitter:image" content="${token.image}"/>`)
  expect(body).toContain(`<meta property="twitter:image:alt" content="Get ${token.symbol} on Uniswap"/>`)
})

const invalidTokens = [
  'http://127.0.0.1:3000/tokens/ethereum/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb49',
  'http://127.0.0.1:3000/tokens/ethereum',
  'http://127.0.0.1:3000/tokens/ethereun',
  'http://127.0.0.1:3000/tokens/ethereum/0x0',
  'http://127.0.0.1:3000/tokens/ethereum//',
  'http://127.0.0.1:3000/tokens/potato/?potato=1',
]

test.each(invalidTokens)('should not inject metadata for invalid tokens', async (url) => {
  const body = await fetch(new Request(url)).then((res) => res.text())
  expect(body).not.toContain('og:title')
  expect(body).not.toContain('og:image')
  expect(body).not.toContain('og:image:width')
  expect(body).not.toContain('og:image:height')
  expect(body).not.toContain('og:type')
  expect(body).not.toContain('og:url')
  expect(body).not.toContain('og:image:alt')
  expect(body).not.toContain('twitter:card')
  expect(body).not.toContain('twitter:title')
  expect(body).not.toContain('twitter:image')
  expect(body).not.toContain('twitter:image:alt')
})

test('api should not return a valid response', async () => {
  const invalidUrls = [
    'ethereum/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb49',
    'ethereum/0x0',
    'potato/?potato=1',
    'tomato/NATIVE',
  ]
  for (const urls of invalidUrls) {
    const url = 'http://127.0.0.1:3000/api/image/tokens/' + urls
    const req = new Request(url)
    const res = await fetch(req)
    expect([404, 500]).toContain(res.status)
  }
}, 50000)
