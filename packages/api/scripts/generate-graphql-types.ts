#!/usr/bin/env bun
import path from 'path'
/**
 * GraphQL type generator that replaces the graphql-codegen CLI.
 *
 * Uses @graphql-codegen/core programmatically with the same plugins,
 * producing byte-identical output to the CLI while being faster and
 * having zero CLI overhead (no config file discovery, CLI arg parsing,
 * listr task runner, etc.).
 *
 * Usage: cd packages/api && bun scripts/generate-graphql-types.ts
 */
import { codegen } from '@graphql-codegen/core'
import { getCachedDocumentNodeFromSchema } from '@graphql-codegen/plugin-helpers'
import * as typescriptPlugin from '@graphql-codegen/typescript'
import * as typescriptOperationsPlugin from '@graphql-codegen/typescript-operations'
import * as typescriptReactApolloPlugin from '@graphql-codegen/typescript-react-apollo'
import * as typescriptResolversPlugin from '@graphql-codegen/typescript-resolvers'
import { buildSchema, lexicographicSortSchema, parse, type DocumentNode } from 'graphql'

const debug = (...args: unknown[]) => {
  if (process.env.DEBUG) console.log(...args)
}

const ROOT = path.resolve(import.meta.dir, '..')
const REPO_ROOT = path.resolve(ROOT, '../..')
const SCHEMA_PATH = path.join(ROOT, 'src/clients/graphql/schema.graphql')
const GEN_DIR = path.join(ROOT, 'src/clients/graphql/__generated__')

// ---------------------------------------------------------------------------
// 1. Load schema
// ---------------------------------------------------------------------------
const schemaSource = await Bun.file(SCHEMA_PATH).text()
const schemaAst = lexicographicSortSchema(buildSchema(schemaSource))
const schemaDocumentNode = getCachedDocumentNodeFromSchema(schemaAst)

// ---------------------------------------------------------------------------
// 2. Load all document files (matching codegen.config.ts patterns)
// ---------------------------------------------------------------------------
const documentPatterns = [
  'apps/mobile/src/**/*.graphql',
  'apps/extension/src/**/*.graphql',
  'packages/wallet/src/**/*.graphql',
  'packages/uniswap/src/**/*.graphql',
  'packages/api/src/**/*.graphql',
]

const documentPaths: string[] = []
for (const pattern of documentPatterns) {
  const g = new Bun.Glob(pattern)
  for await (const match of g.scan({ cwd: REPO_ROOT, absolute: true })) {
    // Skip the schema file itself
    if (match.endsWith('schema.graphql')) continue
    documentPaths.push(match)
  }
}

// Deduplicate and sort for deterministic output
const uniqueDocPaths = [...new Set(documentPaths)].sort()

const documents: Array<{ document: DocumentNode; location: string }> = []
for (const docPath of uniqueDocPaths) {
  const content = await Bun.file(docPath).text()
  try {
    documents.push({
      document: parse(content),
      location: docPath,
    })
  } catch (e) {
    throw new Error(`Failed to parse ${docPath}: ${e}`)
  }
}

debug(`Loaded ${documents.length} document files`)

// ---------------------------------------------------------------------------
// 3. Shared config (matches codegen.config.ts)
// ---------------------------------------------------------------------------
const sharedConfig = {
  maybeValue: 'T | undefined',
}

// ---------------------------------------------------------------------------
// 4. Generate all 4 files
// ---------------------------------------------------------------------------
type GenerateTarget = {
  filename: string
  plugins: Array<{ [key: string]: unknown }>
  pluginMap: { [key: string]: unknown }
  config: Record<string, unknown>
}

const targets: GenerateTarget[] = [
  {
    filename: path.join(GEN_DIR, 'schema-types.ts'),
    plugins: [{ typescript: {} }],
    pluginMap: { typescript: typescriptPlugin },
    config: { ...sharedConfig },
  },
  {
    filename: path.join(GEN_DIR, 'resolvers.ts'),
    plugins: [{ 'typescript-resolvers': {} }],
    pluginMap: { 'typescript-resolvers': typescriptResolversPlugin },
    config: { ...sharedConfig },
  },
  {
    filename: path.join(GEN_DIR, 'operations.ts'),
    plugins: [{ 'typescript-operations': {} }],
    pluginMap: { 'typescript-operations': typescriptOperationsPlugin },
    config: { ...sharedConfig },
  },
  {
    filename: path.join(GEN_DIR, 'react-hooks.ts'),
    plugins: [{ 'typescript-react-apollo': {} }],
    pluginMap: { 'typescript-react-apollo': typescriptReactApolloPlugin },
    config: { ...sharedConfig, withHooks: true },
  },
]

for (const target of targets) {
  const output = await codegen({
    filename: target.filename,
    schema: schemaDocumentNode,
    schemaAst,
    documents,
    plugins: target.plugins,
    pluginMap: target.pluginMap,
    config: target.config,
  })
  await Bun.write(target.filename, output)
  debug(`Generated ${path.basename(target.filename)}`)
}

console.log('✓ GraphQL types generated')
