import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isSelfCallWithData } from 'uniswap/src/features/dappRequests/utils'

describe('isSelfCallWithData', () => {
  const ADDRESS_A = '0x1A34567890123456789012345678901234567890'
  const ADDRESS_A_LOWER_CASE = '0x1a34567890123456789012345678901234567890'
  const ADDRESS_B = '0x0987654321098765432109876543210987654321'
  const DATA_WITH_CONTENT = '0xabcdef'
  const EMPTY_DATA = '0x'

  const testCases = [
    {
      name: 'should return true when from equals to and data is present',
      from: ADDRESS_A,
      to: ADDRESS_A,
      data: DATA_WITH_CONTENT,
      expected: true,
    },
    {
      name: 'should return true when from and to are the same address but different case',
      from: ADDRESS_A,
      to: ADDRESS_A_LOWER_CASE,
      data: DATA_WITH_CONTENT,
      expected: true,
    },
    {
      name: 'should return false when from equals to but data is 0x',
      from: ADDRESS_A,
      to: ADDRESS_A,
      data: EMPTY_DATA,
      expected: false,
    },
    {
      name: 'should return false when from equals to but data is undefined',
      from: ADDRESS_A,
      to: ADDRESS_A,
      data: undefined,
      expected: false,
    },
    {
      name: 'should return false when from does not equal to even with data',
      from: ADDRESS_A,
      to: ADDRESS_B,
      data: DATA_WITH_CONTENT,
      expected: false,
    },
    {
      name: 'should return false when from is undefined',
      from: undefined,
      to: ADDRESS_A,
      data: DATA_WITH_CONTENT,
      expected: false,
    },
    {
      name: 'should return false when to is undefined',
      from: ADDRESS_A,
      to: undefined,
      data: DATA_WITH_CONTENT,
      expected: false,
    },
    {
      name: 'should return false when all parameters are undefined',
      from: undefined,
      to: undefined,
      data: undefined,
      expected: false,
    },
  ]

  testCases.forEach((testCase) => {
    it(`${testCase.name}`, () => {
      const result = isSelfCallWithData({
        from: testCase.from,
        to: testCase.to,
        data: testCase.data,
        chainId: UniverseChainId.Mainnet,
      })
      expect(result).toBe(testCase.expected)
    })
  })
})
