/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import {
  ensureValidatedCapabilities,
  isValidCapabilitiesEntry,
  isValidCapabilitiesObject,
} from 'state/walletCapabilities/lib/ensureValidatedCapabilities'

const validationTestCases = [
  // isValidCapabilitiesObject tests
  {
    name: 'invalid inputs for capabilities object',
    input: null,
    expectValid: false,
    validatorFn: 'isValidCapabilitiesObject',
    description: 'Should reject invalid inputs',
  },
  {
    name: 'valid capabilities object',
    input: { '0x1': { atomic: { status: 'supported' } } },
    expectValid: true,
    validatorFn: 'isValidCapabilitiesObject',
    description: 'Should accept valid capabilities object',
  },

  // isValidCapabilitiesEntry tests
  {
    name: 'invalid capability entry',
    input: 'not an object',
    expectValid: false,
    validatorFn: 'isValidCapabilitiesEntry',
    description: 'Should reject non-object capability entry',
  },
  {
    name: 'valid capability entry structures',
    input: {
      atomic: { status: 'supported' },
      boolCap: true,
      stringCap: 'value',
    },
    expectValid: true,
    validatorFn: 'isValidCapabilitiesEntry',
    description: 'Should accept various valid capability structures',
  },

  // ensureValidatedCapabilities tests
  {
    name: 'null input',
    input: null,
    expectValid: null,
    validatorFn: 'ensureValidatedCapabilities',
    description: 'Should return null for invalid input',
  },
  {
    name: 'chainId normalization',
    input: {
      '1': { feature: true },
      '137': { feature: true },
    },
    expectValid: {
      '0x1': { feature: true },
      '0x89': { feature: true },
    },
    validatorFn: 'ensureValidatedCapabilities',
    description: 'Should normalize numeric chainIds to hex',
  },
  {
    name: 'atomic capabilities preservation',
    input: {
      '1': { atomic: { status: 'supported' } },
      '137': { atomic: { status: 'unsupported', reason: 'Coming soon' } },
      '10': { atomic: true },
    },
    expectValid: {
      '0x1': { atomic: { status: 'supported' } },
      '0x89': { atomic: { status: 'unsupported', reason: 'Coming soon' } },
      '0xa': { atomic: true },
    },
    validatorFn: 'ensureValidatedCapabilities',
    description: 'Should preserve atomic capabilities correctly',
  },
  {
    name: 'complex capabilities',
    input: {
      '0x0': {
        'flow-control': { supported: true },
      },
      '1': {
        atomic: { status: 'supported' },
        paymasterService: { supported: true },
        account: { type: 'eoa' },
      },
      '42161': {
        atomic: {
          status: 'supported',
          version: '1.0.0',
          maxBatchSize: 10,
        },
      },
    },
    expectValid: {
      '0x0': {
        'flow-control': { supported: true },
      },
      '0x1': {
        atomic: { status: 'supported' },
        paymasterService: { supported: true },
        account: { type: 'eoa' },
      },
      '0xa4b1': {
        atomic: {
          status: 'supported',
          version: '1.0.0',
          maxBatchSize: 10,
        },
      },
    },
    validatorFn: 'ensureValidatedCapabilities',
    description: 'Should handle complex capability structures across multiple chains',
  },
]

// Group test cases by validator function
const testsByValidator = validationTestCases.reduce(
  (acc, testCase) => {
    const { validatorFn } = testCase
    if (!acc[validatorFn]) {
      acc[validatorFn] = []
    }
    acc[validatorFn].push(testCase)
    return acc
  },
  {} as Record<string, typeof validationTestCases>,
)

describe('Wallet Capabilities Validation', () => {
  describe('isValidCapabilitiesObject', () => {
    const tests = testsByValidator.isValidCapabilitiesObject || []

    test.each(tests)('$name - $description', (testCase) => {
      const result = isValidCapabilitiesObject(testCase.input)
      expect(result).toBe(testCase.expectValid)
    })
  })

  describe('isValidCapabilitiesEntry', () => {
    const tests = testsByValidator.isValidCapabilitiesEntry || []

    test.each(tests)('$name - $description', (testCase) => {
      const result = isValidCapabilitiesEntry(testCase.input)
      expect(result).toBe(testCase.expectValid)
    })
  })

  describe('ensureValidatedCapabilities', () => {
    const tests = testsByValidator.ensureValidatedCapabilities || []

    test.each(tests)('$name - $description', (testCase) => {
      const result = ensureValidatedCapabilities(testCase.input)
      expect(result).toEqual(testCase.expectValid)
    })
  })
})
