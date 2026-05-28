import { OnchainItemListOptionType } from 'uniswap/src/components/lists/items/types'
import { extractDomain } from 'uniswap/src/components/lists/items/wallets/utils'
import { ENS_SUFFIX } from 'uniswap/src/features/ens/constants'
import { UNITAG_SUFFIX } from 'uniswap/src/features/unitags/constants'

describe('extractDomain', () => {
  it.each`
    walletName              | type                                    | expected
    ${'test'}               | ${OnchainItemListOptionType.Unitag}     | ${UNITAG_SUFFIX}
    ${'test'}               | ${OnchainItemListOptionType.ENSAddress} | ${ENS_SUFFIX}
    ${'test.'}              | ${OnchainItemListOptionType.Unitag}     | ${UNITAG_SUFFIX}
    ${'test.eth'}           | ${OnchainItemListOptionType.ENSAddress} | ${'.eth'}
    ${'test.uni.eth'}       | ${OnchainItemListOptionType.Unitag}     | ${'.uni.eth'}
    ${'test.something.eth'} | ${OnchainItemListOptionType.ENSAddress} | ${'.something.eth'}
    ${'test.cb.id'}         | ${OnchainItemListOptionType.ENSAddress} | ${'.cb.id'}
  `('walletName=$walletName type=$type should return expected=$expected', ({ walletName, type, expected }) => {
    expect(extractDomain(walletName, type)).toEqual(expected)
  })
})
