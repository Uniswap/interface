import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'

/**
 * Corpus-wide tripwire for the quick-launch / token-protection decoupling.
 *
 * `is_quick_launch` is derived purely from on-chain launch parameters, and the quick-launch preset
 * is reproducible by anyone permissionlessly — so an attacker can mint the flag for a scam token
 * just by matching the preset. Every auction surface may use it for cosmetic and discovery
 * treatment (badge, filter chip, progress cell, FDV-input layout, link-out), and none of them may
 * let it suppress, downgrade, or bypass a Blockaid / token-protection verdict or the flagged-token
 * hiding.
 *
 * ## This file is NOT the guarantee — `AuctionHeader.test.tsx` is
 *
 * The invariant is asserted behaviourally in `../Auction/AuctionHeader.test.tsx`, which renders the
 * real header against a malicious token and checks the warning appears with identical severity
 * whether or not the auction is a quick launch. That test is the anchor. Read it first, and do not
 * weaken it.
 *
 * What this file adds on top is one cheap, deliberately shallow thing the behavioural test cannot
 * do: it sweeps *every* source under `apps/web/src` — including surfaces that do not exist yet —
 * and reds if the flag and a protection signal are wired together in one expression. It is a
 * tripwire over breadth, not a proof over depth.
 *
 * ## Exactly what it catches
 *
 * A protection symbol and a quick-launch symbol, **both written under their own names**, joined by a
 * boolean or conditional operator on **one logical line** — where a logical line is a physical line
 * plus the continuation lines the formatter wrapped off it ({@link toLogicalLines}). That is the
 * shape the original regression took: `!isQuickLaunch && shouldShowAuctionTokenWarning(token)`.
 *
 * ## Exactly what it does NOT catch
 *
 * This list is longer than the one above, and that is the point:
 *
 *  1. control flow: an early `return null` under `if (isQuickLaunch) {`;
 *  2. a one-hop alias: `const suppress = isQuickLaunch`, then `showTokenWarning && !suppress`;
 *  3. the flag handed to a component as a prop: `<TokenWarningCard suppressed={isQuickLaunch} />`;
 *  4. a quick-launch value passed as a function argument;
 *  5. **a gate that wraps the protection UI in a JSX subtree** — `{!isQuickLaunch && (` above a
 *     `<MouseoverTooltip>` / `<>` / `<Flex>` holding `<WarningIcon />`, where the two symbols end up
 *     on genuinely different logical lines;
 *  6. a gate renamed clean out of {@link PROTECTION_GATE_FRAGMENTS}.
 *
 * Shape 5 *was* caught, by a bracket-depth subtree walk that has been removed. Over eight review
 * rounds every fix to that walk opened another hole in the same class — it miscounted brackets over
 * stripped-but-unparsed text, so a stray `)` in JSX prose could either fold into a gate head and
 * scan a live coupling clean, or swallow a gate's closer and red an unrelated author's file that
 * contained no coupling at all. Both failure directions were worse than the blind spot: one is a
 * false green on the exact thing being guarded, the other reds `main` for someone else. Catching
 * shape 5 properly needs a parser, i.e. a type-aware lint rule over the real AST — and shape 5 is
 * covered behaviourally by `AuctionHeader.test.tsx` at the surface that actually renders it.
 *
 * **Read this list before treating a green run as proof.** A green here means "nobody wrote the one
 * shape below on one line", not "quick launch cannot suppress protection".
 *
 * The single-`CurrencyInfo` signature on `auctionTokenProtection.ts` constrains only shape 4, and
 * only for those two helpers — not a component prop and not a local rename.
 *
 * Two things this scanner deliberately does not rely on, each of which made an earlier revision
 * report green over a live regression:
 *  - a hand-written list of helper names — the render gates read *derived booleans*
 *    (`showTokenWarning`, `shouldShowTokenWarning`), so matching is by symbol fragment;
 *  - a hand-maintained file list — it is path-pinned and goes stale silently, so the surfaces are
 *    discovered instead.
 *
 * The stripper's and the line-joiner's exact semantics live in the `the decoupling scanner itself`
 * block at the bottom of this file. **That is the place to add a shape** — whether you are closing
 * a bypass or pinning a false positive. If you find yourself adding bracket arithmetic there to
 * reach across lines, stop: that is the machinery that was removed, and the behavioural test is the
 * right place for the shape you are chasing.
 */

/** Paths are relative to `apps/web`, which is Vitest's cwd for this project. */
const WEB_SOURCE_ROOT = 'src'

/**
 * Fragments, not whole identifiers, and matched case-insensitively: the render gates read derived
 * booleans (`showTokenWarning`, `shouldShowTokenWarning`, `tokenWarningSeverity`) that share no
 * whole name with the helpers they call, and those are exactly the symbols a suppression would be
 * written against.
 */
const PROTECTION_GATE_FRAGMENTS = [
  'tokenwarning',
  'warningseverity',
  'tokenprotection',
  'protectionwarning',
  'warningicon',
  'safetyinfo',
  'protectioninfo',
  'isflagged',
  'blockaid',
]

const QUICK_LAUNCH_FRAGMENTS = ['quicklaunch', 'quick_launch']

function containsAny(text: string, fragments: string[]): boolean {
  const haystack = text.toLowerCase()
  return fragments.some((fragment) => haystack.includes(fragment))
}

const hasProtectionSymbol = (text: string): boolean => containsAny(text, PROTECTION_GATE_FRAGMENTS)
const hasQuickLaunchSymbol = (text: string): boolean => containsAny(text, QUICK_LAUNCH_FRAGMENTS)

