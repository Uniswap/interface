const assets = [
  {
    address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
    assetId: '3735',
    collectionName: 'Bored Ape Yacht Club',
    image: 'http://127.0.0.1:3000/api/image/nfts/asset/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d/3735',
    description:
      'The Bored Ape Yacht Club is a collection of 10,000 unique Bored Ape NFTs— unique digital collectibles living on the Ethereum blockchain. Your Bored Ape doubles as your Yacht Club membership card, and grants access to members-only benefits, the first of which is access to THE BATHROOM, a collaborative graffiti board',
  },
  {
    address: '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb',
    assetId: '3947',
    collectionName: 'CryptoPunk',
    image: 'http://127.0.0.1:3000/api/image/nfts/asset/0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb/3947',
    description:
      'CryptoPunks launched as a fixed set of 10,000 items in mid-2017 and became one of the inspirations for the ERC-721 standard. They have been featured in places like The New York Times, Christie’s of London, Art|Basel Miami, and The PBS NewsHour.',
  },
]

test.each(assets)('should inject metadata for valid assets', async (nft) => {
  const url = 'http://127.0.0.1:3000/nfts/asset/' + nft.address + '/' + nft.assetId
  const body = await fetch(new Request(url)).then((res) => res.text())
  expect(body).toMatchSnapshot()
  expect(body).toContain(`<meta property="og:title" content="${nft.collectionName} #${nft.assetId}"/>`)
  expect(body).toContain(`<meta property="og:description" content="${nft.description}"/>`)
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

test.each(invalidAssets)('should not inject metadata for invalid asset calls', async (url) => {
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
