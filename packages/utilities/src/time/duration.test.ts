import { ONE_DAY_MS, ONE_MINUTE_MS, ONE_SECOND_MS } from 'utilities/src/time/time'
import { getDurationRemainingString } from './duration'

describe('getDurationRemainingString', () => {
  it('should include h for durations > 1hr', () => {
    expect(getDurationRemainingString(Date.now() + ONE_DAY_MS)).toContain('h')
  })
  it('should not include h for durations < 1hr', () => {
    expect(getDurationRemainingString(Date.now() + ONE_MINUTE_MS)).not.toContain('h')
  })
  it('should include m for durations < 1m', () => {
    expect(getDurationRemainingString(Date.now() + ONE_SECOND_MS * 30)).not.toContain('m')
  })
})
