const pools = [
  {
    address: '0xCBCdF9626bC03E24f779434178A73a0B4bad62eD',
    network: 'ethereum',
    name: 'WBTC/WETH',
    image: 'http://localhost:3000/api/image/pools/ethereum/0xCBCdF9626bC03E24f779434178A73a0B4bad62eD',
  },
  {
    address: '0x517F9dD285e75b599234F7221227339478d0FcC8',
    network: 'ethereum',
    name: 'DAI/MKR',
    image: 'http://localhost:3000/api/image/pools/ethereum/0x517F9dD285e75b599234F7221227339478d0FcC8',
  },
  {
    address: '0xD1F1baD4c9E6c44DeC1e9bF3B94902205c5Cd6C3',
    network: 'optimism',
    name: 'USDC.e/WLD',
    image: 'http://localhost:3000/api/image/pools/optimism/0xD1F1baD4c9E6c44DeC1e9bF3B94902205c5Cd6C3',
  },
]

test.each(pools)('should inject metadata for valid pools', async (pool) => {
  const url = 'http://localhost:3000/explore/pools/' + pool.network + '/' + pool.address
  const body = await fetch(new Request(url)).then((res) => res.text())
  expect(body).toMatchSnapshot()
  expect(body).toContain(`<meta property="og:title" content="${pool.name} on Uniswap" data-rh="true">`)
  expect(body).not.toContain(`<meta property="og:description"`)
  expect(body).not.toContain(`<meta name="description"`)
  expect(body).toContain(`<meta property="og:image" content="${pool.image}" data-rh="true">`)
  expect(body).toContain(`<meta property="og:image:width" content="1200" data-rh="true">`)
  expect(body).toContain(`<meta property="og:image:height" content="630" data-rh="true">`)
  expect(body).toContain(`<meta property="og:type" content="website" data-rh="true">`)
  expect(body).toContain(`<meta property="og:url" content="${url}" data-rh="true">`)
  expect(body).toContain(`<meta property="og:image:alt" content="${pool.name} on Uniswap" data-rh="true">`)
  expect(body).toContain(`<meta property="twitter:card" content="summary_large_image" data-rh="true">`)
  expect(body).toContain(`<meta property="twitter:title" content="${pool.name} on Uniswap" data-rh="true">`)
  expect(body).toContain(`<meta property="twitter:image" content="${pool.image}" data-rh="true">`)
  expect(body).toContain(`<meta property="twitter:image:alt" content="${pool.name} on Uniswap" data-rh="true">`)
})

const invalidPools = [
  'http://localhost:3000/explore/pools/ethereum/0xa0b869',
  'http://localhost:3000/explore/pools/invalidnetwork',
  'http://localhost:3000/explore/pools/optimism/0x0',
]

test.each(invalidPools)('should not inject metadata for invalid pools', async (url) => {
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
