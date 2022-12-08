import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  overwrite: true,
  schema: './src/graphql/data/schema.graphql',
  documents: ['./src', '!**/node_modules/**', '!**/__mocks__/**', '!**/__generated__/**', '!**/thegraph/**'],
  generates: {
    'src/graphql/data/__generated__/types-and-hooks.ts': {
      plugins: ['typescript', 'typescript-operations', 'typescript-react-apollo'],
      config: {
        withHooks: true,
      },
    },
  },
}

// This is used in package.json when generating apollo schemas however the linter stills flags this as unused
// eslint-disable-next-line import/no-unused-modules
export default config
