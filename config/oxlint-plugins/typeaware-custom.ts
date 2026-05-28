// oxlint-disable no-console
/**
 * Type-aware lint checks that Oxlint cannot cover.
 * Uses the TypeScript compiler API directly.
 *
 * Rules:
 *   1. prevent-this-method-destructure — all projects
 *      Flags `const { method } = obj` when `method` uses `this` in its body.
 *   2. i18n — native projects only (--native flag)
 *      Flags `t(key, { ...interpolation })` when any interpolation value could be undefined.
 *
 * Usage:
 *   bun config/oxlint-plugins/typeaware-custom.ts <appRoot> [--native]
 *
 * This script is invoked once per app (mobile, web, extension, dev-portal), not
 * per package. ts.createProgram resolves imports transitively, so the app's
 * program already contains the source files of every package it depends on.
 * Running on 4 apps instead of 24+ projects avoids redundant program creation —
 * the bottleneck — while still linting every reachable source file.
 */
import path from 'node:path'
import ts from 'typescript'

// ── Diagnostics ───────────────────────────────────────────────────────

export interface Diagnostic {
  file: string
  line: number
  col: number
  rule: string
  message: string
}

// ── Rule 1: prevent-this-method-destructure ───────────────────────────

export function methodUsesThis(node: ts.Node): boolean {
  if (node.kind === ts.SyntaxKind.ThisKeyword) {
    return true
  }
  // Don't recurse into nested functions/classes — `this` there refers to a different context
  // Arrow functions are NOT skipped — they capture the enclosing `this`,
  // so `this` inside an arrow inside a method is still the method's `this`.
  if (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isClassDeclaration(node) ||
    ts.isClassExpression(node)
  ) {
    return false
  }
  return ts.forEachChild(node, methodUsesThis) ?? false
}

export function checkDestructure(node: ts.VariableDeclaration, checker: ts.TypeChecker): Diagnostic[] {
  const results: Diagnostic[] = []
  if (!ts.isObjectBindingPattern(node.name) || !node.initializer) {
    return results
  }

  const type = checker.getTypeAtLocation(node.initializer)
  const properties = type.getProperties()

  for (const element of node.name.elements) {
    if (!ts.isBindingElement(element) || !ts.isIdentifier(element.name)) {
      continue
    }
    const propertyName = (
      element.propertyName && ts.isIdentifier(element.propertyName) ? element.propertyName : element.name
    ).text

    const symbol = properties.find((s) => s.getName() === propertyName)
    if (!symbol) {
      continue
    }

    const declarations = symbol.getDeclarations() ?? []
    for (const decl of declarations) {
      if (decl.getSourceFile().isDeclarationFile) {
        continue
      }

      const isThisMethod =
        (ts.isMethodDeclaration(decl) && decl.body && methodUsesThis(decl.body)) ||
        (ts.isPropertyAssignment(decl) &&
          ts.isFunctionExpression(decl.initializer) &&
          decl.initializer.body &&
          methodUsesThis(decl.initializer.body))

      if (isThisMethod) {
        const sourceFile = element.getSourceFile()
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(element.getStart())
        results.push({
          file: sourceFile.fileName,
          line: line + 1,
          col: character + 1,
          rule: 'prevent-this-method-destructure',
          message: `Destructuring method '${propertyName}' will cause it to lose 'this' context. Use object.${propertyName}() instead.`,
        })
        break
      }
    }
  }
  return results
}

// ── Rule 2: i18n (native only) ────────────────────────────────────────

