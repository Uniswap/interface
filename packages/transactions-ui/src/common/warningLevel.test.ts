import { getWarningLevelTextColor } from '@universe/transactions-ui/src/common/warningLevel'
import { describe, expect, it } from 'vitest'

describe('getWarningLevelTextColor', () => {
  it('matches the legacy text column for every level', () => {
    expect(getWarningLevelTextColor('info')).toBe('$neutral2')
    expect(getWarningLevelTextColor('warning')).toBe('$statusWarning')
    expect(getWarningLevelTextColor('critical')).toBe('$statusCritical')
    expect(getWarningLevelTextColor('blocked')).toBe('$neutral1')
  })
})
