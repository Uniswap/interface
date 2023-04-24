import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  overwrite: true,
  schema: 'src/data/__generated__/schema.graphql',
  documents: 'src/**/*.graphql',
  generates: {
    'src/data/__generated__/types-and-hooks.ts': {
      plugins: ['typescript', 'typescript-operations', 'typescript-react-apollo'],
      config: {
        withHooks: true,
      },
    },
  },
}

export default config
