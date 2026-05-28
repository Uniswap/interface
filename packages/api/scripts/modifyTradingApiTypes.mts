#!/usr/bin/env bun

const debug = (...args: unknown[]) => {
  if (process.env.DEBUG) console.log(...args)
}

const path = './src/clients/trading/__generated__/models'

// Request types
const requestFileNames = ['ApprovalRequest', 'CreateSwapRequest', 'QuoteRequest']

// Response types
const responseFileNames = ['ApprovalResponse', 'CreateSwapResponse', 'ClassicQuote']

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

async function readFile(filePath: string): Promise<string> {
  return Bun.file(filePath).text()
}

async function writeFile(filePath: string, content: string): Promise<void> {
  await Bun.write(filePath, content)
}

/**
 * Add a named import to a file.
 * Supports both `import type { X }` and `import { X }` (non-type) styles.
 * If an import from the same module already exists, the named import is appended.
 */
function addImport(source: string, importName: string, importPath = '../../types', isTypeImport = false): string {
  // Check if this specific named import already exists from this path
  const escapedPath = importPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  // Match any import (type or value) from this module path
  const importRegex = new RegExp(`^(import\\s+(?:type\\s+)?\\{[^}]*\\}\\s+from\\s+['"]${escapedPath}['"];?)$`, 'gm')

  const matches = [...source.matchAll(importRegex)]

  if (matches.length > 0) {
    // Check if the import name already exists in any matching import
    for (const match of matches) {
      const importLine = match[0]
      // Extract the names between { }
      const namesMatch = importLine.match(/\{([^}]*)\}/)
      if (namesMatch) {
        const names = namesMatch[1].split(',').map((n) => n.trim())
        if (names.includes(importName)) {
          // Already imported
          return source
        }
      }
    }

    // Append to the first matching import
    const firstMatch = matches[0]!
    const importLine = firstMatch[0]
    const namesMatch = importLine.match(/\{([^}]*)\}/)
    if (namesMatch) {
      const existingNames = namesMatch[1].trim()
      const newNames = `${existingNames}, ${importName}`
      const newImportLine = importLine.replace(/\{[^}]*\}/, `{ ${newNames} }`)
      return source.replace(importLine, newImportLine)
    }
  }

  // No existing import from this path — add a new one after the last import
  const typeKeyword = isTypeImport ? 'type ' : ''
  const newImportLine = `import ${typeKeyword}{ ${importName} } from "${importPath}";`

  // Find the position after the last import statement
  const lastImportRegex = /^import\s+.*$/gm
  let lastImportEnd = -1
  let match: RegExpExecArray | null
  while ((match = lastImportRegex.exec(source)) !== null) {
    lastImportEnd = match.index + match[0].length
  }

  if (lastImportEnd !== -1) {
    return source.slice(0, lastImportEnd) + '\n' + newImportLine + source.slice(lastImportEnd)
  }

  // No imports at all — add at the top
  return newImportLine + '\n' + source
}

/**
 * Add properties to a type alias (object literal type).
 * Finds `export type TypeName = {` and inserts before the closing `};`.
 * If `replace` is true and a property already exists, it is removed then re-added.
 */
