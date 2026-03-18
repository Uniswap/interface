'use strict'

const { RuleTester } = require('eslint')
const rule = require('./no-hex-string-casting')

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
})

ruleTester.run('no-hex-string-casting', rule, {
  valid: [
    // Valid cases - not hex string casting
    'const address = "0x123"',
    'const value = someFunction()',
    'const result = value as string',
    'const typed = value as Address',
    'const template = `0x${someValue}`',
  ],

  invalid: [
    // Invalid cases - hex string casting
    {
      code: 'const address = value as `0x${string}`',
      errors: [
        {
          messageId: 'noHexStringCasting',
        },
      ],
    },
    {
      code: 'const address = <`0x${string}`>value',
      errors: [
        {
          messageId: 'noHexStringCasting',
        },
      ],
    },
    {
      code: 'return someValue as `0x${string}`',
      errors: [
        {
          messageId: 'noHexStringCasting',
        },
      ],
    },
    {
      code: 'const result = (input as `0x${string}`).toLowerCase()',
      errors: [
        {
          messageId: 'noHexStringCasting',
        },
      ],
    },
  ],
})
