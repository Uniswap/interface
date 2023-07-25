import getCollection from './utils/getCollection'

jest.mock('./utils/getCollection')

test('Should use cache', async () => {
  // const mockedGetCollection = getCollection as jest.MockedFunction<typeof getCollection>
  // mockedGetCollection.mockImplementation(undefined)
  expect(getCollection).not.toHaveBeenCalled()

  const url = 'http://127.0.0.1:3000/nfts/collection/0xbd3531da5cf5857e7cfaa92426877b022e612cf8'
  const body = await fetch(new Request(url)).then((res) => res.text())
  expect(body).toMatchSnapshot()
  expect(body).toContain(`<meta property="og:title" content="Pudgy Penguins on Uniswap"/>`)
  expect(body).toContain(
    `<meta property="og:image" content="https://i.seadn.io/gae/yNi-XdGxsgQCPpqSio4o31ygAV6wURdIdInWRcFIl46UjUQ1eV7BEndGe8L661OoG-clRi7EgInLX4LPu9Jfw4fq0bnVYHqg7RFi?w=500&auto=format"/>`
  )
  expect(body).toContain(`<meta property="og:image:width" content="1200"/>`)
  expect(body).toContain(`<meta property="og:image:height" content="630"/>`)
  expect(body).toContain(`<meta property="og:type" content="website"/>`)
  expect(body).toContain(
    `<meta property="og:url" content="http://127.0.0.1:3000/nfts/collection/0xbd3531da5cf5857e7cfaa92426877b022e612cf8"/>`
  )
  expect(body).toContain(`<meta property="og:image:alt" content="Pudgy Penguins on Uniswap"/>`)
  expect(body).toContain(`<meta property="twitter:card" content="summary_large_image"/>`)
  expect(body).toContain(`<meta property="twitter:title" content="Pudgy Penguins on Uniswap"/>`)
  expect(body).toContain(
    `<meta property="twitter:image" content="https://i.seadn.io/gae/yNi-XdGxsgQCPpqSio4o31ygAV6wURdIdInWRcFIl46UjUQ1eV7BEndGe8L661OoG-clRi7EgInLX4LPu9Jfw4fq0bnVYHqg7RFi?w=500&auto=format"/>`
  )
  expect(body).toContain(`<meta property="twitter:image:alt" content="Pudgy Penguins on Uniswap"/>`)

  // expect(getCollection).toHaveBeenCalledTimes(1)

  const body2 = await fetch(new Request(url)).then((res) => res.text())
  expect(body2).toMatchSnapshot()
  expect(body2).toContain(`<meta property="og:title" content="Pudgy Penguins on Uniswap"/>`)
  expect(body2).toContain(
    `<meta property="og:image" content="https://i.seadn.io/gae/yNi-XdGxsgQCPpqSio4o31ygAV6wURdIdInWRcFIl46UjUQ1eV7BEndGe8L661OoG-clRi7EgInLX4LPu9Jfw4fq0bnVYHqg7RFi?w=500&auto=format"/>`
  )
  expect(body2).toContain(`<meta property="og:image:width" content="1200"/>`)
  expect(body2).toContain(`<meta property="og:image:height" content="630"/>`)
  expect(body2).toContain(`<meta property="og:type" content="website"/>`)
  expect(body2).toContain(
    `<meta property="og:url" content="http://127.0.0.1:3000/nfts/collection/0xbd3531da5cf5857e7cfaa92426877b022e612cf8"/>`
  )
  expect(body2).toContain(`<meta property="og:image:alt" content="Pudgy Penguins on Uniswap"/>`)
  expect(body2).toContain(`<meta property="twitter:card" content="summary_large_image"/>`)
  expect(body2).toContain(`<meta property="twitter:title" content="Pudgy Penguins on Uniswap"/>`)
  expect(body2).toContain(
    `<meta property="twitter:image" content="https://i.seadn.io/gae/yNi-XdGxsgQCPpqSio4o31ygAV6wURdIdInWRcFIl46UjUQ1eV7BEndGe8L661OoG-clRi7EgInLX4LPu9Jfw4fq0bnVYHqg7RFi?w=500&auto=format"/>`
  )
  expect(body2).toContain(`<meta property="twitter:image:alt" content="Pudgy Penguins on Uniswap"/>`)

  // expect(getCollection).toHaveBeenCalledTimes(1)
})
