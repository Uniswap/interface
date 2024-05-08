import { DappInfoUwULink, DappInfoWC } from 'wallet/src/features/walletConnect/types'
import { faker } from 'wallet/src/test/shared'
import { createFixture } from 'wallet/src/test/utils'

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
