import { BlockedWarning, getPriorityWarning, MediumWarning, StrongWarning } from './tokenSafety'

describe('getPriorityWarning', () => {
  it('returns token1Warning when both warnings exist and token1Warning is BLOCKED', () => {
    const token0Warning = StrongWarning
    const token1Warning = BlockedWarning
    expect(getPriorityWarning(token0Warning, token1Warning)).toBe(token1Warning)
  })

  it('returns token1Warning when both warnings exist, token1Warning is UNKNOWN, and token0Warning is not BLOCKED', () => {
    const token0Warning = StrongWarning
    const token1Warning = StrongWarning
    expect(getPriorityWarning(token0Warning, token1Warning)).toBe(token1Warning)
  })

  it('returns token0Warning when both warnings exist and token1Warning is not BLOCKED or UNKNOWN', () => {
    const token0Warning = StrongWarning
    const token1Warning = MediumWarning
    expect(getPriorityWarning(token0Warning, token1Warning)).toBe(token0Warning)
  })

  it('returns token0Warning when only token0Warning exists', () => {
    const token0Warning = StrongWarning
    expect(getPriorityWarning(token0Warning, null)).toBe(token0Warning)
  })

  it('returns token1Warning when only token1Warning exists', () => {
    const token1Warning = BlockedWarning
    expect(getPriorityWarning(null, token1Warning)).toBe(token1Warning)
  })

  it('returns null when both warnings are null', () => {
    expect(getPriorityWarning(null, null)).toBeNull()
  })
})
