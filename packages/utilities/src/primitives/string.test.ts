import { escapeRegExp, normalizeTextInput, trimToLength } from './string'

describe(trimToLength, () => {
  it('handles empty string', () => {
    expect(trimToLength('', 1)).toBe('')
  })

  it('handles string longer than max length', () => {
    expect(trimToLength('teststring', 1)).toBe('t...')
  })

  it('handles string shorter than max length', () => {
    expect(trimToLength('teststring', 20)).toBe('teststring')
  })
})

describe(normalizeTextInput, () => {
  it('handles empty string', () => {
    expect(normalizeTextInput('')).toBe('')
  })

  it('handles string with multiple spaces', () => {
    expect(normalizeTextInput('test    string')).toBe('test string')
  })

  it('handles string with multiple spaces and leading white space', () => {
    expect(normalizeTextInput(' test    string')).toBe('test string')
  })

  it('lowercases string', () => {
    expect(normalizeTextInput('Test')).toBe('test')
  })

  it('lowercases string with leading white space', () => {
    expect(normalizeTextInput(' Test')).toBe('test')
  })

  it('does not lowercases string', () => {
    expect(normalizeTextInput('Test', false)).toBe('Test')
  })
})

describe(escapeRegExp, () => {
  it('handles empty string', () => {
    expect(escapeRegExp('')).toBe('')
  })

  it('handles escaped characters', () => {
    expect(escapeRegExp('/*?')).toBe('/\\*\\?')
  })
})
