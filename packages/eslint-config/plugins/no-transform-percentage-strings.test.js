const { RuleTester } = require('eslint')
const rule = require('./no-transform-percentage-strings')

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
})

ruleTester.run('no-transform-percentage-strings', rule, {
  valid: [
    // Numeric values are allowed
    {
      code: `const styles = { transform: [{ translateX: 100 }] }`,
    },
    {
      code: `const styles = { transform: [{ translateY: 50 }] }`,
    },
    {
      code: `const styles = { transform: [{ translateX: -100 }] }`,
    },
    // Variables are allowed (can't statically analyze)
    {
      code: `const styles = { transform: [{ translateX: offset }] }`,
    },
    // Animated values are allowed
    {
      code: `const styles = { transform: [{ translateX: animatedValue }] }`,
    },
    // Other transform properties with percentages are allowed (rotate, scale, etc.)
    {
      code: `const styles = { transform: [{ rotate: '45deg' }] }`,
    },
    // JSX with numeric values
    {
      code: `<View style={{ transform: [{ translateX: 100 }] }} />`,
    },
    {
      code: `<Flex transform={[{ translateY: 50 }]} />`,
    },
    // StyleSheet.create with numeric values
    {
      code: `
        const styles = StyleSheet.create({
          container: {
            transform: [{ translateX: 100 }]
          }
        })
      `,
    },
    // Multiple transforms with numeric values
    {
      code: `const styles = { transform: [{ translateX: 100 }, { translateY: 50 }] }`,
    },
  ],

  invalid: [
    // Object literal with percentage string
    {
      code: `const styles = { transform: [{ translateX: '40%' }] }`,
      errors: [
        {
          messageId: 'noPercentageTransform',
          data: {
            property: 'translateX',
            value: '40%',
          },
        },
      ],
    },
    {
      code: `const styles = { transform: [{ translateY: '50%' }] }`,
      errors: [
        {
          messageId: 'noPercentageTransform',
          data: {
            property: 'translateY',
            value: '50%',
          },
        },
      ],
    },
    // Negative percentage
    {
      code: `const styles = { transform: [{ translateX: '-40%' }] }`,
      errors: [
        {
          messageId: 'noPercentageTransform',
        },
      ],
    },
    // Decimal percentage
    {
      code: `const styles = { transform: [{ translateY: '12.5%' }] }`,
      errors: [
        {
          messageId: 'noPercentageTransform',
        },
      ],
    },
    // JSX style prop with percentage
    {
      code: `<View style={{ transform: [{ translateX: '40%' }] }} />`,
      errors: [
        {
          messageId: 'noPercentageTransform',
          data: {
            property: 'translateX',
            value: '40%',
          },
        },
      ],
    },
    // JSX transform prop directly (like line 143 in ReceiveQRCode.tsx)
    {
      code: `<Flex transform={[{ translateY: '-40%' }]} />`,
      errors: [
        {
          messageId: 'noPercentageTransform',
          data: {
            property: 'translateY',
            value: '-40%',
          },
        },
      ],
    },
    // Real-world example from ReceiveQRCode.tsx
    {
      code: `
        <Flex
          style={{ transform: [{ translateX: '40%' }] }}
          transform={[{ translateY: '-40%' }]}
        />
      `,
      errors: [
        {
          messageId: 'noPercentageTransform',
          data: {
            property: 'translateX',
            value: '40%',
          },
        },
        {
          messageId: 'noPercentageTransform',
          data: {
            property: 'translateY',
            value: '-40%',
          },
        },
      ],
    },
    // StyleSheet.create with percentage
    {
      code: `
        const styles = StyleSheet.create({
          container: {
            transform: [{ translateX: '40%' }]
          }
        })
      `,
      errors: [
        {
          messageId: 'noPercentageTransform',
        },
      ],
    },
    // Multiple transforms with mixed valid/invalid
    {
      code: `const styles = { transform: [{ translateX: '40%' }, { translateY: 50 }] }`,
      errors: [
        {
          messageId: 'noPercentageTransform',
          data: {
            property: 'translateX',
            value: '40%',
          },
        },
      ],
    },
    {
      code: `const styles = { transform: [{ translateX: 100 }, { translateY: '50%' }] }`,
      errors: [
        {
          messageId: 'noPercentageTransform',
          data: {
            property: 'translateY',
            value: '50%',
          },
        },
      ],
    },
    // Both translateX and translateY with percentages
    {
      code: `const styles = { transform: [{ translateX: '40%' }, { translateY: '50%' }] }`,
      errors: [
        {
          messageId: 'noPercentageTransform',
          data: {
            property: 'translateX',
            value: '40%',
          },
        },
        {
          messageId: 'noPercentageTransform',
          data: {
            property: 'translateY',
            value: '50%',
          },
        },
      ],
    },
    // Template literal with percentage
    {
      code: 'const styles = { transform: [{ translateX: `${offset}%` }] }',
      errors: [
        {
          messageId: 'noPercentageTransform',
        },
      ],
    },
  ],
})

console.log('All tests passed!')
