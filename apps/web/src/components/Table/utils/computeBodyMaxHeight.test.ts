import { computeBodyMaxHeight } from '~/components/Table/utils/computeBodyMaxHeight'

describe('computeBodyMaxHeight', () => {
  it('fits whole rows plus the gaps between them', () => {
    expect(computeBodyMaxHeight({ bodyHeight: 300, itemHeight: 64, rowGap: 2 })).toBe(4 * 64 + 3 * 2)
    expect(computeBodyMaxHeight({ bodyHeight: 300, itemHeight: 64, rowGap: 4 })).toBe(4 * 64 + 3 * 4)
  })

  it('counts no gap when the rows have none', () => {
    expect(computeBodyMaxHeight({ bodyHeight: 300, itemHeight: 64, rowGap: 0 })).toBe(256)
  })

  it('returns the body height without a row height', () => {
    expect(computeBodyMaxHeight({ bodyHeight: 300, itemHeight: undefined, rowGap: 4 })).toBe(300)
  })
})
