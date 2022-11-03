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

export default config
