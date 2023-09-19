const assetImageUrl = [
  'http://127.0.0.1:3000/api/image/nfts/asset/0xed5af388653567af2f388e6224dc7c4b3241c544/804',
  'http://127.0.0.1:3000/api/image/nfts/asset/0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb/3947',
]

test.each(assetImageUrl)('assetImageUrl', async (url) => {
  const response = await fetch(new Request(url))
  expect(response.status).toBe(200)
  expect(response.headers.get('content-type')).toBe('image/png')
})

const invalidAssetImageUrl = [
  'http://127.0.0.1:3000/api/image/nfts/asset/0xed5af388653567af2f388e6224dc7c4b3241c544/10001',
  'http://127.0.0.1:3000/api/image/nfts/asset/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d/44700',
]

test.each(invalidAssetImageUrl)('invalidAssetImageUrl', async (url) => {
  const response = await fetch(new Request(url))
  expect(response.status).toBe(404)
})

const blockedAssetImageUrl = [
  'http://127.0.0.1:3000/api/image/nfts/asset/0xd4d871419714b778ebec2e22c7c53572b573706e/276',
]

test.each(blockedAssetImageUrl)('blockedAssetImageUrl', async (url) => {
  const response = await fetch(new Request(url))
  expect(response.status).toBe(404)
})
