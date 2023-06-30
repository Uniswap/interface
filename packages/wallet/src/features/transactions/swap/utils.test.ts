import { serializeQueryParams } from './utils'

describe(serializeQueryParams, () => {
  it('handles the correct types', () => {
    expect(
      serializeQueryParams({ a: '0x6B175474E89094C44Da98b954EedeAC495271d0F', b: 2, c: false })
    ).toBe('a=0x6B175474E89094C44Da98b954EedeAC495271d0F&b=2&c=false')
  })

  it('escapes characters', () => {
    expect(serializeQueryParams({ space: ' ', bang: '!' })).toEqual('space=%20&bang=!')
  })
})
