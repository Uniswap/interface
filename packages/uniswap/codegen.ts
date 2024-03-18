import type { CodegenConfig } from '@graphql-codegen/cli'

// https://the-guild.dev/graphql/codegen/docs/getting-started/development-workflow#monorepo-and-yarn-workspaces
// A single codegen config for every app/package
// This will pull graphql queries from every app/package and output a single
// typescript file. This optimizes for sharing, but can be split out in the
// future if unwieldy.

const config: CodegenConfig = {
  overwrite: true,
  schema: 'src/data/graphql/uniswap-data-api/schema.graphql',
  // pulls every graphql files in a single config
  documents: ['../../apps/{mobile,stretch}/src/**/*.graphql', '../../packages/{wallet,uniswap}/src/**/*.graphql'],
  generates: {
    // generates a single output for every app and package
    'src/data/graphql/uniswap-data-api/__generated__/types-and-hooks.ts': {
      plugins: ['typescript', 'typescript-operations', 'typescript-react-apollo', 'typescript-resolvers'],
      config: {
        withHooks: true,
      },
    }
  }
}

export default config
