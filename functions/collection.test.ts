/* eslint-disable */
const waitPort = require('wait-port')

const params = {
  port: 3001,
  host: 'localhost',
}

beforeAll(async () => {
  await waitPort(params)
}, 60000)

test('should inject metadata for valid nfts', async () => {
  const nfts = [
    {
      address: '0xed5af388653567af2f388e6224dc7c4b3241c544',
      collectionName: 'Azuki',
      image: 'https://i.seadn.io/gae/H8jOCJuQokNqGBpkBN5wk1oZwO7LM8bNnrHCaekV2nKjnCqw6UB5oaH8XyNeBDj6bA_n1mjejzhFQUP3O1NfjFLHr3FOaeHcTOOT?w=500&auto=format'
    },
    {
      address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
      collectionName: 'Bored Ape Yacht Club',
      image: 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB?w=500&auto=format' 
    },
    {
      address: '0x8c3c0274c33f263f0a55d129cfc8eaa3667a9e8b',
      collectionName: 'Ethscriptions',
      image: 'https://i.seadn.io/gcs/files/e3441e0de76b2e98d88565a373bb18e4.png?w=500&auto=format'
    }
  ]
  for (const nft of nfts) {
    const url = 'http://127.0.0.1:3000/nfts/collection/' + nft.address
    const req = new Request(url)
    const res = await fetch(req)
    const body = await res.text()
    expect(body).toMatchSnapshot()
    expect(body).toMatch(nft.collectionName + ' on Uniswap')
    expect(body).toMatch(nft.image)
    expect(body).toMatch(url)
    expect(body).toMatch('og:title')
    expect(body).toMatch('og:image')
    expect(body).toMatch('og:image:width')
    expect(body).toMatch('og:image:height')
    expect(body).toMatch('og:type')
    expect(body).toMatch('og:url')
    expect(body).toMatch('og:image:alt')
    expect(body).toMatch('twitter:card')
    expect(body).toMatch('twitter:title')
    expect(body).toMatch('twitter:image')
  }
})

test('should not inject metadata for invalid calls', async () => {
  const baseReq = new Request('http://127.0.0.1:3000/nfts/collection/0xed5af388653567af2f388e6224dc7c4b3241c545')
  const baseRes = await fetch(baseReq)
  const baseBody = await baseRes.text()
  expect(baseBody).toMatchSnapshot()
  expect(baseBody).not.toMatch('og:title')
  expect(baseBody).not.toMatch('og:image')
  expect(baseBody).not.toMatch('og:image:width')
  expect(baseBody).not.toMatch('og:image:height')
  expect(baseBody).not.toMatch('og:type')
  expect(baseBody).not.toMatch('og:url')
  expect(baseBody).not.toMatch('og:image:alt')
  expect(baseBody).not.toMatch('twitter:card')
  expect(baseBody).not.toMatch('twitter:title')
  expect(baseBody).not.toMatch('twitter:image')
  const urls = [
    'http://127.0.0.1:3000/nfts/collection/0xed5af388653567af2f388e6224dc7c4b3241c545/10',
    'http://127.0.0.1:3000/nfts/collection/0xed5af388653567af2f388e6224dc7c4b3241c545//',
    'http://127.0.0.1:3000/nfts/collection'
  ]
  for (const url of urls) {
    const req = new Request(url)
    const res = await fetch(req)
    const body = await res.text()
    expect(body).toEqual(baseBody)
  }
})