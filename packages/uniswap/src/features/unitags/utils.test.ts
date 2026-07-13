import { normalizeUnitagUsernameInput } from 'uniswap/src/features/unitags/utils'

describe('normalizeUnitagUsernameInput', () => {
  it('lowercases and trims input', () => {
    expect(normalizeUnitagUsernameInput(' MyName ')).toBe('myname')
  })

  it('returns empty string for whitespace-only input', () => {
    expect(normalizeUnitagUsernameInput('   ')).toBe('')
  })
})
