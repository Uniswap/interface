import { afterEach } from 'vitest'

/** A story's sign-off on an axe "needs review" result: the rule id and why it's fine there. */
interface A11yIncompleteAllowance {
  id: string
  reason: string
}

/** The composed story the Storybook vitest plugin puts on each story test's context; vitest's types don't know it. */
interface StoryTestContext {
  story?: {
    parameters: { a11y?: { test?: string; incomplete?: A11yIncompleteAllowance[] } }
    reporting: { reports: { type: string; result: unknown }[] }
  }
}

/**
 * Fails a story test on any axe "needs review" result (`incomplete`) the story hasn't listed in
 * `parameters.a11y.incomplete`. The a11y addon only fails on violations. This runs after the story
 * and its hooks have finished, so a failure here doesn't leak into the next story.
 */
afterEach((context) => {
  const { story } = context as unknown as StoryTestContext
  if (!story || story.parameters.a11y?.test === 'todo') {
    return
  }
  const allowances = story.parameters.a11y?.incomplete ?? []
  const missingReason = allowances.filter(({ reason }) => reason.trim() === '').map(({ id }) => id)
  if (missingReason.length > 0) {
    throw new Error(`a11y.incomplete entries need a reason: ${missingReason.join(', ')}`)
  }

  const report = story.reporting.reports.find(({ type }) => type === 'a11y')
  const incomplete = (report?.result as { incomplete?: AxeIncompleteResult[] } | undefined)?.incomplete ?? []
  const allowed = new Set(allowances.map(({ id }) => id))
  const unreviewed = incomplete.filter(({ id }) => !allowed.has(id))
  if (unreviewed.length > 0) {
    const details = unreviewed.flatMap(({ id, help, nodes }) => [
      `  ${id} (${help})`,
      ...nodes.map((node) => `    ${describeNode(node)}`),
    ])
    throw new Error(
      `axe couldn't settle these checks. Fix them, or add { id, reason } to parameters.a11y.incomplete:\n${details.join('\n')}`,
    )
  }
})

interface AxeCheck {
  message: string
  relatedNodes?: { target: unknown[] }[]
}

interface AxeIncompleteNode {
  target: unknown[]
  any: AxeCheck[]
  all: AxeCheck[]
  none: AxeCheck[]
}

interface AxeIncompleteResult {
  id: string
  help: string
  nodes: AxeIncompleteNode[]
}

/** The element's selector, axe's messages and the elements those name, such as what covers it. */
function describeNode({ target, any, all, none }: AxeIncompleteNode): string {
  const checks = [...any, ...all, ...none]
  const messages = checks.map(({ message }) => message).filter(Boolean)
  const related = checks.flatMap(({ relatedNodes = [] }) => relatedNodes.map((node) => node.target.join(' ')))
  return `${target.join(' ')}: ${messages.join('; ')}${related.length > 0 ? ` [related: ${related.join(', ')}]` : ''}`
}
