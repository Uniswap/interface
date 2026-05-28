// Run with: bun test config/oxlint-plugins/typeaware-custom.test.ts
import { describe, test, expect } from 'bun:test'
import ts from 'typescript'
import { lintProgram, type Diagnostic } from './typeaware-custom'

/**
 * Creates a TS program from in-memory source files and runs the lint rules.
 */
function lint(files: Record<string, string>, options: { native: boolean } = { native: false }): Diagnostic[] {
  const fileMap = new Map<string, string>()
  for (const [name, content] of Object.entries(files)) {
    fileMap.set(`/${name}`, content)
  }

  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    strict: true,
    noEmit: true,
  }

  const host: ts.CompilerHost = {
    getSourceFile(fileName, languageVersion) {
      const content = fileMap.get(fileName)
      if (content !== undefined) {
        return ts.createSourceFile(fileName, content, languageVersion)
      }
      // Provide a minimal lib stub so the program can resolve basic types
      if (fileName.includes('lib.') && fileName.endsWith('.d.ts')) {
        return ts.createSourceFile(fileName, '', languageVersion)
      }
      return undefined
    },
    getDefaultLibFileName: () => '/lib.d.ts',
    writeFile: () => {},
    getCurrentDirectory: () => '/',
    getCanonicalFileName: (f) => f,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
    fileExists: (f) => fileMap.has(f),
    readFile: (f) => fileMap.get(f),
  }

  const program = ts.createProgram([...fileMap.keys()], compilerOptions, host)
  return lintProgram(program, options)
}

// ── prevent-this-method-destructure ──────────────────────────────────

describe('prevent-this-method-destructure', () => {
  test('flags destructuring a class method that uses this', () => {
    const results = lint({
      'test.ts': `
        class Service {
          private value = 42
          getValue() { return this.value }
        }
        const svc = new Service()
        const { getValue } = svc
      `,
    })
    expect(results).toHaveLength(1)
    expect(results[0].rule).toBe('prevent-this-method-destructure')
    expect(results[0].message).toContain('getValue')
  })

  test('flags destructuring a property assignment with function using this', () => {
    const results = lint({
      'test.ts': `
        const obj = {
          name: 'test',
          greet: function() { return this.name },
        }
        const { greet } = obj
      `,
    })
    expect(results).toHaveLength(1)
    expect(results[0].rule).toBe('prevent-this-method-destructure')
    expect(results[0].message).toContain('greet')
  })

  test('allows destructuring methods that do not use this', () => {
    const results = lint({
      'test.ts': `
        class Util {
          add(a: number, b: number) { return a + b }
        }
        const util = new Util()
        const { add } = util
      `,
    })
    expect(results).toHaveLength(0)
  })

  test('allows destructuring plain properties', () => {
    const results = lint({
      'test.ts': `
        const obj = { x: 1, y: 'hello' }
        const { x, y } = obj
      `,
    })
    expect(results).toHaveLength(0)
  })

  test('ignores this inside nested functions (different context)', () => {
    const results = lint({
      'test.ts': `
        class Service {
          run() {
            const inner = function() { return this }
            return 'safe'
          }
        }
        const svc = new Service()
        const { run } = svc
      `,
    })
    expect(results).toHaveLength(0)
  })

  test('flags method whose arrow function captures this', () => {
    const results = lint({
      'test.ts': `
        class Service {
          run() {
            const inner = () => this
            return 'safe'
          }
        }
        const svc = new Service()
        const { run } = svc
      `,
    })
    // Arrow functions capture outer this, so this IS a valid this usage in run()
    expect(results).toHaveLength(1)
  })

  test('flags only the method that uses this, not siblings', () => {
    const results = lint({
      'test.ts': `
        class Service {
          private val = 1
          safe() { return 42 }
          unsafe() { return this.val }
        }
        const svc = new Service()
        const { safe, unsafe } = svc
      `,
    })
    expect(results).toHaveLength(1)
    expect(results[0].message).toContain('unsafe')
  })
})

// ── i18n ─────────────────────────────────────────────────────────────

describe('i18n', () => {
  test('flags t() call when interpolation value could be undefined', () => {
    const results = lint(
      {
        'test.ts': `
          declare function t(key: string, opts?: Record<string, string | undefined>): string
          function getName(): string | undefined { return undefined }
          t('greeting', { name: getName() })
        `,
      },
      { native: true },
    )
    expect(results).toHaveLength(1)
    expect(results[0].rule).toBe('i18n')
    expect(results[0].message).toContain('greeting')
    expect(results[0].message).toContain('undefined')
  })

  test('allows t() call when all interpolation values are defined', () => {
    const results = lint(
      {
        'test.ts': `
          declare function t(key: string, opts?: Record<string, string>): string
          t('greeting', { name: 'Bob' })
        `,
      },
      { native: true },
    )
    expect(results).toHaveLength(0)
  })

  test('allows t() call with no interpolation argument', () => {
    const results = lint(
      {
        'test.ts': `
          declare function t(key: string): string
          t('greeting')
        `,
      },
      { native: true },
    )
    expect(results).toHaveLength(0)
  })

  test('skips i18n check when native flag is off', () => {
    const results = lint(
      {
        'test.ts': `
          declare function t(key: string, opts?: Record<string, string | undefined>): string
          function getName(): string | undefined { return undefined }
          t('greeting', { name: getName() })
        `,
      },
      { native: false },
    )
    expect(results).toHaveLength(0)
  })

  test('reports the translation key in the error message', () => {
    const results = lint(
      {
        'test.ts': `
          declare function t(key: string, opts?: Record<string, string | undefined>): string
          declare function getVal(): string | undefined
          t('user.welcome', { val: getVal() })
        `,
      },
      { native: true },
    )
    expect(results).toHaveLength(1)
    expect(results[0].message).toContain('user.welcome')
  })

  test('allows t() when property name contains "undefined" but type is defined', () => {
    const results = lint(
      {
        'test.ts': `
          declare function t(key: string, opts?: Record<string, string>): string
          t('greeting', { undefinedFallback: 'val' })
        `,
      },
      { native: true },
    )
    expect(results).toHaveLength(0)
  })

  test('ignores t() with non-object second argument', () => {
    const results = lint(
      {
        'test.ts': `
          declare function t(key: string, opts?: string): string
          t('greeting', 'fallback')
        `,
      },
      { native: true },
    )
    expect(results).toHaveLength(0)
  })
})