export function checkI18nCall(node: ts.CallExpression, checker: ts.TypeChecker): Diagnostic[] {
  const results: Diagnostic[] = []
  if (!ts.isIdentifier(node.expression) || node.expression.text !== 't') {
    return results
  }
  if (node.arguments.length < 2) {
    return results
  }

  const secondArg = node.arguments[1]
  if (!ts.isObjectLiteralExpression(secondArg)) {
    return results
  }

  const type = checker.getTypeAtLocation(secondArg)
  const properties = checker.getPropertiesOfType(type)
  const hasUndefined = properties.some((prop) => {
    const propType = checker.getTypeOfSymbolAtLocation(prop, secondArg)
    if (propType.flags & ts.TypeFlags.Undefined) {
      return true
    }
    if (propType.isUnion()) {
      return propType.types.some((t) => t.flags & ts.TypeFlags.Undefined)
    }
    return false
  })

  if (hasUndefined) {
    const typeString = checker.typeToString(type)
    const firstArg = node.arguments[0]
    const key = ts.isStringLiteral(firstArg) ? firstArg.text : '<dynamic>'
    const sourceFile = node.getSourceFile()
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.expression.getStart())
    results.push({
      file: sourceFile.fileName,
      line: line + 1,
      col: character + 1,
      rule: 'i18n',
      message: `i18n "${key}" cannot have an undefined interpolation. Either provide a fallback or do not render.\n ${typeString}`,
    })
  }
  return results
}

// ── Lint runner ───────────────────────────────────────────────────────

export interface LintOptions {
  native: boolean
}

const defaultIgnorePatterns = [
  /\.test\.[jt]sx?$/,
  /\.spec\.[jt]sx?$/,
  /[/\\]dist[/\\]/,
  /[/\\]build[/\\]/,
  /[/\\]node_modules[/\\]/,
  /[/\\]__generated__[/\\]/,
  /[/\\]\.tamagui[/\\]/,
  /[/\\]coverage[/\\]/,
]

export function lintProgram(program: ts.Program, options: LintOptions): Diagnostic[] {
  const checker = program.getTypeChecker()
  const diagnostics: Diagnostic[] = []

  function visit(node: ts.Node): void {
    if (ts.isVariableDeclaration(node)) {
      diagnostics.push(...checkDestructure(node, checker))
    }
    if (options.native && ts.isCallExpression(node)) {
      diagnostics.push(...checkI18nCall(node, checker))
    }
    ts.forEachChild(node, visit)
  }

  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile || sourceFile.fileName.includes('/node_modules/')) {
      continue
    }
    visit(sourceFile)
  }

  return diagnostics
}

export function lintProject(projectRoot: string, options: LintOptions): Diagnostic[] {
  const absoluteRoot = path.resolve(projectRoot)

  const tsconfigPath =
    ts.findConfigFile(absoluteRoot, ts.sys.fileExists, 'tsconfig.lint.json') ??
    ts.findConfigFile(absoluteRoot, ts.sys.fileExists, 'tsconfig.json')

  if (!tsconfigPath) {
    throw new Error(`No tsconfig found in ${absoluteRoot}`)
  }

  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile)
  const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(tsconfigPath))
  const program = ts.createProgram(parsed.fileNames, parsed.options)

  const rawDiagnostics = lintProgram(program, options)
  return rawDiagnostics.filter((d) => !defaultIgnorePatterns.some((p) => p.test(d.file)))
}

// ── CLI entry point ───────────────────────────────────────────────────

function main(): void {
  const args = process.argv.slice(2)
  const nativeFlag = args.includes('--native')
  const projectRoot = args.find((a) => !a.startsWith('--'))

  if (!projectRoot) {
    console.error('Usage: bun config/oxlint-plugins/typeaware-custom.ts <projectRoot> [--native]')
    process.exit(1)
  }

  const diagnostics = lintProject(projectRoot, { native: nativeFlag })

  if (diagnostics.length > 0) {
    for (const d of diagnostics) {
      const relFile = path.relative(process.cwd(), d.file)
      console.error(`\x1b[31m✗\x1b[0m ${relFile}:${d.line}:${d.col} \x1b[2m(${d.rule})\x1b[0m`)
      console.error(`  ${d.message}\n`)
    }
    console.error(`\nFound ${diagnostics.length} error${diagnostics.length === 1 ? '' : 's'}.`)
    process.exit(1)
  } else {
    console.log('Type-aware lint: no errors found.')
    process.exit(0)
  }
}

// Only run CLI when executed directly, not when imported
if (import.meta.main) {
  main()
}
