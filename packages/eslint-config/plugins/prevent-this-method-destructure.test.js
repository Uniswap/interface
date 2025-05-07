const { RuleTester } = require('eslint')
const rule = require('./prevent-this-method-destructure')

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    project: require.resolve('./tsconfig.test.json'),
    tsconfigRootDir: __dirname,
    ecmaVersion: 2020,
    sourceType: 'module',
  },
})

ruleTester.run('prevent-this-method-destructure', rule, {
  valid: [
    {
      code: `
        const obj = {
          method() { return 42 },
          notAMethod: () => 5,
        }
        const { notAMethod } = obj // allowed, not using 'this'
      `,
      filename: __filename,
    },
    {
      code: `
        class MyClass {
          method() { return 42 }
        }
        const obj = new MyClass()
        const method = obj.method // allowed, not destructuring
      `,
      filename: __filename,
    },
    {
      code: `
        const obj = {
          method() { return 42 },
        }
        obj.method()
      `,
      filename: __filename,
    },
    {
      code: `
        const obj = {
          method: function() { return this.value },
        }
        const method = obj.method // allowed, not destructuring
      `,
      filename: __filename,
    },
  ],
  invalid: [
    {
      code: `
        const obj = {
          someMethod: function() { return this.value },
        }
        const { someMethod } = obj // should error: destructuring method using 'this'
      `,
      filename: __filename,
      errors: [
        {
          message:
            "Destructuring method 'someMethod' will cause it to lose 'this' context. Use object.someMethod() instead.",
        },
      ],
    },
    {
      code: `
        const obj = {
          method() { return this.value },
        }
        const { method } = obj // should error: destructuring method using 'this'
      `,
      filename: __filename,
      errors: [
        {
          message: "Destructuring method 'method' will cause it to lose 'this' context. Use object.method() instead.",
        },
      ],
    },
    {
      code: `
        class MyClass {
          method() { return this.value }
        }
        const obj = new MyClass()
        const { method } = obj // should error: destructuring method using 'this'
      `,
      filename: __filename,
      errors: [
        {
          message: "Destructuring method 'method' will cause it to lose 'this' context. Use object.method() instead.",
        },
      ],
    },
    {
      code: `
        const obj = {
          method() { return this.value },
          another() { return 42 },
        }
        const { method, another } = obj // should error only for 'method'
      `,
      filename: __filename,
      errors: [
        {
          message: "Destructuring method 'method' will cause it to lose 'this' context. Use object.method() instead.",
        },
      ],
    },
  ],
})
