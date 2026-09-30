import { TokenCategory, TokenCategoryClass } from 'uniswap/src/features/tokenCategories/types'
import { faker } from 'uniswap/src/test/shared'
import { createFixture } from 'uniswap/src/test/utils/factory'

export const tokenCategory = createFixture<TokenCategory>()(() => ({
  id: faker.datatype.uuid(),
  name: 'DeFi',
  description: faker.lorem.sentence(),
  categoryClass: TokenCategoryClass.Sector,
  grouped: false,
  topTokens: [],
}))
