import { ESLint } from 'eslint'

it('should have a correct configuration for a TypeScript file', async () => {
  const linter = new ESLint({
    overrideConfig: {
      extends: ['./node.js'],
    },
  })
  expect(await linter.calculateConfigForFile('file.ts')).toMatchSnapshot({ parser: expect.any(String) })
})

it('should have a correct configuration for a React file', async () => {
  const linter = new ESLint({
    overrideConfig: {
      extends: ['./react.js'],
    },
  })
  expect(await linter.calculateConfigForFile('file.tsx')).toMatchSnapshot({ parser: expect.any(String) })
})

it('should have a correct configuration for a Jest file', async () => {
  const linter = new ESLint({
    overrideConfig: {
      extends: ['./node.js'],
    },
  })
  expect(await linter.calculateConfigForFile('src/feature/file.test.ts')).toMatchSnapshot({
    parser: expect.any(String),
  })
})

it('should have a correct configuration for a Cypress e2e file', async () => {
  const linter = new ESLint({
    overrideConfig: {
      extends: ['./node.js'],
    },
  })
  expect(await linter.calculateConfigForFile('cypress/e2e/file.ts')).toMatchSnapshot({
    parser: expect.any(String),
  })
})
