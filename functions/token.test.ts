/* eslint-disable */
const waitPort = require('wait-port')

const params = {
  port: 3001,
  host: 'localhost',
}

beforeAll(async () => {
  await waitPort(params)
}, 60000)

test('should inject metadata for valid tokens', async () => {
  const tokens = [
    {
      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      network: 'ethereum',
      symbol: 'USDC',
      image: 'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
    },
    {
      address: 'NATIVE',
      network: 'ethereum',
      symbol: 'ETH',
      image: 'https://token-icons.s3.amazonaws.com/eth.png'
    },
    {
      address: 'NATIVE',
      network: 'polygon',
      symbol: 'MATIC',
      image: 'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0/logo.png'
    },
    {
      address: '0x1f52145666c862ed3e2f1da213d479e61b2892af',
      network: 'arbitrum',
      symbol: 'FUC',
      image: 'https://assets.coingecko.com/coins/images/30081/large/fuc.png?1683016112'
    },
    {
      address: '0x6982508145454ce325ddbe47a25d4ec3d2311933',
      network: 'ethereum',
      symbol: 'PEPE',
      image: 'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x6982508145454Ce325dDbE47a25d4ec3d2311933/logo.png'
    }
  ]
  for (const token of tokens) {
    const url = 'http://127.0.0.1:3000/tokens/' + token.network + '/' + token.address
    const req = new Request(url)
    const res = await fetch(req)
    const body = await res.text()
    expect(body).toMatchSnapshot()
    expect(body).toContain('Get ' + token.symbol + ' on Uniswap')
    expect(body).toContain(token.image)
    expect(body).toContain(url)
    expect(body).toContain(`<meta property="og:title" content = "Get ${token.symbol} on Uniswap"/>`)
    expect(body).toContain(`<meta property="og:image" content = "${token.image}"/>`)
    expect(body).toContain(`<meta property="og:image:width" content = "1200"/>`)
    expect(body).toContain(`<meta property="og:image:height" content = "630"/>`)
    expect(body).toContain(`<meta property="og:type" content = "website"/>`)
    expect(body).toContain(`<meta property="og:url" content = "${url}"/>`)
    expect(body).toContain(`<meta property="og:image:alt" content = "https://app.uniswap.org/images/512x512_App_Icon.png"/>`)
    expect(body).toContain(`<meta property="twitter:card" content = "summary_large_image"/>`)
    expect(body).toContain(`<meta property="twitter:title" content = "Get ${token.symbol} on Uniswap"/>`)
    expect(body).toContain(`<meta property="twitter:image" content = "${token.image}"/>`)
    expect(body).toContain(`<meta property="twitter:image:alt" content = "https://app.uniswap.org/images/512x512_App_Icon.png"/>`)
  }
})

test('should not inject metadata for invalid calls', async () => {
  const baseReq = new Request('http://127.0.0.1:3000/tokens/ethereum/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb49')
  const baseRes = await fetch(baseReq)
  const baseBody = await baseRes.text()
  expect(baseBody).toMatchSnapshot()
  expect(baseBody).not.toContain('og:title')
  expect(baseBody).not.toContain('og:image')
  expect(baseBody).not.toContain('og:image:width')
  expect(baseBody).not.toContain('og:image:height')
  expect(baseBody).not.toContain('og:type')
  expect(baseBody).not.toContain('og:url')
  expect(baseBody).not.toContain('og:image:alt')
  expect(baseBody).not.toContain('twitter:card')
  expect(baseBody).not.toContain('twitter:title')
  expect(baseBody).not.toContain('twitter:image')
  expect(baseBody).not.toContain('twitter:image:alt')
  const urls = [
    'http://127.0.0.1:3000/tokens/ethereum',
    'http://127.0.0.1:3000/tokens/ethereun',
    'http://127.0.0.1:3000/tokens/ethereum/0x0',
    'http://127.0.0.1:3000/tokens/ethereum//',
    'http://127.0.0.1:3000/tokens/potato/?potato=1',
  ]
  for (const url of urls) {
    const req = new Request(url)
    const res = await fetch(req)
    const body = await res.text()
    expect(body).toEqual(baseBody)
  }
})