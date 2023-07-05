/* eslint-disable */
const waitPort = require('wait-port')

const params = {
  port: 3001,
  host: 'localhost',
}

beforeAll(async () => {
  await waitPort(params)
}, 60000)

const assets = [
  {
    address: '0xed5af388653567af2f388e6224dc7c4b3241c544',
    assetId: '2550',
    collectionName: 'Azuki',
    image: 'https://cdn.center.app/1/0xED5AF388653567Af2F388E6224dC7C4b3241C544/2550/d268b7f60a56306ced68b9762709ceaff4f1ee939f3150e7363fae300a59da12.png'
  },
  {
    address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
    assetId: '3735',
    collectionName: 'Bored Ape Yacht Club',
    image: 'https://cdn.center.app/v2/1/697f69bb495aaa24c66638cae921977354f0b8274fc2e2814e455f355e67f01d/88c2ac6b73288e41051d3fd58ff3cef1f4908403f05f4a7d2a8435d003758529.png'
  },
  {
    address: '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb',
    assetId: '3947',
    collectionName: 'CryptoPunk',
    image: 'https://cdn.center.app/1/0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB/3947/62319d784e7a816d190aa184ffe58550d6ed8eb2e117b218e2ac02f126538ee6.png'
  }
]

test('should inject metadata for valid nfts', async () => {
  for (const nft of assets) {
    const url = 'http://127.0.0.1:3000/nfts/asset/' + nft.address + '/' + nft.assetId
    const req = new Request(url)
    const res = await fetch(req)
    const body = await res.text()
    expect(body).toMatchSnapshot()
    expect(body).toContain(nft.collectionName + ' #' + nft.assetId)
    expect(body).toContain(nft.image)
    expect(body).toContain(url)
    expect(body).toContain(`<meta property="og:title" content = "${nft.collectionName} #${nft.assetId}"/>`)
    expect(body).toContain(`<meta property="og:image" content = "${nft.image}"/>`)
    expect(body).toContain(`<meta property="og:image:width" content = "1200"/>`)
    expect(body).toContain(`<meta property="og:image:height" content = "630"/>`)
    expect(body).toContain(`<meta property="og:type" content = "website"/>`)
    expect(body).toContain(`<meta property="og:url" content = "${url}"/>`)
    expect(body).toContain(`<meta property="og:image:alt" content = "https://app.uniswap.org/images/512x512_App_Icon.png"/>`)
    expect(body).toContain(`<meta property="twitter:card" content = "summary_large_image"/>`)
    expect(body).toContain(`<meta property="twitter:title" content = "${nft.collectionName} #${nft.assetId}"/>`)
    expect(body).toContain(`<meta property="twitter:image" content = "${nft.image}"/>`)
    expect(body).toContain(`<meta property="twitter:image:alt" content = "https://app.uniswap.org/images/512x512_App_Icon.png"/>`)
  }
})

test('should not inject metadata for invalid calls', async () => {
  const baseReq = new Request('http://127.0.0.1:3000/nfts/asset/0xed5af388653567af2f388e6224dc7c4b3241c544/100000')
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
    'http://127.0.0.1:3000/nfts/asset/0xed5af388653567af2f388e6224dc7c4b3241c544',
    'http://127.0.0.1:3000/nfts/asset/0xed5af388653567af2f388e6224dc7c4b3241c545',
    'http://127.0.0.1:3000/nfts/asset/0xed5af388653567af2f388e6224dc7c4b3241c544/-1',
    'http://127.0.0.1:3000/nfts/asset/0xed5af388653567af2f388e6224dc7c4b3241c544//',
    'http://127.0.0.1:3000/nfts/asset/0xed5af388653567af2f388e6224dc7c4b3241c544//2550'
  ]
  for (const url of urls) {
    const req = new Request(url)
    const res = await fetch(req)
    const body = await res.text()
    expect(body).toEqual(baseBody)
  }
})

test('api should not return a valid response', async () => {
  const invalidUrls = [
    '0xed5af388653567af2f388e6224dc7c4b3241c545',
    '0xed5af388653567af2f388e6224dc7c4b3241c545/',
    '0xed5af388653567af2f388e6224dc7c4b3241c545/0',
    '0xed5af388653567af2f388e6224dc7c4b3241c544/100000',
    '0xed5af388653567af2f388e6224dc7c4b3241c544',
  ]
  for(const urls of invalidUrls) {
    const url = 'http://127.0.0.1:3000/api/image/nfts/asset/' + urls
    const req = new Request(url)
    const res = await fetch(req)
    expect([404, 500]).toContain(res.status)
  }
})