/** A context the scanner entered and never left — in valid TypeScript, always a scanner bug. */
type UnterminatedContext = 'block comment' | 'template literal' | null

/**
 * A bare URL's `scheme:` sitting immediately before the `//` that truncates the line, so the whole
 * URL is blanked rather than cut mid-token. Anchored at the end of the text emitted so far, and
 * requiring a scheme shape, so an ordinary `// comment` after real code leaves that code alone.
 */
const URL_SCHEME_BEFORE_SLASHES = /[A-Za-z][A-Za-z0-9+.-]*:$/

/**
 * Blanks out comments and string/template literals while preserving line numbering, so prose that
 * legitimately discusses both concepts (and a `"$statusWarning"` color token on a quick-launch
 * badge) can't trip the scan.
 *
 * Single left-to-right pass, because the order matters. Three revisions of this scanner shipped a
 * runaway `/*` that blanked the rest of the FILE and made the whole suite pass vacuously:
 *  - first, block-comment detection ran *before* strings and `//` comments were removed, so a `/*`
 *    inside `'https://pools.trade/*'` or `// match src/features/*` was honoured as a comment;
 *  - then, quote scanning was bounded to one physical line, so an opening backtick on a **multi-line
 *    template literal** never found its close, the literal's body was scanned as source, and a `/*`
 *    inside it flipped the same switch;
 *  - then, a span whose brackets did not balance was handed back to the scanner to be re-read as
 *    code, so a `/*` inside an unbalanced angle-bracket literal (`'src/<name>(/*.tsx'`) was honoured
 *    after all. A quoted span is now consumed on **every** branch — see the comment at the branch.
 *
 * Hence both `inBlockComment` and `inTemplateLiteral` persist across lines, and `unterminated`
 * reports either one still being open at EOF. Valid TypeScript never ends inside either, so callers
 * scanning real files assert it is `null` — that turns any future runaway into a red instead of a
 * silent blank-out.
 */
function scanSource(source: string): { code: string; unterminated: UnterminatedContext } {
  const output: string[] = []
  let inBlockComment = false
  let inTemplateLiteral = false

  for (const rawLine of source.split('\n')) {
    let stripped = ''
    let index = 0

    while (index < rawLine.length) {
      if (inBlockComment) {
        const blockEnd = rawLine.indexOf('*/', index)
        if (blockEnd === -1) {
          break
        }
        inBlockComment = false
        stripped += ' '
        index = blockEnd + '*/'.length
        continue
      }

      if (inTemplateLiteral) {
        const literalEnd = findClosingQuote({ line: rawLine, openedAt: index - 1, quote: '`' })
        if (literalEnd === -1) {
          break
        }
        inTemplateLiteral = false
        index = literalEnd + 1
        continue
      }

      const delimiter = rawLine.slice(index, index + 2)
      if (delimiter === '/*') {
        inBlockComment = true
        stripped += ' '
        index += 2
        continue
      }
      // `\/` is an escaped slash inside a regex literal, not a comment: any `//` in a regex has one
      // immediately before it, since an unescaped slash would have ended the regex.
      //
      // Everything else — including a bare URL's `//` — truncates the line here. Truncating drops
      // whatever followed on the physical line, which is what keeps a `/*` later in a URL path from
      // opening a block comment and blanking the file. An earlier revision consumed the URL token
      // instead, to preserve the brackets after it for the subtree walk's depth count; that walk is
      // gone, and the token scan is what swallowed a URL's closing `)`.
      if (delimiter === '//' && rawLine.charAt(index - 1) !== '\\') {
        // Truncating alone cut a bare URL mid-token, leaving the line ending in `https:` — a trailing
        // continuation, so the next physical line folded in and two unrelated lines read as one
        // coupling. Blanking the scheme leaves the joiner nothing to continue from.
        stripped = stripped.replace(URL_SCHEME_BEFORE_SLASHES, ' ')
        break
      }

      const char = rawLine.charAt(index)
      if (char === "'" || char === '"' || char === '`') {
        // A quote glued to the end of a word is a trailing apostrophe (`Don't`). Emit it and keep
        // scanning: what follows is real code, and consuming to some later quote would blank it.
        if (isTrailingApostrophe({ line: rawLine, at: index, quote: char })) {
          stripped += char
          index += 1
          continue
        }

        const closingQuote = findClosingQuote({ line: rawLine, openedAt: index, quote: char })
        if (closingQuote === -1) {
          // A backtick with no close on this line opens a multi-line template literal, and its body
          // is data, not code. Only reachable with no close: a backtick that *does* close here is
          // handled below, and mistaking one for a multi-line opener sent the scanner to EOF on
          // `setupTests.ts`, whose nested `${…}` templates pair a backtick with an inner one.
          if (char === '`') {
            inTemplateLiteral = true
            stripped += '``'
            break
          }
          // `'`/`"` cannot legally span lines, so an unterminated one is an apostrophe in JSX prose.
          stripped += char
          index += 1
          continue
        }

        {
          const body = rawLine.slice(index + 1, closingQuote)
          // A quoted span is *always* consumed, on every branch — the scanner never re-enters
          // delimiter decisions on text between two quotes. That is the whole guarantee that a `/*`
          // inside a string cannot open a block comment and blank the rest of the file. An earlier
          // revision let a mispaired span fall through and be rescanned as code, which held that
          // guarantee only on the balanced branch: `'src/<name>(/*.tsx'` is unbalanced, so its `/*`
          // was honoured and every coupling below it vanished, with a later docblock's `*/` closing
          // the comment so the EOF check stayed silent too.
          //
          // How much of the body survives depends on what the span is. Raw `<`/`>` means either a
          // real literal containing angle brackets (`'src/<name>/*.tsx'`) or prose whose leading
          // apostrophe swallowed a tag (`'til close</Text>…`), told apart by bracket balance — a
          // backtick span is never prose. A real literal is reduced to identifiers, since a
          // coupling quoted inside a string is not a coupling. Prose keeps everything except the
          // delimiter characters, because a gate written after the apostrophe is real code that has
          // to stay matchable — blanking it is the silent green this check exists to prevent.
          if (!/[<>]/.test(body)) {
            stripped += char + char
          } else {
            const isRealLiteral = char === '`' || isBracketBalanced(body)
            stripped += isRealLiteral ? neutralizeToIdentifiers(body) : neutralizeDelimiterCharacters(body)
          }
          index = closingQuote + 1
          continue
        }
      }

      stripped += char
      index += 1
    }

    output.push(stripped)
  }

  const unterminated: UnterminatedContext = inBlockComment
    ? 'block comment'
    : inTemplateLiteral
      ? 'template literal'
      : null

  return { code: output.join('\n'), unterminated }
}

