const collections = [
  {
    address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
    collectionName: 'Bored Ape Yacht Club',
    image: 'http://127.0.0.1:3000/api/image/nfts/collection/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
    description:
      'The Bored Ape Yacht Club is a collection of 10,000 unique Bored Ape NFTs— unique digital collectibles living on the Ethereum blockchain. Your Bored Ape doubles as your Yacht Club membership card, and grants access to members-only benefits, the first of which is access to THE BATHROOM, a collaborative graffiti board',
  },
  {
    address: '0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b',
    collectionName: 'CLONE X - X TAKASHI MURAKAMI',
    image: 'http://127.0.0.1:3000/api/image/nfts/collection/0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b',
    description: '🧬 CLONE X 🧬20,000 next-gen Avatars, by RTFKT and Takashi Murakami 🌸',
  },
]

test.each(collections)('should inject metadata for valid collections', async (collection) => {
  const url = 'http://127.0.0.1:3000/nfts/collection/' + collection.address
  const body = await fetch(new Request(url)).then((res) => res.text())
  expect(body).toMatchSnapshot()
  expect(body).toContain(`<meta property="og:title" content="${collection.collectionName} on Uniswap"/>`)
  expect(body).toContain(`<meta property="og:description" content="${collection.description}"/>`)
  expect(body).toContain(`<meta property="og:image" content="${collection.image}"/>`)
  expect(body).toContain(`<meta property="og:image:width" content="1200"/>`)
  expect(body).toContain(`<meta property="og:image:height" content="630"/>`)
  expect(body).toContain(`<meta property="og:type" content="website"/>`)
  expect(body).toContain(`<meta property="og:url" content="${url}"/>`)
  expect(body).toContain(`<meta property="og:image:alt" content="${collection.collectionName} on Uniswap"/>`)
  expect(body).toContain(`<meta property="twitter:card" content="summary_large_image"/>`)
  expect(body).toContain(`<meta property="twitter:title" content="${collection.collectionName} on Uniswap"/>`)
  expect(body).toContain(`<meta property="twitter:image" content="${collection.image}"/>`)
  expect(body).toContain(`<meta property="twitter:image:alt" content="${collection.collectionName} on Uniswap"/>`)
})

const invalidCollections = [
  'http://127.0.0.1:3000/nfts/collection/0xed5af388653567af2f388e6224dc7c4b3241c545',
  'http://127.0.0.1:3000/nfts/collection/0xed5af388653567af2f388e6224dc7c4b3241c545//',
]

test.each(invalidCollections)(
  'should not inject metadata for invalid collection urls',
  async (url) => {
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
  },
  50000
)
