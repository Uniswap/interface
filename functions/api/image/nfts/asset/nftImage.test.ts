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
  'http://127.0.0.1:3000/api/image/nfts/asset/0xed5af388653567af2f388e6224dc7c4b3241c544/100000',
  'http://127.0.0.1:3000/api/image/nfts/asset/0xed5af388653567af2f388e6224dc7c4b3241c544',
  'http://127.0.0.1:3000/api/image/nfts/asset/0xed5af388653567af2f388e6224dc7c4b3241c545',
]

test.each(invalidAssetImageUrl)('invalidAssetImageUrl', async (url) => {
  const response = await fetch(new Request(url))
  expect(response.status).toBe(404)
})
