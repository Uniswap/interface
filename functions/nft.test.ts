/* eslint-disable */
const waitPort = require('wait-port')

const params = {
  port: 3001,
  host: 'localhost',
}

beforeAll(async () => {
  await waitPort(params)
}, 60000)

test('should inject metadata for valid nft', async () => {
  const req = new Request('http://127.0.0.1:3000/nfts/asset/0xed5af388653567af2f388e6224dc7c4b3241c544/2550')
  const res = await fetch(req)
  const body = await res.text()
  expect(body).toMatchSnapshot()
  expect(body).toMatch('og:title')
  expect(body).toMatch('Azuki #2550')
  expect(body).toMatch('og:image')
  expect(body).toMatch(
    'https://cdn.center.app/1/0xED5AF388653567Af2F388E6224dC7C4b3241C544/2550/d268b7f60a56306ced68b9762709ceaff4f1ee939f3150e7363fae300a59da12.png'
  )
  expect(body).toMatch('og:url')
  expect(body).toMatch('http://127.0.0.1:3000/nfts/asset/0xed5af388653567af2f388e6224dc7c4b3241c544/2550')
  expect(body).toMatch('twitter:image')
})

test('should not inject metadata for invalid nft', async () => {
  const req = new Request('http://127.0.0.1:3000/nfts/asset/0xed5af388653567af2f388e6224dc7c4b3241c544/100000')
  const res = await fetch(req)
  const body = await res.text()
  expect(body).toMatchSnapshot()
  expect(body).not.toMatch('og:title')
  expect(body).not.toMatch('og:image')
  expect(body).not.toMatch('og:url')
  expect(body).not.toMatch('twitter:image')
})

test('should not inject metadata for only collection', async () => {
  const req = new Request('http://127.0.0.1:3000/nfts/asset/0xed5af388653567af2f388e6224dc7c4b3241c544')
  const res = await fetch(req)
  const body = await res.text()
  expect(body).toMatchSnapshot()
  expect(body).not.toMatch('og:title')
  expect(body).not.toMatch('og:image')
  expect(body).not.toMatch('og:url')
  expect(body).not.toMatch('twitter:image')
})

test('should not inject metadata for invalid collection', async () => {
  const req = new Request('http://127.0.0.1:3000/nfts/asset/0xed5af388653567af2f388e6224dc7c4b3241c545')
  const res = await fetch(req)
  const body = await res.text()
  expect(body).toMatchSnapshot()
  expect(body).not.toMatch('og:title')
  expect(body).not.toMatch('og:image')
  expect(body).not.toMatch('og:url')
  expect(body).not.toMatch('twitter:image')
})
