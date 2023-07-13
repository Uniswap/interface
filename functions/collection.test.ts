const collections = [
  {
    address: '0xed5af388653567af2f388e6224dc7c4b3241c544',
    collectionName: 'Azuki',
    image:
      'https://i.seadn.io/gae/H8jOCJuQokNqGBpkBN5wk1oZwO7LM8bNnrHCaekV2nKjnCqw6UB5oaH8XyNeBDj6bA_n1mjejzhFQUP3O1NfjFLHr3FOaeHcTOOT?w=500&auto=format',
  },
  {
    address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
    collectionName: 'Bored Ape Yacht Club',
    image:
      'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB?w=500&auto=format',
  },
  {
    address: '0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b',
    collectionName: 'CLONE X - X TAKASHI MURAKAMI',
    image:
      'https://i.seadn.io/gae/XN0XuD8Uh3jyRWNtPTFeXJg_ht8m5ofDx6aHklOiy4amhFuWUa0JaR6It49AH8tlnYS386Q0TW_-Lmedn0UET_ko1a3CbJGeu5iHMg?w=500&auto=format',
  },
]

test.each(collections)('should inject metadata for valid collections', async (collection) => {
  const url = 'http://127.0.0.1:3000/nfts/collection/' + collection.address
  const body = await fetch(new Request(url)).then((res) => res.text())
  expect(body).toMatchSnapshot()
  expect(body).toContain(`<meta property="og:title" content="${collection.collectionName} on Uniswap"/>`)
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
  'http://127.0.0.1:3000/nfts/collection/0xed5af388653567af2f388e6224dc7c4b3241c545/10',
  'http://127.0.0.1:3000/nfts/collection/0xed5af388653567af2f388e6224dc7c4b3241c545//',
  'http://127.0.0.1:3000/nfts/collection',
]

test.each(invalidCollections)(
  'should not inject metadata for invalid urls',
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
