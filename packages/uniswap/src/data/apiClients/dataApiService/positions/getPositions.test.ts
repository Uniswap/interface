import { withPermissionedOptIn } from 'uniswap/src/data/apiClients/dataApiService/positions/getPositions'

describe(withPermissionedOptIn, () => {
  it('sets the includePermissioned opt-in from the flag value', () => {
    const address = '0x1234567890123456789012345678901234567890'
    expect(withPermissionedOptIn({ address }, true).includePermissioned).toBe(true)
    expect(withPermissionedOptIn({ address }, false).includePermissioned).toBe(false)
  })

  it('should preserve all caller-provided fields', () => {
    const input = {
      address: '0x1234567890123456789012345678901234567890',
      chainIds: [1, 130],
      pageSize: 25,
      includeHidden: true,
    }
    const result = withPermissionedOptIn(input, true)
    expect(result).toMatchObject(input)
  })
})
