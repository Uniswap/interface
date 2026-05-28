#!/usr/bin/env bun
/**
 * Post-processing script to fix imports in generated GraphQL files.
 * Uses fast string/regex parsing instead of ts-morph for speed.
 */
import path from 'path'

const debug = (...args: unknown[]) => {
  if (process.env.DEBUG) console.log(...args)
}

const genDir = path.join(process.cwd(), 'src/clients/graphql/__generated__')

/**
 * Extract all exported type/interface/enum/const names from a TypeScript file.
 * Matches lines like:
 *   export type Foo = ...
 *   export type Foo<T> = ...
 *   export enum Foo {
 *   export interface Foo {
 *   export const Foo = ...
 */
function extractExports(content: string): string[] {
  const exports: string[] = []
  const re = /^export\s+(?:type|interface|enum|const|function)\s+([A-Za-z_]\w*)/gm
  let match: RegExpExecArray | null
  while ((match = re.exec(content)) !== null) {
    exports.push(match[1]!)
  }
  return exports
}

/**
 * Build an import line: import { type A, type B, ... } from "./module";
 */
function buildImportLine(moduleSpecifier: string, names: string[]): string {
  const specifiers = names.map((n) => `type ${n}`).join(', ')
  return `import { ${specifiers} } from "${moduleSpecifier}";`
}

/**
 * Find the byte offset right after the last import statement in the file.
 * Returns the index immediately after the newline following the last import.
 * If no imports exist, returns 0 (insert at the beginning).
 */
function findInsertPosition(content: string): number {
  // Match import lines: import ... from '...' or import ... from "..."
  // They can span a single line in generated code
  const re = /^import\s.+$/gm
  let lastImportEnd = -1
  let match: RegExpExecArray | null
  while ((match = re.exec(content)) !== null) {
    lastImportEnd = match.index + match[0].length
  }

  if (lastImportEnd === -1) {
    // No existing imports — insert at position 0
    return 0
  }

  // Skip past the newline character after the last import
  if (content[lastImportEnd] === '\n') {
    return lastImportEnd + 1
  }
  return lastImportEnd
}

/**
 * Add an import line to file content after existing imports.
 * Returns null if the import already exists.
 */
function addImport(content: string, moduleSpecifier: string, exportNames: string[]): string | null {
  if (exportNames.length === 0) {
    return null
  }

  // Check if import from this module already exists
  if (content.includes(`from "${moduleSpecifier}"`)) {
    return null
  }

  const importLine = buildImportLine(moduleSpecifier, exportNames)
  const pos = findInsertPosition(content)

  return content.slice(0, pos) + importLine + '\n' + content.slice(pos)
}

// Step 1: Extract all exports from schema-types.ts
const schemaTypesPath = path.join(genDir, 'schema-types.ts')
const schemaContent = await Bun.file(schemaTypesPath).text()
const schemaExports = extractExports(schemaContent)
debug(`Found ${schemaExports.length} exports in schema-types.ts`)

// Step 2: Add imports to resolvers.ts from schema-types.ts
const resolversPath = path.join(genDir, 'resolvers.ts')
const resolversContent = await Bun.file(resolversPath).text()
const resolversUpdated = addImport(resolversContent, './schema-types', schemaExports)
if (resolversUpdated) {
  await Bun.write(resolversPath, resolversUpdated)
}
debug('✓ Added imports to resolvers.ts')

// Step 3: Add imports to operations.ts from schema-types.ts
const operationsPath = path.join(genDir, 'operations.ts')
const operationsContent = await Bun.file(operationsPath).text()
const operationsUpdated = addImport(operationsContent, './schema-types', schemaExports)
if (operationsUpdated) {
  await Bun.write(operationsPath, operationsUpdated)
}
debug('✓ Added imports to operations.ts')

// Step 4: Extract all exports from operations.ts (use the updated version if available)
const operationsContentUpdated = operationsUpdated ?? operationsContent
const operationsExports = extractExports(operationsContentUpdated)
debug(`Found ${operationsExports.length} exports in operations.ts`)

// Step 5: Add imports to react-hooks.ts from operations.ts
const hooksPath = path.join(genDir, 'react-hooks.ts')
const hooksContent = await Bun.file(hooksPath).text()
const hooksUpdated = addImport(hooksContent, './operations', operationsExports)
if (hooksUpdated) {
  await Bun.write(hooksPath, hooksUpdated)
}
debug('✓ Added imports to react-hooks.ts')

console.log('✓ GraphQL codegen post-processing complete')
