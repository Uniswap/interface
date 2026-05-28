import {
  buildAccountAddressesByPlatform,
  isAccountAddressesByPlatform,
} from 'uniswap/src/data/rest/buildAccountAddressesByPlatform'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'

const TEST_EVM_ADDRESS = '0x1234567890123456789012345678901234567890'
const TEST_SVM_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

describe(buildAccountAddressesByPlatform, () => {
  it('should return undefined when input is undefined', () => {
    const result = buildAccountAddressesByPlatform(undefined)
    expect(result).toBeUndefined()
  })

  it('should return undefined when input is an empty object', () => {
    const result = buildAccountAddressesByPlatform({})
    expect(result).toBeUndefined()
  })

  it('should return undefined when both addresses are undefined', () => {
    const result = buildAccountAddressesByPlatform({
      evmAddress: undefined,
      svmAddress: undefined,
    })
    expect(result).toBeUndefined()
  })

  it('should return only EVM platform when only evmAddress is provided', () => {
    const result = buildAccountAddressesByPlatform({
      evmAddress: TEST_EVM_ADDRESS,
    })
    expect(result).toEqual({
      [Platform.EVM]: TEST_EVM_ADDRESS,
    })
  })

  it('should return only SVM platform when only svmAddress is provided', () => {
    const result = buildAccountAddressesByPlatform({
      svmAddress: TEST_SVM_ADDRESS,
    })
    expect(result).toEqual({
      [Platform.SVM]: TEST_SVM_ADDRESS,
    })
  })

  it('should return both platforms when both addresses are provided', () => {
    const result = buildAccountAddressesByPlatform({
      evmAddress: TEST_EVM_ADDRESS,
      svmAddress: TEST_SVM_ADDRESS,
    })
    expect(result).toEqual({
      [Platform.EVM]: TEST_EVM_ADDRESS,
      [Platform.SVM]: TEST_SVM_ADDRESS,
    })
  })

  it('should handle empty string addresses as valid addresses', () => {
    const result = buildAccountAddressesByPlatform({
      evmAddress: '',
    })
    // Empty strings are falsy, so should return undefined
    expect(result).toBeUndefined()
  })

  it('should return only defined addresses when one is empty string', () => {
    const result = buildAccountAddressesByPlatform({
      evmAddress: TEST_EVM_ADDRESS,
      svmAddress: '',
    })
    expect(result).toEqual({
      [Platform.EVM]: TEST_EVM_ADDRESS,
    })
  })

  it('should return the correct type as AccountAddressesByPlatform', () => {
    const result = buildAccountAddressesByPlatform({
      evmAddress: TEST_EVM_ADDRESS,
      svmAddress: TEST_SVM_ADDRESS,
    })

    // Type assertion check - if this compiles, the type is correct
    if (result) {
      const evmAddress: string = result[Platform.EVM]
      const svmAddress: string = result[Platform.SVM]
      expect(evmAddress).toBe(TEST_EVM_ADDRESS)
      expect(svmAddress).toBe(TEST_SVM_ADDRESS)
    }
  })

  it('should only include platforms for which addresses are provided', () => {
    const resultWithOnlyEvm = buildAccountAddressesByPlatform({
      evmAddress: TEST_EVM_ADDRESS,
    })

    expect(resultWithOnlyEvm).toHaveProperty(Platform.EVM)
    expect(resultWithOnlyEvm).not.toHaveProperty(Platform.SVM)

    const resultWithOnlySvm = buildAccountAddressesByPlatform({
      svmAddress: TEST_SVM_ADDRESS,
    })

    expect(resultWithOnlySvm).toHaveProperty(Platform.SVM)
    expect(resultWithOnlySvm).not.toHaveProperty(Platform.EVM)
  })
})

describe(isAccountAddressesByPlatform, () => {
  it('should return false for null', () => {
    expect(isAccountAddressesByPlatform(null)).toBe(false)
  })

  it('should return false for undefined', () => {
    expect(isAccountAddressesByPlatform(undefined)).toBe(false)
  })

  it('should return false for primitive types', () => {
    expect(isAccountAddressesByPlatform('string')).toBe(false)
    expect(isAccountAddressesByPlatform(123)).toBe(false)
    expect(isAccountAddressesByPlatform(true)).toBe(false)
  })

  it('should return false for empty object', () => {
    expect(isAccountAddressesByPlatform({})).toBe(false)
  })

  it('should return false for array', () => {
    expect(isAccountAddressesByPlatform([])).toBe(false)
    expect(isAccountAddressesByPlatform([TEST_EVM_ADDRESS])).toBe(false)
  })

  it('should return true for valid object with only EVM address', () => {
    const validObject = {
      [Platform.EVM]: TEST_EVM_ADDRESS,
    }
    expect(isAccountAddressesByPlatform(validObject)).toBe(true)
  })

  it('should return true for valid object with only SVM address', () => {
    const validObject = {
      [Platform.SVM]: TEST_SVM_ADDRESS,
    }
    expect(isAccountAddressesByPlatform(validObject)).toBe(true)
  })

  it('should return true for valid object with both EVM and SVM addresses', () => {
    const validObject = {
      [Platform.EVM]: TEST_EVM_ADDRESS,
      [Platform.SVM]: TEST_SVM_ADDRESS,
    }
    expect(isAccountAddressesByPlatform(validObject)).toBe(true)
  })

  it('should return false for object with invalid platform key', () => {
    const invalidObject = {
      [Platform.EVM]: TEST_EVM_ADDRESS,
      invalidPlatform: TEST_SVM_ADDRESS,
    }
    expect(isAccountAddressesByPlatform(invalidObject)).toBe(false)
  })

  it('should return false for object with non-string value', () => {
    const invalidObject = {
      [Platform.EVM]: 123,
    }
    expect(isAccountAddressesByPlatform(invalidObject)).toBe(false)
  })

  it('should return false for object with null value', () => {
    const invalidObject = {
      [Platform.EVM]: null,
    }
    expect(isAccountAddressesByPlatform(invalidObject)).toBe(false)
  })

  it('should return false for object with undefined value', () => {
    const invalidObject = {
      [Platform.EVM]: undefined,
    }
    expect(isAccountAddressesByPlatform(invalidObject)).toBe(false)
  })

  it('should return true for object with empty string values', () => {
    const validObject = {
      [Platform.EVM]: '',
    }
    expect(isAccountAddressesByPlatform(validObject)).toBe(true)
  })

  it('should work with buildAccountAddressesByPlatform output', () => {
    const result = buildAccountAddressesByPlatform({
      evmAddress: TEST_EVM_ADDRESS,
      svmAddress: TEST_SVM_ADDRESS,
    })
    expect(isAccountAddressesByPlatform(result)).toBe(true)
  })

  it('should return false for buildAccountAddressesByPlatform undefined output', () => {
    const result = buildAccountAddressesByPlatform(undefined)
    expect(isAccountAddressesByPlatform(result)).toBe(false)
  })
})
