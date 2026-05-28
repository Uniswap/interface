import { isMultichainProjectTokens } from 'uniswap/src/features/dataApi/tokenProjects/utils/isMultichainProjectTokens'

describe(isMultichainProjectTokens, () => {
  it('returns false for undefined, null, empty, or single deployment', () => {
    expect(isMultichainProjectTokens(undefined)).toBe(false)
    expect(isMultichainProjectTokens(null)).toBe(false)
    expect(isMultichainProjectTokens([])).toBe(false)
    expect(isMultichainProjectTokens([{}])).toBe(false)
  })

  it('returns true when more than one deployment', () => {
    expect(isMultichainProjectTokens([{}, {}])).toBe(true)
    expect(isMultichainProjectTokens([{}, {}, {}])).toBe(true)
  })
})