function stripCommentsAndStringLiterals(source: string): string {
  return scanSource(source).code
}

/**
 * An apostrophe in JSX prose is not a string delimiter, and treating it as one is not harmless: it
 * pairs with the next unrelated quote on the line and blanks everything between them, erasing a live
 * coupling while leaving the quotes balanced so the EOF check stays silent. Both directions occur:
 *
 *  - trailing (`Don't`, `You're`) — the quote is glued to the end of a word;
 *  - leading (`'til`, `'em`, `rock 'n' roll`) — the quote sits in what looks like code position, so
 *    position alone cannot separate `'til close</Text>` from `'a string'`.
 *
 * Two independent rules, either of which disqualifies a quote. First, a quote in *code* position
 * never directly follows an identifier character. Second, a real string literal does not contain
 * raw `<` or `>` — those are JSX markup, so a "literal" spanning them is prose that swallowed a tag.
 * The second rule is what catches the leading case, and it fails in the safe direction: at worst
 * some prose is scanned as code, never a gate blanked out of existence.
 *
 * Backticks are excluded: `` css`…` `` and other tagged templates are real.
 */
function isTrailingApostrophe({ line, at, quote }: { line: string; at: number; quote: string }): boolean {
  return quote !== '`' && at > 0 && /[A-Za-z0-9_$]/.test(line.charAt(at - 1))
}

/**
 * Blanks everything that is not an identifier character. Keeping only identifiers is deliberate: an
 * earlier revision blanked just the obvious delimiters and left the joiner's continuation tokens
 * behind, so `const LABEL = 'Delete <name>?'` emitted a line ending in `?` and folded the next
 * statement into it — two unrelated lines reported as a coupling.
 */
function neutralizeToIdentifiers(body: string): string {
  return body.replace(/[^A-Za-z0-9_$]/g, ' ')
}

/**
 * Blanks only the characters that can open a comment, string or template context. Used on a span
 * the balance check calls mispaired prose: everything that lets a gate hidden after the apostrophe
 * still match — the identifiers and the boolean operators joining them — survives, while nothing
 * left in the span can steer the scanner past the closing quote.
 */
