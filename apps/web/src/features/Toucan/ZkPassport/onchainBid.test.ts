import { encodeSubmitBidCalldata } from '~/features/Toucan/ZkPassport/onchainBid'

// Fixture: the calldata Uniswap's CreateAuction backend produced for a real
// sepolia bid (tx 0x58da71e4230e25770b5d144c4e07585f7c507417673976947a67aa305ba567ed
// on auction 0x08b301f6a61251b56ddefd8f5f6c345c4ec44c6a). The local encoder
// must reproduce it byte for byte.
const REAL_BID_CALLDATA =
  '0x140fe8ee' +
  '000000000000000000000000000000000000000000000001843331a5b4768280' +
  '0000000000000000000000000000000000000000000000000011c37937e08000' +
  '000000000000000000000000c05f5ae5e44b7a8e97217e88605203eb044bdb89' +
  '0000000000000000000000000000000000000000000000000000000000000080' +
  '0000000000000000000000000000000000000000000000000000000000000000'

describe('encodeSubmitBidCalldata', () => {
  it('reproduces the backend-built calldata for a real sepolia bid', () => {
    expect(
      encodeSubmitBidCalldata({
        maxPriceQ96: 0x1843331a5b4768280n,
        amountRaw: 5000000000000000n,
        owner: '0xc05f5ae5e44b7a8e97217e88605203eb044bdb89',
      }),
    ).toBe(REAL_BID_CALLDATA)
  })
})