function modifyType(
  source: string,
  typeName: string,
  newProperties: { name: string; type: string; isOptional?: boolean }[],
  replace = false,
): string {
  // Find the type alias declaration
  const typeRegex = new RegExp(`(export\\s+type\\s+${typeName}\\s*=\\s*\\{)`)
  const typeMatch = source.match(typeRegex)

  if (!typeMatch) {
    console.warn(`Type ${typeName} not found`)
    return source
  }

  // Find the matching closing brace for this type
  const startIdx = typeMatch.index! + typeMatch[0].length
  let braceDepth = 1
  let endIdx = startIdx

  while (endIdx < source.length && braceDepth > 0) {
    if (source[endIdx] === '{') {
      braceDepth++
    } else if (source[endIdx] === '}') {
      braceDepth--
    }
    if (braceDepth > 0) {
      endIdx++
    }
  }

  // endIdx now points to the closing }
  let typeBody = source.slice(startIdx, endIdx)

  for (const prop of newProperties) {
    const propName = prop.name
    // Check if property already exists
    const propRegex = new RegExp(`^\\s*${propName}[?]?\\s*:`, 'm')
    const exists = propRegex.test(typeBody)

    if (exists) {
      if (replace) {
        // Remove the existing property line — match the full line including leading newline
        const removeRegex = new RegExp(`\\n[ \\t]*${propName}[?]?\\s*:[^;]*;`, 'g')
        typeBody = typeBody.replace(removeRegex, '')
        debug(`Replaced property ${propName} in ${typeName}`)
      } else {
        debug(`Property ${propName} already exists in ${typeName}`)
        continue
      }
    } else {
      debug(`Added property ${propName} to ${typeName}`)
    }

    // Add the property at the end of the type body (trimming trailing whitespace first)
    const questionMark = prop.isOptional ? '?' : ''
    const propLine = `\n    ${propName}${questionMark}: ${prop.type};`
    // Remove trailing blank lines before adding new property
    typeBody = typeBody.replace(/\n\s*$/, '')
    typeBody = typeBody + propLine
  }

  // Ensure there's a newline before the closing brace
  if (!typeBody.endsWith('\n')) {
    typeBody = typeBody + '\n'
  }

  return source.slice(0, startIdx) + typeBody + source.slice(endIdx)
}

/**
 * Add a union member to a type alias, e.g. `| null`.
 * Handles object literal types by brace-matching to find the true end.
 */
function addToTypeAlias(source: string, typeName: string, typeToAdd: string): string {
  const typeRegex = new RegExp(`(export\\s+type\\s+${typeName}\\s*=\\s*)`)
  const typeMatch = source.match(typeRegex)

  if (!typeMatch) {
    console.warn(`Type ${typeName} not found`)
    return source
  }

  const startIdx = typeMatch.index! + typeMatch[0].length

  // Walk forward from startIdx, matching braces to find the end of the type.
  // The type ends at the `;` that follows the outermost balanced expression.
  let pos = startIdx
  let braceDepth = 0

  while (pos < source.length) {
    const ch = source[pos]
    if (ch === '{') {
      braceDepth++
    } else if (ch === '}') {
      braceDepth--
    } else if (ch === ';' && braceDepth === 0) {
      break
    }
    pos++
  }

  // pos points to the terminating `;`
  const typeText = source.slice(startIdx, pos)

  if (typeText.includes(typeToAdd)) {
    debug(`${typeToAdd} already exists in ${typeName}`)
    return source
  }

  debug(`Added ${typeToAdd} to ${typeName}`)
  const newTypeText = typeText.trimEnd() + ' ' + typeToAdd
  return source.slice(0, startIdx) + newTypeText + source.slice(pos)
}

/**
 * Add an enum member. Optionally with a @deprecated JSDoc comment.
 */
function addEnumMember(
  source: string,
  enumName: string,
  newMember: { name: string; value: string },
  deprecated = false,
): string {
  // Check if the enum exists
  const enumRegex = new RegExp(`(export\\s+enum\\s+${enumName}\\s*\\{)`)
  const enumMatch = source.match(enumRegex)

  if (!enumMatch) {
    console.warn(`Enum ${enumName} not found in file`)
    return source
  }

  // Find the closing brace of the enum
  const startIdx = enumMatch.index! + enumMatch[0].length
  let braceDepth = 1
  let endIdx = startIdx

  while (endIdx < source.length && braceDepth > 0) {
    if (source[endIdx] === '{') {
      braceDepth++
    } else if (source[endIdx] === '}') {
      braceDepth--
    }
    if (braceDepth > 0) {
      endIdx++
    }
  }

  // endIdx points to closing }
  const enumBody = source.slice(startIdx, endIdx)

  // Check if member already exists
  const memberRegex = new RegExp(`\\b${newMember.name}\\b\\s*=`)
  if (memberRegex.test(enumBody)) {
    debug(`Enum member ${newMember.name} already exists in ${enumName}`)
    return source
  }

  // Build the new member
  let insertion = ''
  if (deprecated) {
    insertion += `\n    /** @deprecated Deprecation flag added via modifyTradingApiTypes.mts in order to not break existing code. */`
  }
  insertion += `\n    ${newMember.name} = "${newMember.value}",`

  // Ensure there's a comma after the last existing member
  // Find the last non-whitespace character before the closing brace
  const trimmedBody = enumBody.trimEnd()
  const lastChar = trimmedBody[trimmedBody.length - 1]

  let newEnumBody = enumBody
  if (lastChar && lastChar !== ',' && lastChar !== '{') {
    // Need to add a comma to the last member
    const lastNonWhitespaceIdx = enumBody.lastIndexOf(lastChar)
    newEnumBody = enumBody.slice(0, lastNonWhitespaceIdx + 1) + ',' + enumBody.slice(lastNonWhitespaceIdx + 1)
  }

  // Insert before closing brace (at the end of the body)
  debug(`Added enum member ${newMember.name} = "${newMember.value}" to ${enumName}`)
  return source.slice(0, startIdx) + newEnumBody + insertion + '\n' + source.slice(endIdx)
}

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------

