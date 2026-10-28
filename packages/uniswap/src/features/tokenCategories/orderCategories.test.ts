import { orderCategories } from 'uniswap/src/features/tokenCategories/orderCategories'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'

describe(orderCategories, () => {
  const defi = tokenCategory({ id: 'id-defi', name: 'DeFi' })
  const gaming = tokenCategory({ id: 'id-gaming', name: 'Gaming' })
  const agents = tokenCategory({ id: 'id-agents', name: 'Agents' })
  const categories = [defi, gaming, agents]

  it('keeps server order when no config order is set', () => {
    expect(orderCategories({ categories, orderedCategoryIds: [] })).toEqual([defi, gaming, agents])
  })

  it('pins configured categories first in config order, then the rest in server order', () => {
    expect(orderCategories({ categories, orderedCategoryIds: ['id-agents', 'id-gaming'] })).toEqual([
      agents,
      gaming,
      defi,
    ])
  })

  it('ignores config ids that are not in the category list', () => {
    expect(orderCategories({ categories, orderedCategoryIds: ['id-unknown', 'id-gaming'] })).toEqual([
      gaming,
      defi,
      agents,
    ])
  })
})
