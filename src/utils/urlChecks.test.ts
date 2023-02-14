import { hasURL } from './urlChecks'

test('hasURL', () => {
  expect(hasURL('this is my personal website: https://www.example.com')).toBe(true)
  expect(hasURL('#corngang')).toBe(false)
})
