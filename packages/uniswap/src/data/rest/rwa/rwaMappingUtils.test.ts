import { RwaChainToken } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { mapRwaChainToken } from 'uniswap/src/data/rest/rwa/rwaMappingUtils'

describe('mapRwaChainToken', () => {
  // RWA chain tokens carry no `isNative` flag — RWAs are ERC-20 on every chain. The context-menu code relies on this:
  // RwaIssuerRow hardcodes isNative:false (and drops the `allNative` copy-gate), and RwaMultichainCopyButton hardcodes
  // its Copy `disabled:false`. If the API ever adds `isNative`, this test fails — and those hardcodes must be revisited.
  it('maps a ChainToken with no isNative field', () => {
    const mapped = mapRwaChainToken(new RwaChainToken({ chainId: 1, address: '0x1' }))
    expect('isNative' in mapped).toBe(false)
    expect(mapped).toEqual({ chainId: 1, address: '0x1' })
  })
})
