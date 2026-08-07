/**
 * Minimal deterministic CSS parser for the parity harness: flattens CSS text
 * into selector → declaration rules. Anything unrecognized throws instead of
 * being silently coerced, so a comparison can never pass on unparsed data.
 */

export type Declarations = Record<string, string>

export interface FlatRule {
  selector: string
  declarations: Declarations
  /** Enclosing at-rules, outermost first (e.g. ['@layer utilities', '@media (…)']). */
  atPath: string[]
  /** Raw body text, kept for non-grouping at-rules with nested blocks (@keyframes). */
  rawBody?: string
}

/**
 * Flatten CSS text into rules. Handles arbitrary nesting: grouping at-rules
 * (@layer/@media/@supports) extend the at-rule path; style rules nested inside
 * style rules (Tailwind v4 preflight does this) get their selectors joined —
 * such compound selectors simply never match the plain utility selectors the
 * harness cares about, but nothing is silently dropped.
 */
export function flattenCss(css: string): FlatRule[] {
  const rules: FlatRule[] = []
  const parser = new CssParser(css, rules)
  parser.parseBlock([], [])
  return rules
}

class CssParser {
  private i = 0
  constructor(
    private readonly css: string,
    private readonly rules: FlatRule[],
  ) {}

  /** Parse until matching '}' (or EOF at the top level, where both stacks are empty). */
  parseBlock(selectorStack: string[], atPath: string[]): void {
    const insideBlock = selectorStack.length > 0 || atPath.length > 0
    const decls: Declarations = {}
    while (this.i < this.css.length) {
      const ch = this.css.charAt(this.i)
      if (/\s/.test(ch)) {
        this.i++
        continue
      }
      if (this.css.startsWith('/*', this.i)) {
        const end = this.css.indexOf('*/', this.i + 2)
        this.i = end === -1 ? this.css.length : end + 2
        continue
      }
      if (ch === '}') {
        this.i++
        break
      }
      const { text: prelude, terminator } = this.readUntilBraceOrSemicolon()
      if (terminator === '' || terminator === ';') {
        if (terminator === ';') {
          this.i++
        }
        // declaration inside a block; statement at-rule (@import/@charset/@layer list) anywhere
        if (insideBlock && !prelude.startsWith('@') && prelude !== '') {
          recordDeclaration(decls, prelude)
        }
        continue
      }
      if (terminator === '}') {
        // final declaration without trailing semicolon — record, let the loop consume '}'
        if (insideBlock && prelude !== '') {
          recordDeclaration(decls, prelude)
          continue
        }
        throw new Error(`flattenCss: unexpected '}' after "${prelude}"`)
      }
      this.i++ // consume '{'
      // Flush declarations collected so far BEFORE recursing into a nested
      // block, so emitted rule order matches document order — a later nested
      // refinement (e.g. Tailwind's @supports color-mix box-shadow) must
      // out-rank the earlier fallback under the consumers' later-wins merge.
      if (selectorStack.length > 0 && Object.keys(decls).length > 0) {
        this.rules.push({ selector: selectorStack.join(' '), declarations: { ...decls }, atPath: [...atPath] })
        for (const key of Object.keys(decls)) {
          delete decls[key]
        }
      }
      if (prelude.startsWith('@')) {
        const isGrouping =
          prelude.startsWith('@layer') || prelude.startsWith('@media') || prelude.startsWith('@supports')
        if (isGrouping) {
          this.parseBlock(selectorStack, [...atPath, prelude])
        } else {
          // non-grouping at-rule with a body (@property, @keyframes, @theme, @font-face, …)
          const body = this.readBlockBody()
          this.i++ // consume '}'
          this.rules.push({
            selector: prelude,
            declarations: parseDeclarationsLoose(body),
            atPath: [...atPath],
            rawBody: body,
          })
        }
        continue
      }
      this.parseBlock([...selectorStack, prelude], atPath)
    }
    if (selectorStack.length > 0 && Object.keys(decls).length > 0) {
      this.rules.push({ selector: selectorStack.join(' '), declarations: decls, atPath: [...atPath] })
    }
  }

  private readUntilBraceOrSemicolon(): { text: string; terminator: string } {
    let depth = 0
    let quote: string | undefined
    const start = this.i
    while (this.i < this.css.length) {
      const ch = this.css[this.i]
      if (quote !== undefined) {
        if (ch === quote) {
          quote = undefined
        }
      } else if (ch === '"' || ch === "'") {
        quote = ch
      } else if (ch === '(') {
        depth++
      } else if (ch === ')') {
        depth--
      } else if (depth === 0 && (ch === '{' || ch === ';' || ch === '}')) {
        return { text: this.css.slice(start, this.i).trim(), terminator: ch }
      }
      this.i++
    }
    return { text: this.css.slice(start).trim(), terminator: '' }
  }

  private readBlockBody(): string {
    // positioned just after '{'
    let depth = 1
    const start = this.i
    while (this.i < this.css.length) {
      if (this.css.startsWith('/*', this.i)) {
        const end = this.css.indexOf('*/', this.i + 2)
        this.i = end === -1 ? this.css.length : end + 2
        continue
      }
      const ch = this.css[this.i]
      if (ch === '{') {
        depth++
      } else if (ch === '}') {
        depth--
        if (depth === 0) {
          return this.css.slice(start, this.i)
        }
      }
      this.i++
    }
    return this.css.slice(start)
  }
}

function recordDeclaration(decls: Declarations, text: string): void {
  const colon = text.indexOf(':')
  if (colon === -1) {
    throw new Error(`flattenCss: not a declaration: "${text}"`)
  }
  decls[normalizePropName(text.slice(0, colon).trim())] = text.slice(colon + 1).trim()
}

/** Parse `prop: value; prop: value` — throws on anything that isn't a declaration. */
export function parseDeclarations(body: string): Declarations {
  const decls: Declarations = {}
  for (const part of splitTopLevel(body, ';')) {
    const trimmed = part.trim()
    if (trimmed === '') {
      continue
    }
    recordDeclaration(decls, trimmed)
  }
  return decls
}

/** Like parseDeclarations but tolerant of at-rule bodies (keyframes steps etc. are skipped). */
function parseDeclarationsLoose(body: string): Declarations {
  const decls: Declarations = {}
  for (const part of splitTopLevel(body, ';')) {
    const trimmed = part.trim()
    if (trimmed === '' || trimmed.includes('{') || !trimmed.includes(':')) {
      continue
    }
    recordDeclaration(decls, trimmed)
  }
  return decls
}

/** Custom properties are case-sensitive; regular property names are not. */
function normalizePropName(prop: string): string {
  return prop.startsWith('--') ? prop : prop.toLowerCase()
}

/** Split on a separator, ignoring separators inside parentheses or quotes. */
export function splitTopLevel(text: string, separator: string): string[] {
  const parts: string[] = []
  let depth = 0
  let quote: string | undefined
  let start = 0
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quote !== undefined) {
      if (ch === quote) {
        quote = undefined
      }
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
    } else if (ch === '(') {
      depth++
    } else if (ch === ')') {
      depth--
    } else if (ch === separator && depth === 0) {
      parts.push(text.slice(start, i))
      start = i + 1
    }
  }
  parts.push(text.slice(start))
  return parts
}
