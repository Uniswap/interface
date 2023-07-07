const collections = [
  {
    address: '0xed5af388653567af2f388e6224dc7c4b3241c544',
    collectionName: 'Azuki',
    image: 'http://127.0.0.1:3000/api/image/nfts/collection/0xed5af388653567af2f388e6224dc7c4b3241c544',
  },
  {
    address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
    collectionName: 'Bored Ape Yacht Club',
    image: 'http://127.0.0.1:3000/api/image/nfts/collection/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
  },
  {
    address: '0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b',
    collectionName: 'CLONE X - X TAKASHI MURAKAMI',
    image: 'http://127.0.0.1:3000/api/image/nfts/collection/0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b',
  },
]

test('should inject metadata for valid nfts', async () => {
  for (const nft of collections) {
    const url = 'http://127.0.0.1:3000/nfts/collection/' + nft.address
    const req = new Request(url)
    const res = await fetch(req)
    const body = await res.text()
    expect(body).toMatchSnapshot()
    expect(body).toContain(nft.collectionName + ' on Uniswap')
    expect(body).toContain(nft.image)
    expect(body).toContain(url)
    expect(body).toContain(`<meta property="og:title" content = "${nft.collectionName} on Uniswap"/>`)
    expect(body).toContain(`<meta property="og:image" content = "${nft.image}"/>`)
    expect(body).toContain(`<meta property="og:image:width" content = "1200"/>`)
    expect(body).toContain(`<meta property="og:image:height" content = "630"/>`)
    expect(body).toContain(`<meta property="og:type" content = "website"/>`)
    expect(body).toContain(`<meta property="og:url" content = "${url}"/>`)
    expect(body).toContain(
      `<meta property="og:image:alt" content = "https://app.uniswap.org/images/512x512_App_Icon.png"/>`
    )
    expect(body).toContain(`<meta property="twitter:card" content = "summary_large_image"/>`)
    expect(body).toContain(`<meta property="twitter:title" content = "${nft.collectionName} on Uniswap"/>`)
    expect(body).toContain(`<meta property="twitter:image" content = "${nft.image}"/>`)
    expect(body).toContain(
      `<meta property="twitter:image:alt" content = "https://app.uniswap.org/images/512x512_App_Icon.png"/>`
    )
  }
}, 50000)

test('should not inject metadata for invalid calls', async () => {
  const baseReq = new Request('http://127.0.0.1:3000/nfts/collection/0xed5af388653567af2f388e6224dc7c4b3241c545')
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
    'http://127.0.0.1:3000/nfts/collection/0xed5af388653567af2f388e6224dc7c4b3241c545/10',
    'http://127.0.0.1:3000/nfts/collection/0xed5af388653567af2f388e6224dc7c4b3241c545//',
    'http://127.0.0.1:3000/nfts/collection',
  ]
  for (const url of urls) {
    const req = new Request(url)
    const res = await fetch(req)
    const body = await res.text()
    expect(body).toEqual(baseBody)
  }
}, 50000)

test('api should not return a valid response', async () => {
  const url = 'http://127.0.0.1:3000/api/image/nfts/collection/0xed5af388653567af2f388e6224dc7c4b3241c545'
  const req = new Request(url)
  const res = await fetch(req)
  expect([404, 500]).toContain(res.status)
}, 50000)
