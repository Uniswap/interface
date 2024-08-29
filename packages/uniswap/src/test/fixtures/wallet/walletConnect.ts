import { faker } from 'uniswap/src/test/shared'
import { createFixture } from 'uniswap/src/test/utils'
import { DappInfoUwULink, DappInfoWC } from 'uniswap/src/types/walletConnect'

export const dappInfoWC = createFixture<DappInfoWC>()(() => ({
  source: 'walletconnect',
  name: faker.lorem.words(),
  url: faker.internet.url(),
  icon: faker.image.imageUrl(),
}))

export const dappInfoUwULink = createFixture<DappInfoUwULink>()(() => ({
  source: 'uwulink',
  name: faker.lorem.words(),
  url: faker.internet.url(),
  icon: faker.image.imageUrl(),
  chain_id: faker.datatype.number(),
}))
