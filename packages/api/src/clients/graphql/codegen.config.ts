import type { CodegenConfig } from '@graphql-codegen/cli'

// https://the-guild.dev/graphql/codegen/docs/getting-started/development-workflow#monorepo-and-yarn-workspaces
// A single codegen config for every app/package
// This will pull graphql queries from every app/package and output 4 files:
// - schema-types.ts (base GraphQL schema types)
// - operations.ts (operation types: queries, mutations, subscriptions, fragments)
// - react-hooks.ts (Apollo React hooks)
// - resolvers.ts (GraphQL resolver types)
// A post-processing script adds imports between files to maintain proper type references.

const config: CodegenConfig = {
  overwrite: true,
  schema: 'src/clients/graphql/schema.graphql',
  // pulls every graphql files into a single config
  documents: ['../../apps/{mobile,extension}/src/**/*.graphql', '../../packages/{wallet,uniswap,api}/src/**/*.graphql'],
  generates: {
    // generates base schema types (standalone)
    'src/clients/graphql/__generated__/schema-types.ts': {
      plugins: ['typescript'],
      config: {
        maybeValue: 'T | undefined',
      },
    },
    // generates resolvers (imports from schema-types)
    'src/clients/graphql/__generated__/resolvers.ts': {
      plugins: ['typescript-resolvers'],
      config: {
        maybeValue: 'T | undefined',
      },
    },
    // generates operations (imports from schema-types)
    'src/clients/graphql/__generated__/operations.ts': {
      plugins: ['typescript-operations'],
      config: {
        maybeValue: 'T | undefined',
      },
    },
    // generates React Apollo hooks (imports from operations)
    'src/clients/graphql/__generated__/react-hooks.ts': {
      plugins: ['typescript-react-apollo'],
      config: {
        withHooks: true,
        maybeValue: 'T | undefined',
      },
    },
  },
}

export default config
