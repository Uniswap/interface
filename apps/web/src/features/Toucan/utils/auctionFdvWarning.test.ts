import type { EnrichedAuction } from '~/features/Toucan/hooks/useTopAuctions/useTopAuctions'
import { getAuctionThresholdMet } from '~/features/Toucan/utils/auctionFdvWarning'

function createAuction(fields: {
  requiredCurrencyRaised?: string
  totalBidVolume?: string
  isGraduated?: boolean
}): EnrichedAuction['auction'] {
  return fields as unknown as EnrichedAuction['auction']
}

describe('getAuctionThresholdMet', () => {
  it('is undefined without a launch threshold, whatever the verdict', () => {
    expect(getAuctionThresholdMet(createAuction({ totalBidVolume: '1000' }))).toBeUndefined()
    expect(getAuctionThresholdMet(createAuction({ requiredCurrencyRaised: '0', isGraduated: false }))).toBeUndefined()
  })

  describe('before the graduation verdict is served', () => {
    it('reports committed volume as a percent of the threshold', () => {
      expect(getAuctionThresholdMet(createAuction({ requiredCurrencyRaised: '1000', totalBidVolume: '250' }))).toBe(25)
    })

    it('caps at 100 when committed volume exceeds the threshold', () => {
      expect(getAuctionThresholdMet(createAuction({ requiredCurrencyRaised: '500', totalBidVolume: '1000' }))).toBe(100)
    })
  })

  describe('with a served graduation verdict', () => {
    it('reports not met for a failed auction even when committed volume covers the threshold', () => {
      expect(
        getAuctionThresholdMet(
          createAuction({ requiredCurrencyRaised: '500', totalBidVolume: '1000', isGraduated: false }),
        ),
      ).toBe('notMet')
    })

    it('reports not met for a failed auction whose committed volume fell short', () => {
      expect(
        getAuctionThresholdMet(
          createAuction({ requiredCurrencyRaised: '1000', totalBidVolume: '250', isGraduated: false }),
        ),
      ).toBe('notMet')
    })

    it('reports 100 for a graduated auction even when indexed committed volume is below the threshold', () => {
      expect(
        getAuctionThresholdMet(
          createAuction({ requiredCurrencyRaised: '1000', totalBidVolume: '400', isGraduated: true }),
        ),
      ).toBe(100)
    })
  })
})
