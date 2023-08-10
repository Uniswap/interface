const collectionImageUrl = [
  'http://127.0.0.1:3000/api/image/nfts/collection/0xed5af388653567af2f388e6224dc7c4b3241c544',
  'http://127.0.0.1:3000/api/image/nfts/collection/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
  'http://127.0.0.1:3000/api/image/nfts/collection/0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b',
]

test.each(collectionImageUrl)('collectionImageUrl', async (url) => {
  const response = await fetch(new Request(url))
  expect(response.status).toBe(200)
  expect(response.headers.get('content-type')).toBe('image/png')
})

const invalidCollectionImageUrl = [
  'http://127.0.0.1:3000/api/image/nfts/collection/0xed5af388653567af2f388e6224dc7c4b3241c545',
]

test.each(invalidCollectionImageUrl)('invalidAssetImageUrl', async (url) => {
  const response = await fetch(new Request(url))
  expect(response.status).toBe(404)
})
