import { isNonJestDev } from './index'

describe(isNonJestDev, () => {
  it('returns true when is a non-jest dev environment', () => {
    expect(isNonJestDev(true, null)).toBeTruthy()
    expect(isNonJestDev(true, '')).toBeTruthy()
  })

  it('returns false when in jest environment', () => {
    expect(isNonJestDev(true, '123')).toBeFalsy()
  })

  it('returns false when in non-dev enrionment', () => {
    expect(isNonJestDev(false, '123')).toBeFalsy()
    expect(isNonJestDev(false, undefined)).toBeFalsy()
  })
})
