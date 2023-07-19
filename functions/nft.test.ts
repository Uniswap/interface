const assets = [
  {
    address: '0xed5af388653567af2f388e6224dc7c4b3241c544',
    assetId: '2550',
    collectionName: 'Azuki',
    image: 'http://127.0.0.1:3000/api/image/nfts/asset/0xed5af388653567af2f388e6224dc7c4b3241c544/2550',
  },
  {
    address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
    assetId: '3735',
    collectionName: 'Bored Ape Yacht Club',
    image: 'http://127.0.0.1:3000/api/image/nfts/asset/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d/3735',
  },
  {
    address: '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb',
    assetId: '3947',
    collectionName: 'CryptoPunk',
    image: 'http://127.0.0.1:3000/api/image/nfts/asset/0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb/3947',
  },
]

test.each(assets)('should inject metadata for valid assets', async (nft) => {
  const url = 'http://127.0.0.1:3000/nfts/asset/' + nft.address + '/' + nft.assetId
  const body = await fetch(new Request(url)).then((res) => res.text())
  expect(body).toMatchSnapshot()
  expect(body).toContain(`<meta property="og:title" content="${nft.collectionName} #${nft.assetId}"/>`)
  expect(body).toContain(`<meta property="og:image" content="${nft.image}"/>`)
  expect(body).toContain(`<meta property="og:image:width" content="1200"/>`)
  expect(body).toContain(`<meta property="og:image:height" content="630"/>`)
  expect(body).toContain(`<meta property="og:type" content="website"/>`)
  expect(body).toContain(`<meta property="og:url" content="${url}"/>`)
  expect(body).toContain(`<meta property="og:image:alt" content="${nft.collectionName} #${nft.assetId}"/>`)
  expect(body).toContain(`<meta property="twitter:card" content="summary_large_image"/>`)
  expect(body).toContain(`<meta property="twitter:title" content="${nft.collectionName} #${nft.assetId}"/>`)
  expect(body).toContain(`<meta property="twitter:image" content="${nft.image}"/>`)
  expect(body).toContain(`<meta property="twitter:image:alt" content="${nft.collectionName} #${nft.assetId}"/>`)
})

const invalidAssets = [
  'http://127.0.0.1:3000/nfts/asset/0xed5af388653567af2f388e6224dc7c4b3241c544/100000',
  'http://127.0.0.1:3000/nfts/asset/0xed5af388653567af2f388e6224dc7c4b3241c544',
  'http://127.0.0.1:3000/nfts/asset/0xed5af388653567af2f388e6224dc7c4b3241c545',
  'http://127.0.0.1:3000/nfts/asset/0xed5af388653567af2f388e6224dc7c4b3241c544/-1',
  'http://127.0.0.1:3000/nfts/asset/0xed5af388653567af2f388e6224dc7c4b3241c544//',
  'http://127.0.0.1:3000/nfts/asset/0xed5af388653567af2f388e6224dc7c4b3241c544//2550',
]

test.each(invalidAssets)('should not inject metadata for invalid calls', async (url) => {
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
    '0xed5af388653567af2f388e6224dc7c4b3241c545',
    '0xed5af388653567af2f388e6224dc7c4b3241c545/',
    '0xed5af388653567af2f388e6224dc7c4b3241c545/0',
    '0xed5af388653567af2f388e6224dc7c4b3241c544/100000',
    '0xed5af388653567af2f388e6224dc7c4b3241c544',
  ]
  for (const urls of invalidUrls) {
    const url = 'http://127.0.0.1:3000/api/image/nfts/asset/' + urls
    const req = new Request(url)
    const res = await fetch(req)
    expect([404, 500]).toContain(res.status)
  }
}, 50000)
