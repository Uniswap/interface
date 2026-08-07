import {
  appendRandomDigits,
  generateUnitagCandidate,
  type RandomFn,
} from 'uniswap/src/features/unitags/suggestions/generateUnitagSuggestion'

vi.mock('uniswap/src/features/unitags/suggestions/unitagSuggestionDictionary', () => ({
  // Lengths chosen to exercise the target window: cal=3, swift=5, goldenab=8 / fox=3, river=5, meadowxy=8
  UNITAG_SUGGESTION_ADJECTIVES: ['cal', 'swift', 'goldenab'],
  UNITAG_SUGGESTION_NOUNS: ['fox', 'river', 'meadowxy'],
}))

// Deterministic randomness: returns the provided values in order, cycling when exhausted.
function seqRandom(values: number[]): RandomFn {
  let i = 0
  return () => {
    const value = values[i % values.length] as number
    i++
    return value
  }
}

describe('generateUnitagCandidate', () => {
  it('returns an adjective+noun combo within the 8-16 target window', () => {
    // idx1 (0.4*3=1.2) for both -> 'swift' + 'river'
    const result = generateUnitagCandidate({ random: seqRandom([0.4, 0.4]) })
    expect(result).toBe('swiftriver')
  })

  it('always produces a contract-valid candidate (5-20 lowercase a-z, no leading digit)', () => {
    for (let i = 0; i < 200; i++) {
      const result = generateUnitagCandidate()
      expect(result).toMatch(/^[a-z][a-z0-9]{4,19}$/)
      expect(result.length).toBeGreaterThanOrEqual(5)
      expect(result.length).toBeLessThanOrEqual(20)
    }
  })

  it('falls back to a valid combo when the target window is never hit', () => {
    // idx0 for every pick -> 'cal' + 'fox' = 'calfox' (6 chars, below the 8 target) on every retry
    const result = generateUnitagCandidate({ random: seqRandom([0]) })
    expect(result).toBe('calfox')
  })

  it('uses the noun+noun overflow pattern when allowed', () => {
    // 0.3 (<0.5) selects noun+noun, then idx1 'river' + idx2 'meadowxy'
    const result = generateUnitagCandidate({ allowNounNoun: true, random: seqRandom([0.3, 0.4, 0.7]) })
    expect(result).toBe('rivermeadowxy')
  })
})

describe('appendRandomDigits', () => {
  it('appends the requested number of digits to the end only', () => {
    const result = appendRandomDigits('swiftriver', { digits: 2, random: seqRandom([0.5, 0.7]) })
    expect(result).toBe('swiftriver57')
  })

  it('never appends a leading digit and stays alphanumeric', () => {
    const result = appendRandomDigits('calfox', { digits: 3, random: seqRandom([0.1, 0.2, 0.3]) })
    expect(result).toMatch(/^[a-z][a-z0-9]*$/)
  })

  it('respects the 20 char hard max', () => {
    const eighteen = 'abcdefghijklmnopqr'
    const result = appendRandomDigits(eighteen, { digits: 3, random: seqRandom([0.9, 0.9, 0.9]) })
    expect(result.length).toBeLessThanOrEqual(20)
    expect(result).toBe('abcdefghijklmnopqr99')
  })

  it('returns the base unchanged when there is no room for digits', () => {
    const twenty = 'abcdefghijklmnopqrst'
    expect(appendRandomDigits(twenty, { digits: 3 })).toBe(twenty)
  })
})
