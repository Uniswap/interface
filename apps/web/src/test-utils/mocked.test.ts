import { mocked } from 'test-utils/mocked'

test('mocked works', () => {
  const fn = vi.fn(() => 42)
  const m = mocked(fn)
  expect(m()).toBe(42)
  expect(m).toHaveBeenCalled()
})
