import type { CodegenConfig } from '@graphql-codegen/cli'

// https://the-guild.dev/graphql/codegen/docs/getting-started/development-workflow#monorepo-and-yarn-workspaces
// A single codegen config for every app/package
// This will pull graphql queries from every app/package and ouput a single
// typescript file. This optimizes for sharing, but can be split out in the
// future if unwieldy.
const config: CodegenConfig = {
  overwrite: true,
  schema: 'packages/wallet/src/data/__generated__/schema.graphql',
  // pulls every graphql files in a single config
  documents: ['apps/{mobile,stretch}/src/**/*.graphql', 'packages/**/src/**/*.graphql'],
  generates: {
    // generates a single output for every app and package
    'packages/wallet/src/data/__generated__/types-and-hooks.ts': {
      plugins: ['typescript', 'typescript-operations', 'typescript-react-apollo'],
      config: {
        withHooks: true,
      },
    }
  }
}

export default config
