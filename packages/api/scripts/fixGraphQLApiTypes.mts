#!/usr/bin/env node
/**
 * Post-processing script to fix imports in generated GraphQL files
 * Uses TypeScript AST to extract exports and add proper re-exports
 */
import { Project } from 'ts-morph'
import path from 'path'

const genDir = path.join(process.cwd(), 'src/clients/graphql/__generated__')

// Create a ts-morph project
const project = new Project({
  tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
})

/**
 * Extract all exported type/interface/enum/const names from a TypeScript file
 */
function extractExports(filePath: string): string[] {
  const sourceFile = project.addSourceFileAtPath(filePath)
  const exports: string[] = []

  // Get all exported declarations
  sourceFile.getExportedDeclarations().forEach((declarations, name) => {
    exports.push(name)
  })

  // Remove the source file from project to avoid conflicts
  project.removeSourceFile(sourceFile)

  return exports
}

/**
 * Add import statement to a file
 */
function addImport(filePath: string, fromFile: string, exportNames: string[]): void {
  if (exportNames.length === 0) {
    return
  }

  const sourceFile = project.addSourceFileAtPath(filePath)

  // Check if import already exists
  const existingImports = sourceFile.getImportDeclarations()
  const alreadyExists = existingImports.some(
    imp => imp.getModuleSpecifierValue() === fromFile
  )

  if (!alreadyExists) {
    // Add import at the top (after any existing imports)
    const importDeclarations = sourceFile.getImportDeclarations()
    const insertIndex = importDeclarations.length

    sourceFile.insertImportDeclaration(insertIndex, {
      moduleSpecifier: fromFile,
      namedImports: exportNames.map(name => ({ name, isTypeOnly: true })),
    })

    sourceFile.saveSync()
  }

  project.removeSourceFile(sourceFile)
}

// Step 1: Extract all exports from schema-types.ts
const schemaTypesPath = path.join(genDir, 'schema-types.ts')
const schemaExports = extractExports(schemaTypesPath)
console.log(`Found ${schemaExports.length} exports in schema-types.ts`)

// Step 2: Add imports to resolvers.ts from schema-types.ts
const resolversPath = path.join(genDir, 'resolvers.ts')
addImport(resolversPath, './schema-types', schemaExports)
console.log('✓ Added imports to resolvers.ts')

// Step 3: Add imports to operations.ts from schema-types.ts
const operationsPath = path.join(genDir, 'operations.ts')
addImport(operationsPath, './schema-types', schemaExports)
console.log('✓ Added imports to operations.ts')

// Step 4: Extract all exports from operations.ts
const operationsExports = extractExports(operationsPath)
console.log(`Found ${operationsExports.length} exports in operations.ts`)

// Step 5: Add imports to react-hooks.ts from operations.ts
const hooksPath = path.join(genDir, 'react-hooks.ts')
addImport(hooksPath, './operations', operationsExports)
console.log('✓ Added imports to react-hooks.ts')


console.log('\n✓ GraphQL codegen post-processing complete!')
