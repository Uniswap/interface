import { ENS_SUFFIX } from 'uniswap/src/features/ens/constants'
import { SearchResultType, extractDomain } from 'uniswap/src/features/search/SearchResult'
import { UNITAG_SUFFIX } from 'uniswap/src/features/unitags/constants'

describe('extractDomain', () => {
  it.each`
    walletName              | type                           | expected
    ${'test'}               | ${SearchResultType.Unitag}     | ${UNITAG_SUFFIX}
    ${'test'}               | ${SearchResultType.ENSAddress} | ${ENS_SUFFIX}
    ${'test.'}              | ${SearchResultType.Unitag}     | ${UNITAG_SUFFIX}
    ${'test.eth'}           | ${SearchResultType.ENSAddress} | ${'.eth'}
    ${'test.uni.eth'}       | ${SearchResultType.Unitag}     | ${'.uni.eth'}
    ${'test.something.eth'} | ${SearchResultType.ENSAddress} | ${'.something.eth'}
    ${'test.cb.id'}         | ${SearchResultType.ENSAddress} | ${'.cb.id'}
  `('walletName=$walletName type=$type should return expected=$expected', ({ walletName, type, expected }) => {
    expect(extractDomain(walletName, type)).toEqual(expected)
  })
})
