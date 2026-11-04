type ExpectedText = string | RegExp

type FunctionMatcher = (content: string, element: Element | null) => boolean

/**
 * React Native Testing Library types its queries as `string | RegExp` only. Suites that render
 * through react-native-web into jsdom go through DOM Testing Library at runtime, which does accept
 * a function matcher — so these matchers work there, but do not typecheck against the RNTL
 * signature. This keeps that one mismatch in a single documented place instead of at every call
 * site; DOM-typed suites (web) pass the matcher directly and don't need it.
 */
export const asTextMatch = (matcher: FunctionMatcher): string & RegExp => matcher as unknown as string & RegExp

const textMatches = (text: string, expected: ExpectedText): boolean =>
  typeof expected === 'string' ? text === expected : expected.test(text)

/**
 * Matches the innermost element whose full text content matches `expected` — exactly, for a
 * string; by test, for a RegExp.
 *
 * `AnimatedNumber` renders a formatted amount as nested text nodes — the integer part, then a
 * separate node holding the decimal separator and decimals so they can be faded — so a plain
 * `getByText('$45.66')` finds nothing even though the value is rendered and is read contiguously
 * by assistive tech. Matching on `textContent` keeps the assertion exact (it still proves the
 * full, correctly formatted value is present) while tolerating that split.
 *
 * Elements that have a child matching the same text are skipped, so the match lands on the node
 * that actually owns the text rather than on every ancestor that contains it.
 *
 * Elements inside an `aria-hidden` subtree never match, for every caller: the web `AnimatedNumber`
 * draws its value in aria-hidden digit cells and a copy overlay and exposes it as text once, to
 * assistive tech, and this is what keeps a lookup from finding all three. An assertion about content
 * that is deliberately `aria-hidden` needs a different query.
 *
 * Use this for negative assertions too (`queryByText(withText(...))`). A bare `queryByText` would
 * pass against a split value for the wrong reason — reporting "absent" when the value is present
 * but merely split across nodes.
 */
export const withText =
  (expected: ExpectedText) =>
  (_content: string, element: Element | null): boolean => {
    if (!element || !textMatches(element.textContent, expected) || element.closest('[aria-hidden="true"]')) {
      return false
    }

    return !Array.from(element.children).some((child) => textMatches(child.textContent, expected))
  }

/**
 * The native `AnimatedNumber` renders the same text several times as siblings: the visible node, plus
 * copies it uses for measurement and keeps out of the accessibility tree (`opacity: 0; position:
 * absolute` or `importantforaccessibility="no-hide-descendants"`). The web one hides its extra copies
 * with `aria-hidden`, which {@link withText} already skips.
 */
const isHiddenFromUser = (element: Element): boolean =>
  element.getAttribute('importantforaccessibility') === 'no-hide-descendants' ||
  /opacity:\s*0\s*(;|$)/.test(element.getAttribute('style') ?? '')

/**
 * Like {@link withText}, but skips `AnimatedNumber`'s hidden measurement copies so the match lands
 * on the node the user actually sees.
 *
 * Prefer this over `getAllByText(...)[0]` where a value renders more than once — selecting by index
 * would pass without proving which of the copies is the real one.
 */
export const withVisibleText = (expected: ExpectedText) => {
  const matchesText = withText(expected)

  return (content: string, element: Element | null): boolean => {
    if (!element || !matchesText(content, element)) {
      return false
    }

    for (let node: Element | null = element; node; node = node.parentElement) {
      if (isHiddenFromUser(node)) {
        return false
      }
    }

    return true
  }
}
