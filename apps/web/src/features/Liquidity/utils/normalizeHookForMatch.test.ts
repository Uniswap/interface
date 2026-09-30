import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { normalizeHookForMatch } from '~/features/Liquidity/utils/normalizeHookForMatch'

describe('normalizeHookForMatch', () => {
  it.each([undefined, null, '', ZERO_ADDRESS])('treats %s as no hook', (hook) => {
    expect(normalizeHookForMatch(hook)).toBeUndefined()
  })

  it('lowercases a real hook so checksummed and lowercase spellings match', () => {
    expect(normalizeHookForMatch('0x09DEA99D714A3a19378e3D80D1ad22Ca46085080')).toBe(
      '0x09dea99d714a3a19378e3d80d1ad22ca46085080',
    )
  })
})
