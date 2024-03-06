import { Chain, Image } from 'wallet/src/data/__generated__/types-and-hooks'
import { faker } from 'wallet/src/test/shared'
import { createFixture } from 'wallet/src/test/utils'

export const GQL_CHAINS = [
  Chain.Ethereum,
  Chain.Arbitrum,
  Chain.EthereumGoerli,
  Chain.Optimism,
  Chain.Polygon,
  Chain.Base,
  Chain.Bnb,
]

export const image = createFixture<Image>()(() => ({
  __typename: 'Image',
  id: faker.datatype.uuid(),
  url: faker.image.imageUrl(),
}))
