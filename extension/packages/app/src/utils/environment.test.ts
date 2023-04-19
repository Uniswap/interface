import { isTest } from './environment'

describe(isTest, () => {
  it('returns false when is a non-jest dev environment', () => {
    expect(isTest(null)).toBeFalsy()
    expect(isTest('')).toBeFalsy()
  })

  it('returns true when in jest environment', () => {
    expect(isTest('123')).toBeTruthy()
  })
})
