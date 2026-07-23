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
// 4. Generate all 4 files in parallel
// ---------------------------------------------------------------------------
const schemaTypesFile = path.join(GEN_DIR, 'schema-types.ts')
const resolversFile = path.join(GEN_DIR, 'resolvers.ts')
const operationsFile = path.join(GEN_DIR, 'operations.ts')
const hooksFile = path.join(GEN_DIR, 'react-hooks.ts')

const runCodegen = (
  filename: string,
  plugins: Array<{ [key: string]: unknown }>,
  pluginMap: { [key: string]: unknown },
  config: Record<string, unknown>,
): Promise<string> =>
  codegen({ filename, schema: schemaDocumentNode, schemaAst, documents, plugins, pluginMap, config })

const [schemaTypesOutput, resolversOutput, operationsOutput, hooksOutput] = await Promise.all([
  runCodegen(schemaTypesFile, [{ typescript: {} }], { typescript: typescriptPlugin }, sharedConfig),
  runCodegen(
    resolversFile,
    [{ 'typescript-resolvers': {} }],
    { 'typescript-resolvers': typescriptResolversPlugin },
    sharedConfig,
  ),
  runCodegen(
    operationsFile,
    [{ 'typescript-operations': {} }],
    { 'typescript-operations': typescriptOperationsPlugin },
    sharedConfig,
  ),
  runCodegen(
    hooksFile,
    [{ 'typescript-react-apollo': {} }],
    { 'typescript-react-apollo': typescriptReactApolloPlugin },
    { ...sharedConfig, withHooks: true },
  ),
])

// ---------------------------------------------------------------------------
// 5. Post-process: prepend cross-file type imports
//    resolvers.ts and operations.ts import all exports from schema-types.ts
//    react-hooks.ts imports all exports from operations.ts
// ---------------------------------------------------------------------------
const EXPORT_RE = /^export\s+(?:type|interface|enum|const|function)\s+([A-Za-z_]\w*)/gm
const IMPORT_RE = /^import\s.+$/gm

function extractExports(content: string): string[] {
  const exports: string[] = []
  let match: RegExpExecArray | null
  while ((match = EXPORT_RE.exec(content)) !== null) {
    exports.push(match[1]!)
  }
  return exports
}

function prependImport(content: string, moduleSpecifier: string, names: string[]): string {
  if (names.length === 0 || content.includes(`from "${moduleSpecifier}"`)) {
    return content
  }
  const specifiers = names.map((n) => `type ${n}`).join(', ')
  const importLine = `import { ${specifiers} } from "${moduleSpecifier}";`

  let lastImportEnd = -1
  let match: RegExpExecArray | null
  while ((match = IMPORT_RE.exec(content)) !== null) {
    lastImportEnd = match.index + match[0].length
  }
  const pos = lastImportEnd === -1 ? 0 : content[lastImportEnd] === '\n' ? lastImportEnd + 1 : lastImportEnd
  return content.slice(0, pos) + importLine + '\n' + content.slice(pos)
}

const schemaExports = extractExports(schemaTypesOutput)
const resolversFinal = prependImport(resolversOutput, './schema-types', schemaExports)
const operationsFinal = prependImport(operationsOutput, './schema-types', schemaExports)
const operationsExports = extractExports(operationsFinal)
const hooksFinal = prependImport(hooksOutput, './operations', operationsExports)

// ---------------------------------------------------------------------------
// 6. Write all 4 final files in parallel
// ---------------------------------------------------------------------------
await Promise.all([
  Bun.write(schemaTypesFile, schemaTypesOutput),
  Bun.write(resolversFile, resolversFinal),
  Bun.write(operationsFile, operationsFinal),
  Bun.write(hooksFile, hooksFinal),
])

console.log('✓ GraphQL types generated')
