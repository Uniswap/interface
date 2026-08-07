/**
 * Conversion codemod driver (INFRA-2957): whole-import-statement swaps from
 * `ui/src` to `@universe/mycelium` only. Anything partial — a mixed import
 * statement or a file containing a manual-lane construct — is flagged and
 * never edited.
 */
import { Lang, parse, type SgNode } from '@ast-grep/napi'
import {
  CONVERTIBLE_BARREL_SPECIFIERS,
  FLAG_CONSTRUCT_RULES,
  MYCELIUM_BARREL,
  MYCELIUM_ICON_PREFIX,
  UI_BARREL,
  UI_ICON_PREFIX,
  type FlagReason,
} from './rules'

export type { FlagReason }

export type CodemodFileResult =
  | { status: 'clean' }
  | { status: 'converted'; output: string }
  | { status: 'flagged'; reasons: FlagReason[] }

interface ImportClassification {
  convertibleModuleNodes: SgNode[]
  reasons: Set<FlagReason>
  uiImportCount: number
}

function moduleText(stringNode: SgNode): string {
  return stringNode.text().slice(1, -1)
}

function namedImportSpecifiers(importClause: SgNode): SgNode[] | undefined {
  const namedImports = importClause.children().find((child) => child.kind() === 'named_imports')
  return namedImports?.children().filter((child) => child.kind() === 'import_specifier')
}

function isTypeOnly(node: SgNode): boolean {
  return node.children().some((child) => child.kind() === 'type')
}

function specifierName(specifier: SgNode): string {
  return specifier.field('name')?.text() ?? ''
}

// Default (`import UI, { Flex }`) or namespace (`import * as UI`) bindings —
// swapping the module string would silently retarget them
function hasNonNamedBinding(importClause: SgNode): boolean {
  return importClause.children().some((child) => child.kind() === 'identifier' || child.kind() === 'namespace_import')
}

function isUiSrcModule(module: string): boolean {
  return module === UI_BARREL || module.startsWith(`${UI_BARREL}/`)
}

function classifyBarrelImport(statement: SgNode, reasons: Set<FlagReason>): boolean {
  const importClause = statement.children().find((child) => child.kind() === 'import_clause')
  const specifiers = importClause ? namedImportSpecifiers(importClause) : undefined

  // Side-effect, namespace, and `import type` statements never swap
  if (!importClause || !specifiers || specifiers.length === 0 || isTypeOnly(statement)) {
    reasons.add('unconvertible-import')
    return false
  }

  const convertible = specifiers.filter(
    (specifier) => !isTypeOnly(specifier) && CONVERTIBLE_BARREL_SPECIFIERS.has(specifierName(specifier)),
  )
  if (convertible.length === specifiers.length && !hasNonNamedBinding(importClause)) {
    return true
  }
  reasons.add(convertible.length > 0 ? 'mixed-import-statement' : 'unconvertible-import')
  return false
}

function classifyIconImport(statement: SgNode, module: string, reasons: Set<FlagReason>): boolean {
  const iconName = module.slice(UI_ICON_PREFIX.length)
  const importClause = statement.children().find((child) => child.kind() === 'import_clause')
  const specifiers = importClause ? namedImportSpecifiers(importClause) : undefined

  if (
    iconName.length > 0 &&
    !iconName.includes('/') &&
    importClause &&
    !hasNonNamedBinding(importClause) &&
    specifiers &&
    specifiers.length > 0 &&
    !isTypeOnly(statement) &&
    specifiers.every((specifier) => !isTypeOnly(specifier) && specifierName(specifier) === iconName)
  ) {
    return true
  }
  reasons.add('unconvertible-import')
  return false
}

function classifyImports(root: SgNode): ImportClassification {
  const result: ImportClassification = { convertibleModuleNodes: [], reasons: new Set(), uiImportCount: 0 }

  for (const statement of root.findAll({ rule: { kind: 'import_statement' } })) {
    const stringNode = statement.children().find((child) => child.kind() === 'string')
    if (!stringNode) {
      continue
    }
    const module = moduleText(stringNode)
    if (!isUiSrcModule(module)) {
      continue
    }
    result.uiImportCount += 1

    if (module === UI_BARREL) {
      if (classifyBarrelImport(statement, result.reasons)) {
        result.convertibleModuleNodes.push(stringNode)
      }
    } else if (module.startsWith(UI_ICON_PREFIX)) {
      if (classifyIconImport(statement, module, result.reasons)) {
        result.convertibleModuleNodes.push(stringNode)
      }
    } else {
      // Any other ui/src deep path (theme, icons barrel, hooks, ...) is manual-lane
      result.reasons.add('unconvertible-import')
    }
  }

  // `export ... from 'ui/src'` re-exports and dynamic `import('ui/src')` have
  // no statement-level swap either — manual lane
  for (const statement of root.findAll({ rule: { kind: 'export_statement', has: { kind: 'string' } } })) {
    const stringNode = statement.children().find((child) => child.kind() === 'string')
    if (stringNode && isUiSrcModule(moduleText(stringNode))) {
      result.uiImportCount += 1
      result.reasons.add('unconvertible-import')
    }
  }
  for (const call of root.findAll({ rule: { pattern: 'import($ARG)' } })) {
    const arg = call.getMatch('ARG')
    if (arg?.kind() === 'string' && isUiSrcModule(arg.text().slice(1, -1))) {
      result.uiImportCount += 1
      result.reasons.add('unconvertible-import')
    }
  }
  return result
}

function findFlagConstructs(root: SgNode): Set<FlagReason> {
  const reasons = new Set<FlagReason>()
  for (const { reason, rule } of FLAG_CONSTRUCT_RULES) {
    if (root.findAll(rule).length > 0) {
      reasons.add(reason)
    }
  }
  return reasons
}

export function runCodemodOnSource(source: string): CodemodFileResult {
  const root = parse(Lang.Tsx, source).root()
  const { convertibleModuleNodes, reasons, uiImportCount } = classifyImports(root)

  // Files without ui/src imports are out of scope, whatever else they contain
  if (uiImportCount === 0) {
    return { status: 'clean' }
  }

  for (const reason of findFlagConstructs(root)) {
    reasons.add(reason)
  }
  if (reasons.size > 0) {
    return { status: 'flagged', reasons: [...reasons].sort() }
  }

  const edits = convertibleModuleNodes.map((stringNode) => {
    const module = moduleText(stringNode)
    const target =
      module === UI_BARREL ? MYCELIUM_BARREL : `${MYCELIUM_ICON_PREFIX}${module.slice(UI_ICON_PREFIX.length)}`
    return stringNode.replace(`'${target}'`)
  })
  return { status: 'converted', output: root.commitEdits(edits) }
}