async function main(): Promise<void> {
  // Process request files — add GasStrategy import + gasStrategies property
  for (const name of requestFileNames) {
    const filePath = `${path}/${name}.ts`
    let source = await readFile(filePath)
    source = addImport(source, 'GasStrategy')
    source = modifyType(source, name, [{ name: 'gasStrategies', type: 'GasStrategy[]', isOptional: true }])
    await writeFile(filePath, source)
  }

  // Process response files — add GasEstimate import + gasEstimates property
  for (const name of responseFileNames) {
    const filePath = `${path}/${name}.ts`
    let source = await readFile(filePath)
    source = addImport(source, 'GasEstimate')
    source = modifyType(source, name, [{ name: 'gasEstimates', type: 'GasEstimate[]', isOptional: true }])
    await writeFile(filePath, source)
  }

  // ChainedQuote — special handling (replace mode for gasEstimates + slippage)
  {
    const filePath = `${path}/ChainedQuote.ts`
    let source = await readFile(filePath)
    source = addImport(source, 'GasEstimate')
    source = addImport(source, 'slippageTolerance', './slippageTolerance')
    source = modifyType(
      source,
      'ChainedQuote',
      [
        { name: 'gasEstimates', type: 'GasEstimate[]', isOptional: true },
        { name: 'slippage', type: 'slippageTolerance', isOptional: true },
      ],
      true,
    )
    await writeFile(filePath, source)
  }

  // NullablePermit — add `| null`
  {
    const filePath = `${path}/NullablePermit.ts`
    let source = await readFile(filePath)
    source = addToTypeAlias(source, 'NullablePermit', '| null')
    await writeFile(filePath, source)
  }

  // PlanResponse — add lastUserActionAt
  {
    const filePath = `${path}/PlanResponse.ts`
    let source = await readFile(filePath)
    source = modifyType(source, 'PlanResponse', [{ name: 'lastUserActionAt', type: 'string', isOptional: true }])
    await writeFile(filePath, source)
  }

  // Routing enum — add JUPITER and DUTCH_LIMIT
  {
    const filePath = `${path}/Routing.ts`
    let source = await readFile(filePath)
    source = addEnumMember(source, 'Routing', { name: 'JUPITER', value: 'JUPITER' })
    source = addEnumMember(source, 'Routing', { name: 'DUTCH_LIMIT', value: 'DUTCH_LIMIT' }, true)
    await writeFile(filePath, source)
  }

  // OrderType enum — add DUTCH and DUTCH_LIMIT
  {
    const filePath = `${path}/OrderType.ts`
    let source = await readFile(filePath)
    source = addEnumMember(source, 'OrderType', { name: 'DUTCH', value: 'DUTCH' }, true)
    source = addEnumMember(source, 'OrderType', { name: 'DUTCH_LIMIT', value: 'DUTCH_LIMIT' }, true)
    await writeFile(filePath, source)
  }

  // OrderStatus enum — add UNVERIFIED
  {
    const filePath = `${path}/OrderStatus.ts`
    let source = await readFile(filePath)
    source = addEnumMember(source, 'OrderStatus', { name: 'UNVERIFIED', value: 'unverified' }, true)
    await writeFile(filePath, source)
  }

  console.log('✓ Trading API types updated')
}

main()
