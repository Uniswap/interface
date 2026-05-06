import { describe, expect, it } from 'vitest'
import { base64ToBase64url, base64urlToBase64 } from './base64url'

describe('base64urlToBase64', () => {
  it('returns an empty string unchanged', () => {
    expect(base64urlToBase64('')).toBe('')
  })

  it('swaps - and _ back to + and /', () => {
    // '+/' encodes to '-_' in base64url
    expect(base64urlToBase64('-_')).toBe('+/==')
    expect(base64urlToBase64('-_-_')).toBe('+/+/')
  })

  it('re-adds padding for each length mod 4', () => {
    // len % 4 === 0: no padding
    expect(base64urlToBase64('YWJj')).toBe('YWJj')
    // len % 4 === 2: 2 '=' pads
    expect(base64urlToBase64('YQ')).toBe('YQ==')
    // len % 4 === 3: 1 '=' pad
    expect(base64urlToBase64('YWI')).toBe('YWI=')
  })

  it('leaves already-padded input padding intact', () => {
    // If the input already has '=' pads (unusual for base64url but
    // possible), we should not add more — length mod 4 is already 0.
    expect(base64urlToBase64('YQ==')).toBe('YQ==')
  })
})

describe('base64ToBase64url', () => {
  it('returns an empty string unchanged', () => {
    expect(base64ToBase64url('')).toBe('')
  })

  it('swaps + and / to - and _', () => {
    expect(base64ToBase64url('+/+/')).toBe('-_-_')
  })

  it('strips trailing padding', () => {
    expect(base64ToBase64url('YQ==')).toBe('YQ')
    expect(base64ToBase64url('YWI=')).toBe('YWI')
    expect(base64ToBase64url('YWJj')).toBe('YWJj')
  })
})
