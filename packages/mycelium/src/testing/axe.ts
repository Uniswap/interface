import axe, { type AxeResults, type Result, type RunOptions } from 'axe-core'

/** WCAG 2.2 AA plus axe best practices; the Playwright and Storybook runners use the same set. */
export const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] as const

// jsdom has no layout engine, paint, or canvas text metrics (icon-ligature
// detection), so these rules cannot be evaluated there; the browser layers
// cover them. Page-level landmark rules are meaningless for a component fragment.
const JSDOM_DISABLED_RULES = [
  'color-contrast',
  'target-size',
  'scrollable-region-focusable',
  'label-content-name-mismatch',
  'region',
  'landmark-one-main',
  'page-has-heading-one',
] as const

/**
 * Runs axe over a rendered component. The element must be attached to `document`,
 * which Testing Library's `render` guarantees. Usage:
 * `expect(await runAxe(container)).toHaveNoAxeViolations()`.
 */
export async function runAxe(container: Element, options?: RunOptions): Promise<AxeResults> {
  return axe.run(container, {
    runOnly: { type: 'tag', values: [...AXE_TAGS] },
    ...options,
    rules: {
      ...Object.fromEntries(JSDOM_DISABLED_RULES.map((id) => [id, { enabled: false }])),
      ...options?.rules,
    },
  })
}

/** Matchers for `expect.extend`; registered in mycelium's `vitest-setup.ts`. */
export function createAxeMatcher(): {
  toHaveNoAxeViolations: (results: AxeResults) => { pass: boolean; message: () => string }
} {
  return {
    toHaveNoAxeViolations(results: AxeResults) {
      const pass = results.violations.length === 0
      return {
        pass,
        message: () =>
          pass ? 'Expected axe violations, found none' : `Expected no axe violations:\n${formatViolations(results)}`,
      }
    },
  }
}

declare module 'vitest' {
  interface Assertion<R, T> {
    toHaveNoAxeViolations(): T
  }
  interface AsymmetricMatchersContaining {
    toHaveNoAxeViolations(): unknown
  }
}

function formatViolations(results: AxeResults): string {
  return results.violations.map(formatViolation).join('\n')
}

function formatViolation(violation: Result): string {
  const [first] = violation.nodes
  const where = first ? ` at ${first.target.join(' ')}: ${first.html}` : ''
  const more = violation.nodes.length > 1 ? ` (+${violation.nodes.length - 1} more)` : ''
  return `  - ${violation.id} [${violation.impact ?? 'unknown'}] ${violation.help}${where}${more}\n    ${violation.helpUrl}`
}
