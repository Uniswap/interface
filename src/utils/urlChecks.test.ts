import { hasURL } from './urlChecks'

test('hasURL', () => {
  expect(hasURL('this is my personal website: https://www.example.com')).toBe(true)
  expect(hasURL('#corngang')).toBe(false)
  expect(hasURL('Unislap-LP.org')).toBe(true)
  expect(hasURL('https://uniswap.org')).toBe(true)
  expect(hasURL('https://www.uniswap.org')).toBe(true)
  expect(hasURL('http://uniswap.org')).toBe(true)
  expect(hasURL('http://username:password@uniswap.org')).toBe(true)
  expect(hasURL('http://app.uniswap.org')).toBe(true)
  expect(hasURL('username:password@app.uniswap.org:22')).toBe(true)
  expect(hasURL('uniswap.org:80')).toBe(true)
  expect(hasURL('asdf uniswap.org:80 asdf')).toBe(true)
})
