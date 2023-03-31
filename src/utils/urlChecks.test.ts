import { checkStringForURL } from './urlChecks'

test('checkStringForURL', () => {
  expect(checkStringForURL('this is my personal website: https://www.example.com')).toBe(true)
  expect(checkStringForURL('#corngang')).toBe(false)
  expect(checkStringForURL('Unislap-LP.org')).toBe(true)
  expect(checkStringForURL('https://uniswap.org')).toBe(true)
  expect(checkStringForURL('https://www.uniswap.org')).toBe(true)
  expect(checkStringForURL('http://uniswap.org')).toBe(true)
  expect(checkStringForURL('http://username:password@uniswap.org')).toBe(true)
  expect(checkStringForURL('http://app.uniswap.org')).toBe(true)
  expect(checkStringForURL('username:password@app.uniswap.org:22')).toBe(true)
  expect(checkStringForURL('uniswap.org:80')).toBe(true)
  expect(checkStringForURL('asdf uniswap.org:80 asdf')).toBe(true)
})
