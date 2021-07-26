import { incentiveKeyToIncentiveId } from './incentiveKeyToIncentiveId'
import { constants } from 'ethers'

describe(incentiveKeyToIncentiveId, () => {
  it('correct for example', () => {
    expect(
      incentiveKeyToIncentiveId({
        pool: constants.AddressZero,
        refundee: constants.AddressZero,
        rewardToken: constants.AddressZero,
        startTime: 0,
        endTime: 100,
      })
    ).toEqual('0x17b98489a2dfe2c85076f94f6ed94b2c60a48a728457375268be4e78c6a6de87')
  })
})
