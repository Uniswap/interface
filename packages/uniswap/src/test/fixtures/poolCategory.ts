import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { PoolCategory, PoolCategoryTopPool, TokenCategoryClass } from 'uniswap/src/features/tokenCategories/types'
import { faker } from 'uniswap/src/test/shared'
import { createFixture } from 'uniswap/src/test/utils/factory'

export const poolCategoryTopPool = createFixture<PoolCategoryTopPool>()(() => ({
  chainId: 1,
  poolId: faker.finance.ethereumAddress(),
  token0Symbol: 'ETH',
  token0LogoUrl: faker.image.imageUrl(),
  token1Symbol: 'USDC',
  token1LogoUrl: faker.image.imageUrl(),
  protocolVersion: ProtocolVersion.V3,
  feeTier: 3000,
}))

export const poolCategory = createFixture<PoolCategory>()(() => ({
  id: faker.datatype.uuid(),
  kind: 'pool',
  name: 'Majors',
  englishName: 'Majors',
  description: faker.lorem.sentence(),
  categoryClass: TokenCategoryClass.Asset,
  topPools: [],
}))
