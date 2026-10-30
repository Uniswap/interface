import { describe, expect, it } from 'vitest'
import { getWarningTextColor } from './warningColors'

describe('getWarningTextColor', () => {
  it('maps every severity to a text token', () => {
    expect(getWarningTextColor('none')).toBe('$neutral2')
    expect(getWarningTextColor('low')).toBe('$neutral2')
    expect(getWarningTextColor('medium')).toBe('$statusWarning')
    expect(getWarningTextColor('high')).toBe('$statusCritical')
    expect(getWarningTextColor('blocked')).toBe('$neutral1')
  })
})
