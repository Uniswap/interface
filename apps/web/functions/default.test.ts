const defaultUrls = ['http://localhost:3000/', 'http://localhost:3000/swap', 'http://localhost:3000/pool']

test.each(defaultUrls)('should inject metadata for valid collections', async (defaultUrl) => {
  const body = await fetch(new Request(defaultUrl)).then((res) => res.text())
  expect(body).toContain(`<meta property="og:title" content="Uniswap Interface"`)
  expect(body).toContain(
    `<meta property="og:description" content="Swap crypto on Ethereum, Base, Arbitrum, Polygon, Unichain and more. The DeFi platform trusted by millions."`,
  )
  expect(body).toContain(
    `<meta name="description" content="Swap crypto on Ethereum, Base, Arbitrum, Polygon, Unichain and more. The DeFi platform trusted by millions."`,
  )
  expect(body).toContain(
    `<meta property="og:image" content="http://localhost:3000/images/1200x630_Rich_Link_Preview_Image.png"`,
  )
  expect(body).toContain(`<meta property="og:image:width" content="1200"`)
  expect(body).toContain(`<meta property="og:image:height" content="630"`)
  expect(body).toContain(`<meta property="og:type" content="website"`)
  expect(body).toContain(`<meta property="og:image:alt" content="Uniswap Interface"`)
  expect(body).toContain(`<meta property="twitter:card" content="summary_large_image"`)
  expect(body).toContain(`<meta property="twitter:title" content="Uniswap Interface"`)
  expect(body).toContain(
    `<meta property="twitter:image" content="http://localhost:3000/images/1200x630_Rich_Link_Preview_Image.png"`,
  )
  expect(body).toContain(`<meta property="twitter:image:alt" content="Uniswap Interface"`)
})
