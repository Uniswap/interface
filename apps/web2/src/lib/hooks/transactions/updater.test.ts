import { shouldCheck } from './updater'

describe('transactions updater', () => {
  describe('shouldCheck', () => {
    it('returns true if no receipt and never checked', () => {
      expect(shouldCheck(10, { addedTime: 100 })).toEqual(true)
    })
    it('returns false if has receipt and never checked', () => {
      expect(shouldCheck(10, { addedTime: 100, receipt: {} })).toEqual(false)
    })
    it('returns true if has not been checked in 1 blocks', () => {
      expect(shouldCheck(10, { addedTime: new Date().getTime(), lastCheckedBlockNumber: 9 })).toEqual(true)
    })
    it('returns false if checked in last 3 blocks and greater than 20 minutes old', () => {
      expect(shouldCheck(10, { addedTime: new Date().getTime() - 21 * 60 * 1000, lastCheckedBlockNumber: 8 })).toEqual(
        false
      )
    })
    it('returns true if not checked in last 5 blocks and greater than 20 minutes old', () => {
      expect(shouldCheck(10, { addedTime: new Date().getTime() - 21 * 60 * 1000, lastCheckedBlockNumber: 5 })).toEqual(
        true
      )
    })
    it('returns false if checked in last 10 blocks and greater than 60 minutes old', () => {
      expect(shouldCheck(20, { addedTime: new Date().getTime() - 61 * 60 * 1000, lastCheckedBlockNumber: 11 })).toEqual(
        false
      )
    })
    it('returns true if checked in last 3 blocks and greater than 20 minutes old', () => {
      expect(shouldCheck(20, { addedTime: new Date().getTime() - 61 * 60 * 1000, lastCheckedBlockNumber: 10 })).toEqual(
        true
      )
    })
  })
})
