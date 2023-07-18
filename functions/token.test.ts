const tokens = [
  {
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    network: 'ethereum',
    symbol: 'USDC',
    image:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
  },
  {
    address: 'NATIVE',
    network: 'ethereum',
    symbol: 'ETH',
    image: 'https://token-icons.s3.amazonaws.com/eth.png',
  },
  {
    address: 'NATIVE',
    network: 'polygon',
    symbol: 'MATIC',
    image:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0/logo.png',
  },
  {
    address: '0x1f52145666c862ed3e2f1da213d479e61b2892af',
    network: 'arbitrum',
    symbol: 'FUC',
    image: 'https://assets.coingecko.com/coins/images/30081/large/fuc.png?1683016112',
  },
  {
    address: '0x6982508145454ce325ddbe47a25d4ec3d2311933',
    network: 'ethereum',
    symbol: 'PEPE',
    image:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x6982508145454Ce325dDbE47a25d4ec3d2311933/logo.png',
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
