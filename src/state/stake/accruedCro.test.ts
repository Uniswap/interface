import { computeAccruedCro } from './accruedCro'

describe('accruedCro domain', () => {
  describe('computeAccruedCro', () => {
    it('get empty default result', () => {
      expect(computeAccruedCro([])).toEqual({
        totalAccruedCro: '0.00'
      })
    })

    it('get some result with 1 item in reward', () => {
      expect(computeAccruedCro([{ reward: '1000000', timestamp: '1599591600' }])).toEqual({
        totalAccruedCro: '1000000'
      })
    })

    it('get some result for multiple days', () => {
      expect(
        computeAccruedCro([
          { reward: '1000000', timestamp: '1599591600' },
          { reward: '1000000', timestamp: '1599620400' },
          { reward: '1000000', timestamp: '1599624000' },
          { reward: '981306.4876033951467473046839320509', timestamp: '1599627600' },
          { reward: '977471.0348374786514495211287361187', timestamp: '1599631200' }
        ])
      ).toEqual({
        totalAccruedCro: '1977471.0348374786514495211287361187'
      })
    })
  })
})