function neutralizeDelimiterCharacters(body: string): string {
  return body.replace(/[`'"/]/g, ' ')
}

/**
 * Whether `body`'s brackets pair up within it, never dipping below zero. Sole purpose: telling a
 * real string literal containing angle brackets from JSX prose whose apostrophe swallowed a tag.
 *
 * Braces count for the same reason parens and squares do: with only `()`/`[]` counted, a prose
 * apostrophe plus a later quoted attribute on one line balanced, so the whole gate between the two
 * quotes was reduced to identifiers — `!` and `&&` with it — a silent green over a live suppression.
 */
function isBracketBalanced(body: string): boolean {
  let depth = 0

  for (const char of body) {
    if (char === '(' || char === '[' || char === '{') {
      depth += 1
    } else if (char === ')' || char === ']' || char === '}') {
      depth -= 1
      if (depth < 0) {
        return false
      }
    }
  }

  return depth === 0
}

/**
 * Scans from `openedAt + 1` for the next unescaped `quote`. Bounded to one physical line by design;
 * the multi-line case is carried by `inTemplateLiteral` in the caller.
 */
function findClosingQuote({ line, openedAt, quote }: { line: string; openedAt: number; quote: string }): number {
  for (let index = openedAt + 1; index < line.length; index++) {
    const char = line.charAt(index)
    if (char === '\\') {
      index++
      continue
    }
    if (char === quote) {
      return index
    }
  }
  return -1
}

/**
 * Tokens that leave an expression unfinished, so whatever follows is part of the same expression.
 * Deliberately excludes `,` and block braces: joining on those would swallow argument lists,
 * dependency arrays and whole function bodies, and two unrelated symbols in one `useMemo` are not
 * a coupling. `=` also covers `=>`, `===`, `!==`, `>=` and `<=`.
 */
const TRAILING_CONTINUATIONS = ['&&', '||', '??', '?', ':', '=', '(', '[']

/** Tokens that mark a line as the continuation of the previous one (ternary arms, chains). */
const LEADING_CONTINUATIONS = ['&&', '||', '??', '?', ':', ')', '.']

/**
 * A `switch` label ends in `:` but is not an unfinished expression. Folding one into its body made
 * `case AuctionQuickFilter.QuickLaunch:` + `return !showTokenWarning` read as a coupling — a *false
 * positive*, which is worse than a blind spot here: it would red this Toucan-owned test on `main`
 * for whoever happened to write that switch, anywhere in `apps/web`.
 */
const SWITCH_LABEL = /\b(?:case\b[^:]*|default)\s*:$/

/**
 * A suppression is always a *gate*: the quick-launch flag has to be wired to the protection signal
 * through a boolean or conditional operator to change what renders. Requiring one keeps mere
 * co-occurrence — a `useMemo` dependency array or a prop list naming both concerns — from reading
 * as a coupling. `?.` and `!=` are excluded; they are not gates.
 *
 * This is a necessary condition for a match, not a sufficient one for decoupling — see the module
 * docstring for the suppression shapes that carry no such operator and are not caught.
 */
const GATING_OPERATOR = /&&|\|\||\?\?|\?[^.]|![^=]/

/**
 * A physical line continues the current logical line when the text so far is unfinished, or when
 * the next line opens with a continuation token. A blank line (or one blanked out by the comment
 * stripper) never *starts* a continuation, but it also can't break one that is already open — a
 * comment in the middle of a multi-line condition must not hide the rest of it.
 */
function continuesExpression({ accumulated, nextLine }: { accumulated: string; nextLine: string }): boolean {
  const soFar = accumulated.trimEnd()
  if (TRAILING_CONTINUATIONS.some((token) => soFar.endsWith(token)) && !SWITCH_LABEL.test(soFar)) {
    return true
  }

  const next = nextLine.trim()
  return next !== '' && LEADING_CONTINUATIONS.some((token) => next.startsWith(token))
}

/**
 * Folds physical lines into logical ones, so a coupling the formatter wrapped across lines is
 * scanned as the single expression it is. This is a joiner, not a parser: it never tries to
 * understand the code, only to avoid cutting one expression in half.
 *
 * Scope, precisely: this joins on **operators only** — an unfinished tail, or a next line opening
 * with a continuation token. It does *not* fold on bracket depth, and nothing here reaches past the
 * end of an expression into a JSX subtree: a revision that folded on depth joined argument lists
 * into their dependency arrays and swallowed whole subtrees, producing false positives. Braces and
 * commas are not join points either, so blocks, argument lists and dependency arrays stay separate.
 *
 * Measured over the whole scanned corpus — all 2047 non-fixture sources under `apps/web/src`: no
 * fold exceeds 30 physical lines and none runs to end of file. If you widen the fold, re-run that
 * measurement: a fold that reaches EOF means a delimiter is being miscounted, and it will swallow
 * unrelated code.
 */
function toLogicalLines(source: string): { line: number; text: string }[] {
  const logicalLines: { line: number; text: string }[] = []

  for (const [index, physicalLine] of source.split('\n').entries()) {
    const current = logicalLines.at(-1)

    if (current && continuesExpression({ accumulated: current.text, nextLine: physicalLine })) {
      const continuation = physicalLine.trim()
      // Keep the first line verbatim and append the rest space-separated, so a single-line result
      // is byte-identical to the raw source line and a joined one stays readable in the failure.
      current.text = continuation === '' ? current.text : `${current.text} ${continuation}`
    } else {
      logicalLines.push({ line: index + 1, text: physicalLine })
    }
  }

  return logicalLines
}

/**
 * Every logical line on which the quick-launch flag and a token-protection signal are wired together
 * by a gating operator. One expression, one line — nothing here walks into a JSX subtree.
 */
function findCoupledLines(source: string): { line: number; text: string }[] {
  return toLogicalLines(stripCommentsAndStringLiterals(source)).filter(
    ({ text }) => hasProtectionSymbol(text) && hasQuickLaunchSymbol(text) && GATING_OPERATOR.test(text),
  )
}

function collectSourceFiles(directory: string): string[] {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        return entry.name === 'node_modules' || entry.name === '__generated__' ? [] : collectSourceFiles(entryPath)
      }
      const isSource = /\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts')
      const isFixture = /\.(test|spec|stories)\.tsx?$/.test(entry.name)
      return isSource && !isFixture ? [entryPath] : []
    })
    .sort()
}

const ALL_WEB_SOURCES = collectSourceFiles(WEB_SOURCE_ROOT)

/**
 * Discovered from the RAW text, never the stripped text: if the stripper ever blanks a file out,
 * that file must still be scanned (and fail the vacuity assertion below) rather than quietly drop
 * off the list. Any new auction surface that grows both concerns is picked up automatically.
 */
const SURFACES_WITH_BOTH_CONCERNS = ALL_WEB_SOURCES.filter((filePath) => {
  const source = fs.readFileSync(filePath, 'utf8')
  return hasProtectionSymbol(source) && hasQuickLaunchSymbol(source)
})

describe('quick-launch / token-protection decoupling', () => {
  it('discovers the surfaces to scan rather than trusting a hand-maintained list', () => {
    // Both bounds exist to make a silent no-op impossible: a broken walk scans nothing, and a
    // discovery predicate that stops matching would leave the suite green over every surface.
    expect(ALL_WEB_SOURCES.length).toBeGreaterThan(1000)
    expect(SURFACES_WITH_BOTH_CONCERNS.length).toBeGreaterThan(0)
  })

  /**
   * Fragment matching has the same silent-staleness mode as the path-pinned list it replaced: if
   * the gates are renamed clean out of {@link PROTECTION_GATE_FRAGMENTS}, every scan below matches
   * nothing and reports green. These two fragments are the load-bearing ones — `tokenwarning`
   * covers the render gates, their derived booleans and the card/modal; `quicklaunch` covers the
   * flag — so if either stops matching real code, the scan has quietly emptied out and this names
   * which one. The narrower fragments (`blockaid`, `protectioninfo`, …) may legitimately match
   * nothing in `apps/web`, so they are not asserted.
   */
  it.each(['tokenwarning', 'quicklaunch'])('keeps both symbol families matching real sources: %s', (fragment) => {
    const scanned = SURFACES_WITH_BOTH_CONCERNS.map((filePath) =>
      stripCommentsAndStringLiterals(fs.readFileSync(filePath, 'utf8')).toLowerCase(),
    )

    expect(
      scanned.some((code) => code.includes(fragment)),
      `no scanned source contains "${fragment}" any more — the gates were probably renamed, and every scan in this file is now matching nothing`,
    ).toBe(true)
  })

  it.each(SURFACES_WITH_BOTH_CONCERNS)('keeps the quick-launch flag out of every gate in %s', (relativePath) => {
    const source = fs.readFileSync(relativePath, 'utf8')

    // Vacuity guard, and the exact one: every runaway this scanner has shipped ended with a
    // delimiter still open at EOF, blanking everything after it. Valid TypeScript never ends inside
    // a block comment or a template literal, so a non-null value here is always a scanner bug — and
    // it reds instead of quietly scanning a blank file. A symbol-presence check cannot replace it:
    // surfaces are selected from raw text, so a file whose only quick-launch mention is prose (the
    // `TopAuctionsTable` flagged-hiding comment) legitimately has none left after stripping.
    const { unterminated } = scanSource(source)
    expect(
      unterminated,
      `the stripper never closed a ${unterminated} in ${relativePath}, so everything after it went unscanned and the result below proves nothing`,
    ).toBeNull()

    const coupled = findCoupledLines(source)

    expect(
      coupled,
      `${relativePath} couples the quick-launch flag to a token-protection gate:\n` +
        coupled.map(({ line, text }) => `  ${line}: ${text.trim()}`).join('\n') +
        '\nThe flag is forgeable by construction — it must not gate a protection signal (LP-1076).',
    ).toEqual([])
  })

  it('keeps the shared gate itself unaware that quick launches exist', () => {
    const gatePath = ALL_WEB_SOURCES.find((filePath) => filePath.endsWith(`${path.sep}auctionTokenProtection.ts`))
    expect(gatePath, 'the shared auction token-protection gate module has moved or been deleted').toBeDefined()

    const gateSource = stripCommentsAndStringLiterals(fs.readFileSync(gatePath as string, 'utf8'))

    expect(hasQuickLaunchSymbol(gateSource)).toBe(false)
  })
})

describe('the decoupling scanner itself', () => {
  it('flags a suppression that hides the warning on quick launches', () => {
    const reintroducedCoupling = 'const shouldShowTokenWarning = !isQuickLaunch && getTokenWarningSeverity(token)\n'

    expect(findCoupledLines(reintroducedCoupling)).toEqual([{ line: 1, text: reintroducedCoupling.trimEnd() }])
  })

  it('flags a quick-launch exemption from the flagged-token hiding', () => {
    expect(findCoupledLines('if (isFlagged && !isQuickLaunchAuction(auction)) {\n')).toHaveLength(1)
  })

  /**
   * The render gates read derived booleans, not the helpers. A list of helper names cannot see
   * these, which is how an earlier revision reported green over the live regression shape.
   */
  it.each([
    '{!isQuickLaunch && showTokenWarning && <WarningIcon severity={severity} />}',
    '{!isQuickLaunch && shouldShowTokenWarning && token && <TokenWarningCard currencyInfo={token} />}',
    'const tokenWarningSeverity = isQuickLaunch ? WarningSeverity.None : getTokenWarningSeverity(token)',
  ])('flags a suppression written against a derived render-gate boolean: %s', (suppression) => {
    expect(findCoupledLines(suppression)).toHaveLength(1)
  })

  /**
   * The known blind spot, pinned so it stays visible instead of being rediscovered as a bug. A gate
   * that wraps the protection UI in a JSX subtree puts the two symbols on different logical lines,
   * and the bracket-depth walk that used to reach across them is gone — it could not count brackets
   * over unparsed JSX prose without either scanning a live coupling clean or redding a clean file.
   * `AuctionHeader.test.tsx` covers this shape behaviourally, at the surface that renders it.
   */
  it.each([
    [
      'a tooltip subtree',
      '  <MouseoverTooltip placement="top">',
      '    <WarningIcon severity={severity} />',
      '  </MouseoverTooltip>',
    ],
    ['a fragment', '  <>', '    <WarningIcon severity={severity} />', '  </>'],
    ['a Flex row', '  <Flex row>', '    <TokenWarningCard currencyInfo={token} />', '  </Flex>'],
  ])(
    'does NOT catch a JSX gate wrapping %s — known limitation, see the module docstring',
    (_name, open, body, close) => {
      expect(findCoupledLines(['{!isQuickLaunch && (', open, body, close, ')}'].join('\n'))).toEqual([])
    },
  )

  /**
   * The non-hugged `useMemo(` form, which the joiner *does* start folding because the head ends in
   * `(`. The hugged `useMemo(() => {` form ends in `{`, which is not a join point, so it could not
   * have surfaced this. Two symbol families in one `useMemo` are not a coupling.
   */
  it('does not fold a multi-line call through to its dependency array', () => {
    const nonHugged = [
      'const columns = useMemo(',
      '  () => buildColumns({ hideFlagged: !isFlagged }),',
      '  [isFlagged, isQuickLaunchFilterEnabled],',
      ')',
    ].join('\n')

    expect(findCoupledLines(nonHugged)).toEqual([])
  })

  it('leaves ordinary slashes alone: division and JSX self-closing punctuation', () => {
    expect(stripCommentsAndStringLiterals('const n = total / count')).toBe('const n = total / count')
    expect(stripCommentsAndStringLiterals('<Flex flex={1} />')).toBe('<Flex flex={1} />')
  })

  it('does not let a leading prose apostrophe blank the gate that follows it', () => {
    const source = "<Text>{n} 'til close</Text>{!isQuickLaunch && showTokenWarning && <WarningIcon />}{t('x')}"

    expect(findCoupledLines(source)).toHaveLength(1)
  })

  /**
   * The round-4 silent green. The pin above survives only because `t('x')`'s `(` happens to leave the
   * span unbalanced; end the line on a quoted JSX attribute instead and the `()`/`[]`-only balance
   * check called the span a real literal, reducing the gate between the two quotes to identifiers and
   * taking its `!` and `&&` with it. {@link isBracketBalanced} counts braces for exactly this.
   */
  it('does not let a prose apostrophe pair with a later quoted attribute and blank the gate', () => {
    const source = "<Text>'til close</Text>{!isQuickLaunch && showTokenWarning && <WarningIcon testID='w' />}"

    expect(findCoupledLines(source)).toHaveLength(1)
    expect(scanSource(source).unterminated).toBeNull()
  })

  /**
   * The serious one from the fifth review round. The `<>` prose rule handed a real literal's body
   * back to the delimiter scanner, so a `/*` inside a string blanked the lines below it — and a later
   * docblock closed the comment, leaving `unterminated` null and the vacuity guard silent.
   */
  it('does not let an angle-bracket-bearing literal blank the gate below it', () => {
    const source = [
      "const GLOB = 'src/<name>/*.tsx'",
      'const shouldShowTokenWarning = !isQuickLaunch && showTokenWarning',
      '/** later docblock */',
    ].join('\n')

    expect(findCoupledLines(source)).toHaveLength(1)
    expect(scanSource(source).unterminated).toBeNull()
  })

  it.each([
    ['a // inside an angle-bracket literal', "const P = 'a<b>//c'"],
    ['an unbalanced bracket inside one', "const P = 'a<b>(('"],
    ['a quote inside one', 'const P = "a<b>\'c"'],
    // The round-3 finding, and the reason a mispaired span is no longer rescanned as code: this one
    // is unbalanced, so it took the rescan branch and its `/*` opened a real block comment. The
    // later docblock closed it again, so `unterminated` stayed null and the vacuity guard never
    // fired — a live coupling scanned clean with nothing reported.
    ['a /* behind an unbalanced bracket inside one', "const GLOB = 'src/<name>(/*.tsx'"],
  ])('keeps an angle-bracket literal from steering the scanner: %s', (_name, decoy) => {
    const source = [decoy, 'const shouldShowTokenWarning = !isQuickLaunch && showTokenWarning'].join('\n')

    expect(findCoupledLines(source)).toHaveLength(1)
    expect(scanSource(source).unterminated).toBeNull()
  })

  /**
   * A bare URL's `//` truncates the physical line, exactly like a real line comment, so a `/*` later
   * in the path is never scanned and cannot blank the file. The URL is *not* tokenised any more: the
   * token scan existed to preserve the brackets after the URL for the subtree walk's depth count, and
   * it swallowed a URL's own closing `)` along the way.
   */
  it('truncates at a bare URL, so a /* in its path cannot open a comment', () => {
    const source = [
      '<Text>See https://pools.trade/*</Text>',
      'const shouldShowTokenWarning = !isQuickLaunch && showTokenWarning',
      '/** later docblock */',
    ].join('\n')

    expect(findCoupledLines(source)).toHaveLength(1)
    expect(scanSource(source).unterminated).toBeNull()
  })

  /**
   * The round-4 false positive. Truncating at `//` alone left the line ending in `https:`, a trailing
   * continuation, so the next physical line folded in and a quick-launch-named element sitting above an
   * ordinary warning gate read as one expression — a red on source carrying no coupling at all, i.e. on
   * an unrelated author's PR. The scheme is blanked with the rest of the URL, so no token is left to
   * continue from.
   */
  it('does not fold the next line in after a bare URL', () => {
    const source = [
      '<QuickLaunchLink>See https://docs.uniswap.org/quick-launch</QuickLaunchLink>',
      '{showTokenWarning && <WarningIcon severity={severity} />}',
    ].join('\n')

    expect(stripCommentsAndStringLiterals(source).split('\n')[0]?.trimEnd()).toBe('<QuickLaunchLink>See')
    expect(findCoupledLines(source)).toEqual([])
  })

  /**
   * The round-2 false positive, pinned. A parenthesized bare URL inside a quick-launch gate lost its
   * closing `)` to the URL token scan, leaving the gate's paren unmatched; the removed walk then
   * never rebalanced and its own miscount check redded the whole file — over source carrying no
   * coupling at all, i.e. on an unrelated author's PR. Nothing counts brackets across lines now, so
   * there is no depth to miscount and nothing to report.
   */
  it.each([
    ['a parenthesized URL inside the gate', '{!isQuickLaunch && (\n  <Text>(see https://uniswap.org/docs)</Text>\n)}'],
    ['the same shape on one line', 'return <div>{!isQuickLaunch && <span>(see https://uniswap.org/docs)</span>}</div>'],
    [
      'a URL whose gate closes normally',
      '{!isQuickLaunch && (\n  <Text>See https://pools.trade</Text>\n)}\nconst after = 1',
    ],
  ])('does not red a clean file over a parenthesized bare URL: %s', (_name, source) => {
    expect(findCoupledLines(source)).toEqual([])
    expect(scanSource(source).unterminated).toBeNull()
  })

  /**
   * The round-2 silent green, pinned as the limitation it now is. A stray prose closer on the line
   * directly below the gate folded into the head and cancelled its open paren, so the walk's own
   * entry condition never fired and a live coupling scanned clean while reporting no miscount either.
   * The gate below is genuinely a suppression; it is shape 5 in the module docstring, and
   * `AuctionHeader.test.tsx` is what catches it.
   */
  it('does NOT catch a gate whose wrapper line carries a stray prose closer — known limitation', () => {
    const foldedClose = [
      '{!isQuickLaunch && (',
      '  <Flex row>Step 1) connect',
      '    <WarningIcon severity={severity} />',
      '  </Flex>',
      ')}',
    ].join('\n')

    expect(findCoupledLines(foldedClose)).toEqual([])
  })

  it('blanks a literal down to identifiers, so it cannot steer the line joiner', () => {
    // `'Delete <name>?'` used to emit a line ending in `?`, folding the next statement into it.
    const source = ["const LABEL = 'Delete <name>?'", 'const showTokenWarning = isQuickLaunchAuction(auction)'].join(
      '\n',
    )

    expect(findCoupledLines(source)).toEqual([])
  })

  /**
   * Wrapped shapes the joiner still folds back into one logical line, so they stay caught even with
   * the subtree walk gone: in each one the two symbol families end up on the *same* logical line,
   * either because the head already names both or because the continuation rules reach the element.
   * Pinned so a future narrowing of the joiner does not quietly trade detection for precision.
   */
  it.each([
    [
      'protection first, flag after an inner call',
      '{showTokenWarning && !isQuickLaunchAuction(auction) && (\n  <WarningIcon severity={severity} />\n)}',
    ],
    ['gate nested inside call arguments', 'render(\n  !isQuickLaunch && (\n    <WarningIcon />\n  )\n)'],
    ['flag on its own line above the wrap', '{!isQuickLaunch &&\n  showTokenWarning && (\n    <WarningIcon />\n  )}'],
  ])('still catches a suppression where the flag follows an open paren: %s', (_name, shape) => {
    expect(findCoupledLines(shape)).not.toEqual([])
  })

  it('does not fold a call whose head names quick launch through to a protection deps array', () => {
    const mirrored = [
      'const visible = useMemo(',
      '  () => auctions.filter((a) => !isQuickLaunch),',
      '  [auctions, isQuickLaunch, showTokenWarning],',
      ')',
    ].join('\n')

    expect(findCoupledLines(mirrored)).toEqual([])
  })

  it('does not fold a switch label into its body', () => {
    const realisticSwitch = [
      'switch (quickFilter) {',
      '  case AuctionQuickFilter.QuickLaunch:',
      '    return !showTokenWarning',
      '  case AuctionQuickFilter.Completed:',
      '    return isCompleted',
      '  default:',
      '    return true',
      '}',
    ].join('\n')

    expect(findCoupledLines(realisticSwitch)).toEqual([])
  })

  /**
   * An apostrophe in JSX prose is not a string delimiter. Treating it as one paired it with the next
   * unrelated quote and blanked the code between them — erasing a live coupling on a single line,
   * with the quotes balanced so the EOF check stayed silent.
   */
  it('does not let a JSX prose apostrophe blank the gate that follows it', () => {
    const source =
      "<Text>Don't</Text>{!isQuickLaunch && showTokenWarning && <WarningIcon severity={severity} />}{t('x')}"

    expect(findCoupledLines(source)).toHaveLength(1)
  })

  it('still strips ordinary string literals, including ones containing operators', () => {
    expect(stripCommentsAndStringLiterals("const a = t('key')")).toBe("const a = t('')")
    expect(stripCommentsAndStringLiterals("const c = 'a && b'")).toBe("const c = ''")
    expect(stripCommentsAndStringLiterals('const b = "x && y"')).toBe('const b = ""')
    // The gate is invisible inside a literal, so a string that merely quotes one is not a coupling.
    expect(findCoupledLines("const copy = 'isQuickLaunch && showTokenWarning'")).toEqual([])
  })

  it('does not mistake an escaped slash in a regex for a line comment', () => {
    const source = [
      "const host = url.replace(/^https?:\\/\\//i, '')",
      'const shouldShowTokenWarning = !isQuickLaunch && showTokenWarning',
    ].join('\n')

    // `\/` must not read as a line comment: truncating there would drop the rest of the expression.
    expect(stripCommentsAndStringLiterals(source).split('\n')[0]).toContain('replace(')
    expect(findCoupledLines(source)).toHaveLength(1)
  })

  it('flags the JSX gate the formatter wrapped across three lines', () => {
    const wrapped = ['{!isQuickLaunch && (', '  <WarningIcon severity={severity} />', ')}'].join('\n')

    expect(findCoupledLines(wrapped)).toEqual([
      { line: 1, text: '{!isQuickLaunch && ( <WarningIcon severity={severity} /> )}' },
    ])
  })

  it('flags an appended suppression that the formatter wrapped onto its own line', () => {
    const wrapped = [
      'const shouldShowTokenWarning =',
      '  shouldShowAuctionTokenWarning(token) &&',
      '  !isQuickLaunch',
    ].join('\n')

    expect(findCoupledLines(wrapped)).toHaveLength(1)
  })

  it('flags a wrapped condition and a wrapped ternary', () => {
    const wrappedCondition = ['if (', '  isFlagged &&', '  !isQuickLaunchAuction(auction)', ') {'].join('\n')
    const wrappedTernary = [
      'const severity = isQuickLaunch',
      '  ? WarningSeverity.None',
      '  : getAuctionTokenWarningSeverity(token)',
    ].join('\n')

    expect(findCoupledLines(wrappedCondition)).toHaveLength(1)
    expect(findCoupledLines(wrappedTernary)).toHaveLength(1)
  })

  it('flags a wrapped coupling with a comment line inside the expression', () => {
    const wrapped = [
      'const shouldShowTokenWarning =',
      '  // still on for every auction',
      '  !isQuickLaunch && showTokenWarning',
    ].join('\n')

    expect(findCoupledLines(wrapped)).toHaveLength(1)
  })

  /**
   * A `/*` that the stripper honours in the wrong context blanks the rest of the file, and every
   * coupling below it disappears. Both triggers here are ordinary code.
   */
  it.each(["const HREF = 'https://pools.trade/*'", '// match src/features/*', 'const GLOB = "src/**/*.tsx"'])(
    'keeps scanning after a /* that is not a block comment: %s',
    (decoy) => {
      const source = [decoy, 'const shouldShowTokenWarning = !isQuickLaunch && showTokenWarning'].join('\n')

      expect(findCoupledLines(source)).toHaveLength(1)
    },
  )

  /**
   * The run-2 defect: `findClosingQuote` is bounded to one physical line, so an opening backtick on
   * a multi-line template literal found no close, the literal's body was scanned as source, and a
   * `/*` inside it blanked the rest of the file.
   */
  it('keeps scanning past a /* inside a multi-line template literal', () => {
    const source = [
      'const QUERY = `',
      '  matches /* everything below here used to vanish',
      '`',
      'const shouldShowTokenWarning = !isQuickLaunch && shouldShowAuctionTokenWarning(token)',
    ].join('\n')

    expect(findCoupledLines(source)).toHaveLength(1)
  })

  it('reports a delimiter left open at EOF, and reports nothing on real sources', () => {
    expect(scanSource('const QUERY = `\n  unterminated').unterminated).toBe('template literal')
    expect(scanSource('/*\n  unterminated').unterminated).toBe('block comment')
    expect(scanSource('const QUERY = `\n  closed\n`\nconst fine = 1').unterminated).toBeNull()
    expect(scanSource("const HREF = 'https://pools.trade/*'").unterminated).toBeNull()
  })

  it('still blanks a template literal that legitimately spans lines', () => {
    const benign = ['const COPY = `', '  isQuickLaunch && showTokenWarning', '`', 'const fine = 1'].join('\n')

    expect(findCoupledLines(benign)).toEqual([])
  })

  /**
   * Verified bypasses, pinned so the limitation stays honest rather than being rediscovered. Each
   * needs alias / data-flow analysis to catch, which is a type-aware lint rule and not a source
   * scan. If you make one of these red, move it into the `flags …` block above.
   */
  it.each([
    ['control flow', 'if (isQuickLaunch) {\n  return null\n}\nreturn <WarningIcon severity={severity} />'],
    ['one-hop alias', 'const suppress = isQuickLaunch\nconst show = showTokenWarning && !suppress'],
    ['component prop', '<TokenWarningCard suppressed={isQuickLaunch} />'],
    [
      'ternary on an alias',
      'const suppress = isQuickLaunch\nconst s = suppress ? WarningSeverity.None : getTokenWarningSeverity(t)',
    ],
  ])('does NOT catch a suppression routed through %s — known limitation, see the module docstring', (_name, shape) => {
    expect(findCoupledLines(shape)).toEqual([])
  })

  it('still honours a real block comment, including an unterminated one', () => {
    const source = ['/* const bad = !isQuickLaunch && showTokenWarning */', 'const fine = 1'].join('\n')
    const unterminated = ['/*', 'const bad = !isQuickLaunch && showTokenWarning'].join('\n')

    expect(findCoupledLines(source)).toEqual([])
    expect(findCoupledLines(unterminated)).toEqual([])
  })

  it('does not join separate statements, dependency arrays, or a JSX tree into one expression', () => {
    const benign = [
      'const isQuickLaunch = useIsQuickLaunchAuction()',
      'const showTokenWarning = shouldShowAuctionTokenWarning(token)',
      '',
      'const columns = useMemo(() => {',
      '  return buildColumns({ isQuickLaunchFlagEnabled })',
      '}, [isQuickLaunchFlagEnabled, showTokenWarning])',
      '',
      'return (',
      '  <Flex>',
      '    {showTokenWarning && <WarningIcon severity={severity} />}',
      '    {!verified && isQuickLaunch && <Lightning />}',
      '  </Flex>',
      ')',
    ].join('\n')

    expect(findCoupledLines(benign)).toEqual([])
  })

  it('does not flag prose, color tokens, or the two concerns living apart', () => {
    const benign = [
      '// Warnings stay on for quick launches: the flag is forgeable and WarningSeverity must win.',
      '/** getTokenWarningSeverity is never gated on isQuickLaunch. */',
      'const isQuickLaunch = useIsQuickLaunchAuction()',
      'const severity = getAuctionTokenWarningSeverity(token)',
      '{!verified && isQuickLaunch && <Lightning color="$statusWarning" />}',
    ].join('\n')

    expect(findCoupledLines(benign)).toEqual([])
  })
})
