import {
  chunkString,
  concatStrings,
  escapeRegExp,
  matchesAllWords,
  normalizeTextInput,
  preventOrphanWord,
  trimToLength,
} from 'utilities/src/primitives/string'

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

describe(concatStrings, () => {
  it('formats no account', () => {
    expect(concatStrings([], 'and')).toEqual('')
  })

  it('formats 1 account', () => {
    expect(concatStrings(['1'], 'and')).toEqual('1')
  })

  it('formats 2 accounts', () => {
    expect(concatStrings(['1', '2'], 'and')).toEqual('1 and 2')
  })

  it('formats 3 accounts', () => {
    expect(concatStrings(['1', '2', '3'], 'and')).toEqual('1, 2 and 3')
  })

  it('formats more than 3 accounts', () => {
    expect(concatStrings(['1', '2', '3', '4'], 'and')).toEqual('1, 2, 3 and 4')
  })
})

describe(chunkString, () => {
  it('returns an empty array for an empty string', () => {
    expect(chunkString('', 3)).toEqual([])
  })

  it('returns a single chunk when value is shorter than size', () => {
    expect(chunkString('ab', 5)).toEqual(['ab'])
  })

  it('splits value into evenly-sized chunks when length is a multiple of size', () => {
    expect(chunkString('abcdef', 2)).toEqual(['ab', 'cd', 'ef'])
  })

  it('puts the remainder in a final shorter chunk', () => {
    expect(chunkString('abcdefg', 3)).toEqual(['abc', 'def', 'g'])
  })

  it('returns one chunk per character when size is 1', () => {
    expect(chunkString('abc', 1)).toEqual(['a', 'b', 'c'])
  })
})

describe(matchesAllWords, () => {
  it('matches everything for an empty or whitespace query', () => {
    expect(matchesAllWords('', 'anything')).toBe(true)
    expect(matchesAllWords('   ', 'anything')).toBe(true)
  })

  it('matches case-insensitively', () => {
    expect(matchesAllWords('SWAP', 'swap-confirmation')).toBe(true)
  })

  it('requires every word to appear', () => {
    expect(matchesAllWords('swap wait', 'swap-confirmation', 'wait_times')).toBe(true)
    expect(matchesAllWords('swap buffer', 'swap-confirmation', 'wait_times')).toBe(false)
  })

  it('ignores undefined targets', () => {
    expect(matchesAllWords('flag', undefined, 'flag-name')).toBe(true)
  })
})

describe(preventOrphanWord, () => {
  it('joins the last two words with a non-breaking space', () => {
    expect(preventOrphanWord('You need ETH on Robinhood Chain')).toBe('You need ETH on Robinhood\u00A0Chain')
  })

  it('returns a single word unchanged', () => {
    expect(preventOrphanWord('Chain')).toBe('Chain')
  })

  it('returns an empty string unchanged', () => {
    expect(preventOrphanWord('')).toBe('')
  })

  it('leaves text with trailing whitespace unchanged', () => {
    expect(preventOrphanWord('Robinhood Chain ')).toBe('Robinhood Chain ')
  })
})
