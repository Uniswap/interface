/**
 * Fixture suite for the migration review queue (INFRA-3039).
 * Run with `bun test scripts/tamagui-migration/review-queue`.
 *
 * Committed RED FIRST (stubs in review-queue.ts return empty/wrong values);
 * Phase B turns it green. Every spec trap has its own named fixture and the
 * meta-test at the bottom pins their existence (INFRA-2957 pattern).
 */
import { describe, expect, test } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { bucketPr, buildQueue, deriveRequester, extractLinearIssueIds, hasHumanAssignee, renderMarkdown } from './review-queue'
import type {
  ChecksRollup,
  PullRequest,
  QueueContext,
  QueueRow,
  RequestedReviewers,
  Review,
  ReviewQueue,
} from './types'

const FIXTURES_DIR = join(import.meta.dir, 'fixtures')

interface Fixture {
  description: string
  now: string
  defaultBranch: string
  podByLogin: Record<string, string>
  linearAssigneeByIssue?: Record<string, string | null>
  registryLogins?: string[]
  prs: PullRequest[]
  reviews: Record<string, Review[]>
  checks: Record<string, ChecksRollup>
  requestedReviewers: Record<string, RequestedReviewers>
}

function loadFixture(name: string): { prs: PullRequest[]; ctx: QueueContext } {
  const raw = readFileSync(join(FIXTURES_DIR, `${name}.json`), 'utf8')
  const fixture = JSON.parse(raw) as Fixture

  const numericRecord = <T>(record: Record<string, T>): Record<number, T> => {
    const out: Record<number, T> = {}
    for (const [key, value] of Object.entries(record)) {
      out[Number(key)] = value
    }
    return out
  }

  const basePrByRef: Record<string, number> = {}
  for (const pr of fixture.prs) {
    basePrByRef[pr.headRefName] = pr.number
  }

  return {
    prs: fixture.prs,
    ctx: {
      reviews: numericRecord(fixture.reviews),
      checks: numericRecord(fixture.checks),
      requestedReviewers: numericRecord(fixture.requestedReviewers),
      basePrByRef,
      defaultBranch: fixture.defaultBranch,
      now: fixture.now,
      podByLogin: fixture.podByLogin,
      podThrottle: { min: 3, max: 5 },
      linearAssigneeByIssue: fixture.linearAssigneeByIssue,
      registryLogins: fixture.registryLogins,
    },
  }
}

function pr(prs: PullRequest[], number: number): PullRequest {
  const found = prs.find((candidate) => candidate.number === number)
  if (!found) {
    throw new Error(`fixture has no PR #${number}`)
  }
  return found
}

function rowIn(rows: QueueRow[], number: number): QueueRow | undefined {
  return rows.find((row) => row.number === number)
}

function allRows(queue: ReviewQueue): QueueRow[] {
  return [
    ...queue.buckets.draftsByRequester,
    ...queue.buckets.needsIndependentReview,
    ...queue.buckets.changesRequested,
    ...queue.buckets.readyToMerge,
    ...queue.buckets.stackWaiting,
  ]
}

describe('trap 1: bot-only approvals count for nothing', () => {
  const { prs, ctx } = loadFixture('bot-only-approvals')

  test('a PR approved only by bots still needs independent review', () => {
    const queue = buildQueue(prs, ctx)
    const row = rowIn(queue.buckets.needsIndependentReview, 101)
    expect(row).toBeDefined()
    expect(rowIn(queue.buckets.readyToMerge, 101)).toBeUndefined()
  })

  test('bucketPr routes the bot-approved PR to needsIndependentReview', () => {
    const decision = bucketPr(pr(prs, 101), ctx)
    expect(decision).not.toBeNull()
    expect(decision?.bucket).toBe('needsIndependentReview')
  })

  test('a bot CHANGES_REQUESTED counts for nothing either', () => {
    const queue = buildQueue(prs, ctx)
    expect(rowIn(queue.buckets.changesRequested, 102)).toBeUndefined()
    expect(rowIn(queue.buckets.needsIndependentReview, 102)).toBeDefined()
  })

  test('bot logins never appear in a row’s reviewers list', () => {
    const queue = buildQueue(prs, ctx)
    const row = rowIn(queue.buckets.needsIndependentReview, 101)
    expect(row?.reviewers).toEqual([])
  })
})

describe('trap 2: requester self-approval never satisfies the independent bar', () => {
  const { prs, ctx } = loadFixture('requester-self-approval')

  test('requester-approved PR stays in needsIndependentReview', () => {
    const queue = buildQueue(prs, ctx)
    expect(rowIn(queue.buckets.needsIndependentReview, 201)).toBeDefined()
    expect(rowIn(queue.buckets.readyToMerge, 201)).toBeUndefined()
  })

  test('bucketPr agrees', () => {
    const decision = bucketPr(pr(prs, 201), ctx)
    expect(decision).not.toBeNull()
    expect(decision?.bucket).toBe('needsIndependentReview')
  })
})

describe('trap 3: independent human approval + green checks + base main = ready', () => {
  const { prs, ctx } = loadFixture('independent-approval-ready')

  test('lands in readyToMerge', () => {
    const queue = buildQueue(prs, ctx)
    expect(rowIn(queue.buckets.readyToMerge, 301)).toBeDefined()
  })

  test('row carries requester (assignee), age, base, and reviewer', () => {
    const queue = buildQueue(prs, ctx)
    const row = rowIn(queue.buckets.readyToMerge, 301)
    expect(row?.requester).toBe('alice')
    expect(row?.requesterSource).toBe('assignee')
    expect(row?.ageDays).toBe(3)
    expect(row?.baseRef).toBe('main')
    expect(row?.reviewers).toEqual(['bob'])
  })

  test('footer counts the open PR against the requester’s pod with the 3-5 throttle', () => {
    const queue = buildQueue(prs, ctx)
    expect(queue.footer.podCounts).toEqual({ 'swap-fe': 1 })
    expect(queue.footer.throttle).toEqual({ min: 3, max: 5 })
    expect(queue.footer.updatedAt).toBe(ctx.now)
  })
})

describe('trap 4: base branch is another open PR’s head = stackWaiting, not ready', () => {
  const { prs, ctx } = loadFixture('stacked-base-waiting')

  test('the approved stacked child waits on its base PR', () => {
    const queue = buildQueue(prs, ctx)
    expect(rowIn(queue.buckets.stackWaiting, 402)).toBeDefined()
    expect(rowIn(queue.buckets.readyToMerge, 402)).toBeUndefined()
  })

  test('bucketPr routes the child to stackWaiting', () => {
    const decision = bucketPr(pr(prs, 402), ctx)
    expect(decision).not.toBeNull()
    expect(decision?.bucket).toBe('stackWaiting')
  })

  test('the base PR itself still needs independent review', () => {
    const queue = buildQueue(prs, ctx)
    expect(rowIn(queue.buckets.needsIndependentReview, 401)).toBeDefined()
  })
})

describe('trap 5: latest human review CHANGES_REQUESTED wins; later bot approval never flips it', () => {
  const { prs, ctx } = loadFixture('changes-requested-latest')

  test('lands in changesRequested despite the later bot APPROVED', () => {
    const queue = buildQueue(prs, ctx)
    expect(rowIn(queue.buckets.changesRequested, 501)).toBeDefined()
    expect(rowIn(queue.buckets.readyToMerge, 501)).toBeUndefined()
    expect(rowIn(queue.buckets.needsIndependentReview, 501)).toBeUndefined()
  })

  test('bucketPr agrees', () => {
    const decision = bucketPr(pr(prs, 501), ctx)
    expect(decision).not.toBeNull()
    expect(decision?.bucket).toBe('changesRequested')
  })
})

describe('trap 6: drafts grouped by requester; derivation order assignee -> body line -> human author', () => {
  const { prs, ctx } = loadFixture('drafts-grouped-by-requester')

  // draftsByRequester is a FLAT array per the INFRA-2961 contract; grouping by
  // requester happens client-side, driven by each row's requester field.
  const draftsFor = (queue: ReviewQueue, requester: string): QueueRow[] =>
    queue.buckets.draftsByRequester.filter((row) => row.requester === requester)

  test('two drafts with the same assignee group together', () => {
    const queue = buildQueue(prs, ctx)
    expect(
      draftsFor(queue, 'alice')
        .map((row) => row.number)
        .sort(),
    ).toEqual([601, 602, 605])
  })

  test('deriveRequester: assignee wins', () => {
    expect(deriveRequester(pr(prs, 601))).toEqual({ login: 'alice', source: 'assignee' })
  })

  test('deriveRequester: "Requested by" body line when no assignee (login in the registry)', () => {
    expect(deriveRequester(pr(prs, 603), ctx.loginByName, ctx.linearAssigneeByIssue, ctx.registryLogins)).toEqual({
      login: 'bob',
      source: 'body',
    })
  })

  test('deriveRequester: human author when no assignee and no body line', () => {
    expect(deriveRequester(pr(prs, 604))).toEqual({ login: 'carol', source: 'author' })
  })

  test('deriveRequester: assignee beats a conflicting body line', () => {
    expect(deriveRequester(pr(prs, 605), ctx.loginByName, ctx.linearAssigneeByIssue, ctx.registryLogins)).toEqual({
      login: 'alice',
      source: 'assignee',
    })
  })

  test('body-line and author requesters get their own draft groups', () => {
    const queue = buildQueue(prs, ctx)
    expect(draftsFor(queue, 'bob').map((row) => row.number)).toEqual([603])
    expect(draftsFor(queue, 'carol').map((row) => row.number)).toEqual([604])
  })
})

describe('trap 7: unattributed requester is flagged, never guessed', () => {
  const { prs, ctx } = loadFixture('unattributed-draft')

  test('deriveRequester: bot author with no assignee and no body line = unattributed', () => {
    expect(deriveRequester(pr(prs, 701))).toEqual({ login: '', source: 'unattributed' })
  })

  test('the draft lands in draftsByRequester with a null requester', () => {
    const queue = buildQueue(prs, ctx)
    const group = queue.buckets.draftsByRequester.filter((row) => row.requester === null)
    expect(group.map((row) => row.number)).toEqual([701])
    expect(group[0]?.requesterSource).toBe('unattributed')
  })

  test('renderMarkdown flags the unattributed PR as needing manual assignment', () => {
    const markdown = renderMarkdown(buildQueue(prs, ctx))
    expect(markdown.toLowerCase()).toContain('unattributed')
  })
})

describe('trap 8: consumed team review requests carry no signal', () => {
  const { prs, ctx } = loadFixture('consumed-team-review-request')

  test('identical review state buckets identically whether the team request is consumed or pending', () => {
    const queue = buildQueue(prs, ctx)
    expect(rowIn(queue.buckets.readyToMerge, 801)).toBeDefined()
    expect(rowIn(queue.buckets.readyToMerge, 802)).toBeDefined()
  })

  test('bucketPr returns the same bucket for both', () => {
    const consumed = bucketPr(pr(prs, 801), ctx)
    const pending = bucketPr(pr(prs, 802), ctx)
    expect(consumed).not.toBeNull()
    expect(consumed?.bucket).toBe('readyToMerge')
    expect(pending?.bucket).toBe(consumed?.bucket)
  })
})

describe('trap 9: gtmq_* merge-queue heads are excluded entirely', () => {
  const { prs, ctx } = loadFixture('gtmq-merge-queue-excluded')

  test('the gtmq PR appears in no bucket while the control PR does', () => {
    const queue = buildQueue(prs, ctx)
    expect(rowIn(allRows(queue), 901)).toBeUndefined()
    expect(rowIn(queue.buckets.needsIndependentReview, 902)).toBeDefined()
  })

  test('bucketPr excludes gtmq heads with null', () => {
    expect(bucketPr(pr(prs, 901), ctx)).toBeNull()
  })

  test('the excluded PR never reaches the footer pod counts', () => {
    const queue = buildQueue(prs, ctx)
    expect(queue.footer.podCounts).toEqual({ 'swap-fe': 1 })
  })
})

describe('trap 10: do-not-merge labeled PRs are excluded entirely', () => {
  const { prs, ctx } = loadFixture('do-not-merge-excluded')

  test('labeled PRs appear in no bucket while the control PR does', () => {
    const queue = buildQueue(prs, ctx)
    expect(rowIn(allRows(queue), 1001)).toBeUndefined()
    expect(rowIn(allRows(queue), 1003)).toBeUndefined()
    expect(rowIn(queue.buckets.needsIndependentReview, 1002)).toBeDefined()
  })

  test('bucketPr excludes the label case-insensitively with null', () => {
    expect(bucketPr(pr(prs, 1001), ctx)).toBeNull()
    expect(bucketPr(pr(prs, 1003), ctx)).toBeNull()
  })

  test('excluded PRs never reach the footer pod counts', () => {
    const queue = buildQueue(prs, ctx)
    expect(queue.footer.podCounts).toEqual({ 'swap-fe': 1 })
  })

  test('footer carries the excluded count as an additive field', () => {
    const queue = buildQueue(prs, ctx)
    expect(queue.footer.excludedDoNotMerge).toBe(2)
  })

  test('renderMarkdown emits the excluded footer line when count > 0', () => {
    const markdown = renderMarkdown(buildQueue(prs, ctx))
    expect(markdown).toContain('_2 utility PR(s) excluded (do not merge)_')
  })

  test('renderMarkdown omits the excluded footer line when count is 0', () => {
    const clean = loadFixture('independent-approval-ready')
    const markdown = renderMarkdown(buildQueue(clean.prs, clean.ctx))
    expect(markdown).not.toContain('excluded (do not merge)')
  })

  test('label matching trims surrounding whitespace', () => {
    const padded: PullRequest = {
      ...pr(prs, 1001),
      labels: [{ name: 'tamagui-migration' }, { name: '  Do Not Merge  ' }],
    }
    expect(bucketPr(padded, ctx)).toBeNull()
  })
})

describe('trap 11: linear issue assignee resolves the requester', () => {
  const { prs, ctx } = loadFixture('linear-assignee-resolution')

  test('INFRA id in the TITLE resolves via linearAssigneeByIssue with source linear', () => {
    expect(deriveRequester(pr(prs, 1101), ctx.loginByName, ctx.linearAssigneeByIssue)).toEqual({
      login: 'cbachmeier',
      source: 'linear',
    })
  })

  test('INFRA id in the BODY resolves via linearAssigneeByIssue with source linear', () => {
    expect(deriveRequester(pr(prs, 1102), ctx.loginByName, ctx.linearAssigneeByIssue)).toEqual({
      login: 'cbachmeier',
      source: 'linear',
    })
  })

  test('an existing assignee still beats the linear step', () => {
    expect(deriveRequester(pr(prs, 1104), ctx.loginByName, ctx.linearAssigneeByIssue)).toEqual({
      login: 'alice',
      source: 'assignee',
    })
  })

  test('a registry-resolvable "Requested by @login" body line still beats the linear step', () => {
    expect(deriveRequester(pr(prs, 1105), ctx.loginByName, ctx.linearAssigneeByIssue, ctx.registryLogins)).toEqual({
      login: 'bob',
      source: 'body',
    })
  })

  test('an unresolvable display-name body line falls through to linear — never to the bot author', () => {
    expect(deriveRequester(pr(prs, 1107), ctx.loginByName, ctx.linearAssigneeByIssue)).toEqual({
      login: 'jmrossy',
      source: 'linear',
    })
  })

  test('a null map value (Linear consulted, no mappable human) stays unattributed', () => {
    expect(deriveRequester(pr(prs, 1103), ctx.loginByName, ctx.linearAssigneeByIssue)).toEqual({
      login: '',
      source: 'unattributed',
    })
  })

  test('a body cross-reference URL to an unrelated issue never attributes — stays unattributed', () => {
    expect(deriveRequester(pr(prs, 1108), ctx.loginByName, ctx.linearAssigneeByIssue)).toEqual({
      login: '',
      source: 'unattributed',
    })
  })

  test('buildQueue rows carry the linear requester + source', () => {
    const queue = buildQueue(prs, ctx)
    const row = rowIn(queue.buckets.draftsByRequester, 1101)
    expect(row?.requester).toBe('cbachmeier')
    expect(row?.requesterSource).toBe('linear')
  })
})

describe('trap 12: PENDING (unsubmitted) reviews count for nothing and never crash the run', () => {
  const { prs, ctx } = loadFixture('pending-review-null-submitted')

  test('buildQueue survives a PENDING review with a null submittedAt', () => {
    expect(() => buildQueue(prs, ctx)).not.toThrow()
  })

  test('a PR whose only human review is PENDING still needs independent review', () => {
    const queue = buildQueue(prs, ctx)
    expect(rowIn(queue.buckets.needsIndependentReview, 1201)).toBeDefined()
    expect(rowIn(queue.buckets.readyToMerge, 1201)).toBeUndefined()
    expect(rowIn(queue.buckets.changesRequested, 1201)).toBeUndefined()
  })

  test('the pending reviewer never appears in the reviewers list', () => {
    const queue = buildQueue(prs, ctx)
    expect(rowIn(queue.buckets.needsIndependentReview, 1201)?.reviewers).toEqual([])
  })

  test('a pending review alongside a real independent approval changes nothing', () => {
    const queue = buildQueue(prs, ctx)
    const row = rowIn(queue.buckets.readyToMerge, 1202)
    expect(row).toBeDefined()
    expect(row?.reviewers).toEqual(['bob'])
  })
})

describe('assignment plan: resolved requesters are written back, never overwriting', () => {
  const { prs, ctx } = loadFixture('linear-assignee-resolution')

  test('plan lists every unassigned PR whose requester resolved, with number/login/source', () => {
    const queue = buildQueue(prs, ctx)
    const plan = [...(queue.assignmentPlan ?? [])].sort((a, b) => a.number - b.number)
    expect(plan).toEqual([
      { number: 1101, login: 'cbachmeier', source: 'linear' },
      { number: 1102, login: 'cbachmeier', source: 'linear' },
      { number: 1105, login: 'bob', source: 'body' },
      { number: 1106, login: 'carol', source: 'author' },
      { number: 1107, login: 'jmrossy', source: 'linear' },
    ])
  })

  test('a PR with an existing assignee is never in the plan', () => {
    const queue = buildQueue(prs, ctx)
    expect(queue.assignmentPlan?.map((entry) => entry.number)).not.toContain(1104)
    expect(queue.assignmentPlan?.length).toBeGreaterThan(0)
  })

  test('an unresolvable PR stays out of the plan and stays flagged unattributed', () => {
    const queue = buildQueue(prs, ctx)
    expect(queue.assignmentPlan?.map((entry) => entry.number)).not.toContain(1103)
    const row = rowIn(allRows(queue), 1103)
    expect(row?.requester).toBeNull()
    expect(row?.requesterSource).toBe('unattributed')
  })

  test('the misattribution trap: a body URL to an unrelated issue never enters the plan', () => {
    const queue = buildQueue(prs, ctx)
    expect(queue.assignmentPlan.map((entry) => entry.number)).not.toContain(1108)
    const row = rowIn(allRows(queue), 1108)
    expect(row?.requester).toBeNull()
    expect(row?.requesterSource).toBe('unattributed')
  })

  test('a non-registry "Requested by @rando" body line NEVER enters the plan (spoof gate)', () => {
    const queue = buildQueue(prs, ctx)
    expect(queue.assignmentPlan.map((entry) => entry.number)).not.toContain(1109)
    expect(queue.assignmentPlan.map((entry) => entry.login)).not.toContain('rando')
  })

  test('the non-registry body login is ignored entirely: falls through to unattributed, no exclusion recorded', () => {
    const queue = buildQueue(prs, ctx)
    const row = rowIn(allRows(queue), 1109)
    expect(row?.requester).toBeNull()
    expect(row?.requesterSource).toBe('unattributed')
    // parseRequestedByLine drops the login at derivation, so buildQueue's
    // spoof gate (kept as defense-in-depth) never fires.
    expect(queue.assignmentPlanExclusions).toEqual([])
  })

  test('a registry body-line login (bob) stays plan-eligible', () => {
    const queue = buildQueue(prs, ctx)
    expect(queue.assignmentPlan).toContainEqual({ number: 1105, login: 'bob', source: 'body' })
  })

  test('fixtures without linear data emit an empty plan (additive fields, always present)', () => {
    const clean = loadFixture('independent-approval-ready')
    const queue = buildQueue(clean.prs, clean.ctx)
    expect(queue.assignmentPlan).toEqual([])
    expect(queue.assignmentPlanExclusions).toEqual([])
  })
})

describe('assign-back gates: linear-sourced entries are registry-gated (title-spoof defense)', () => {
  const spoofablePr = (number: number, linearLogin: string): { pr: PullRequest; ctx: QueueContext } => ({
    pr: {
      number,
      title: `Ship the thing (see [INFRA-8800])`,
      url: `https://github.com/Uniswap/universe/pull/${number}`,
      draft: false,
      author: { login: 'claude[bot]', type: 'Bot' },
      assignees: [],
      body: '',
      baseRefName: 'main',
      headRefName: `thebotfather/infra-88${number}-probe`,
      labels: [{ name: 'tamagui-migration' }],
      createdAt: '2026-07-27T12:00:00Z',
    },
    ctx: {
      reviews: {},
      checks: {},
      requestedReviewers: {},
      basePrByRef: {},
      defaultBranch: 'main',
      now: '2026-07-28T12:00:00Z',
      podByLogin: {},
      podThrottle: { min: 3, max: 5 },
      linearAssigneeByIssue: { 'INFRA-8800': linearLogin },
    },
  })

  test('a linear-sourced login NOT in the registry is excluded from the plan, with a reason', () => {
    const { pr, ctx } = spoofablePr(1301, 'outsider')
    const queue = buildQueue([pr], { ...ctx, registryLogins: ['alice'] })
    expect(queue.assignmentPlan).toEqual([])
    expect(queue.assignmentPlanExclusions).toEqual([
      { number: 1301, login: 'outsider', source: 'linear', reason: expect.stringContaining('TEAM_REGISTRY') },
    ])
  })

  test('an unset registry fails closed: the linear-sourced entry is excluded', () => {
    const { pr, ctx } = spoofablePr(1302, 'alice')
    const queue = buildQueue([pr], ctx)
    expect(queue.assignmentPlan).toEqual([])
    expect(queue.assignmentPlanExclusions.map((entry) => entry.number)).toEqual([1302])
  })

  test('a linear-sourced login IN the registry stays plan-eligible', () => {
    const { pr, ctx } = spoofablePr(1303, 'alice')
    const queue = buildQueue([pr], { ...ctx, registryLogins: ['Alice'] })
    expect(queue.assignmentPlan).toEqual([{ number: 1303, login: 'alice', source: 'linear' }])
    expect(queue.assignmentPlanExclusions).toEqual([])
  })

  test('rendering is unchanged: the excluded PR still shows its derived requester', () => {
    const { pr, ctx } = spoofablePr(1304, 'outsider')
    const queue = buildQueue([pr], { ...ctx, registryLogins: ['alice'] })
    const row = rowIn(allRows(queue), 1304)
    expect(row?.requester).toBe('outsider')
    expect(row?.requesterSource).toBe('linear')
  })
})

describe('assign-back gates: author-tier fallback with unresolved INFRA ids is never persisted', () => {
  const authorPr = (number: number, title: string): PullRequest => ({
    number,
    title,
    url: `https://github.com/Uniswap/universe/pull/${number}`,
    draft: false,
    author: { login: 'carol', type: 'User' },
    assignees: [],
    body: '',
    baseRefName: 'main',
    headRefName: `carol/probe-${number}`,
    labels: [{ name: 'tamagui-migration' }],
    createdAt: '2026-07-27T12:00:00Z',
  })
  const baseCtx: QueueContext = {
    reviews: {},
    checks: {},
    requestedReviewers: {},
    basePrByRef: {},
    defaultBranch: 'main',
    now: '2026-07-28T12:00:00Z',
    podByLogin: {},
    podThrottle: { min: 3, max: 5 },
  }

  test('Linear step skipped (no map): author fallback + INFRA id is excluded, not planned', () => {
    const queue = buildQueue([authorPr(1401, 'fix(web): follow-up [INFRA-8801]')], baseCtx)
    expect(queue.assignmentPlan).toEqual([])
    expect(queue.assignmentPlanExclusions).toEqual([
      { number: 1401, login: 'carol', source: 'author', reason: expect.stringContaining('Linear') },
    ])
  })

  test('Linear step failed (empty map): same exclusion', () => {
    const queue = buildQueue([authorPr(1402, 'fix(web): follow-up [INFRA-8801]')], {
      ...baseCtx,
      linearAssigneeByIssue: {},
    })
    expect(queue.assignmentPlan).toEqual([])
    expect(queue.assignmentPlanExclusions.map((entry) => entry.number)).toEqual([1402])
  })

  test('Linear consulted but unresolved (null): same exclusion', () => {
    const queue = buildQueue([authorPr(1403, 'fix(web): follow-up [INFRA-8801]')], {
      ...baseCtx,
      linearAssigneeByIssue: { 'INFRA-8801': null },
    })
    expect(queue.assignmentPlan).toEqual([])
    expect(queue.assignmentPlanExclusions.map((entry) => entry.number)).toEqual([1403])
  })

  test('skipped/degraded Linear (key absent) reason points at a future Linear-healthy run', () => {
    const queue = buildQueue([authorPr(1406, 'fix(web): follow-up [INFRA-8801]')], {
      ...baseCtx,
      linearAssigneeByIssue: {},
    })
    expect(queue.assignmentPlanExclusions).toEqual([
      { number: 1406, login: 'carol', source: 'author', reason: expect.stringContaining('Linear-healthy') },
    ])
  })

  test('Linear ran and resolved to null (key present) reason says manual attribution — a future run will not fix it', () => {
    const queue = buildQueue([authorPr(1407, 'fix(web): follow-up [INFRA-8801]')], {
      ...baseCtx,
      linearAssigneeByIssue: { 'INFRA-8801': null },
    })
    expect(queue.assignmentPlanExclusions).toEqual([
      { number: 1407, login: 'carol', source: 'author', reason: expect.stringContaining('manual attribution') },
    ])
    expect(queue.assignmentPlanExclusions[0]?.reason).not.toContain('Linear-healthy')
  })

  test('author fallback with NO INFRA ids stays in the plan', () => {
    const queue = buildQueue([authorPr(1404, 'fix(web): manual follow-up, no ticket')], baseCtx)
    expect(queue.assignmentPlan).toEqual([{ number: 1404, login: 'carol', source: 'author' }])
    expect(queue.assignmentPlanExclusions).toEqual([])
  })

  test('the excluded PR still renders with its derived author requester', () => {
    const queue = buildQueue([authorPr(1405, 'fix(web): follow-up [INFRA-8801]')], baseCtx)
    const row = rowIn(allRows(queue), 1405)
    expect(row?.requester).toBe('carol')
    expect(row?.requesterSource).toBe('author')
  })
})

describe('extractLinearIssueIds', () => {
  test('title ids always count and come first, uppercased and deduped', () => {
    expect(extractLinearIssueIds('feat: x [INFRA-2956] and infra-2956 again', 'Fixes INFRA-2957')).toEqual([
      'INFRA-2956',
      'INFRA-2957',
    ])
  })

  test.each(['Fixes', 'closes', 'Resolves', 'Part of'])('body id introduced by "%s" counts', (keyword) => {
    expect(extractLinearIssueIds('feat: no id here', `${keyword} INFRA-2957`)).toEqual(['INFRA-2957'])
  })

  test('punctuation after the keyword still counts — "Fixes: INFRA-3039"', () => {
    expect(extractLinearIssueIds('feat: no id here', 'Fixes: INFRA-3039')).toEqual(['INFRA-3039'])
  })

  test('a dash after the keyword still counts — "Closes - INFRA-3039"', () => {
    expect(extractLinearIssueIds('feat: no id here', 'Closes - INFRA-3039')).toEqual(['INFRA-3039'])
  })

  test('a markdown-linked id after the keyword counts — "Fixes [INFRA-3039](url)"', () => {
    expect(
      extractLinearIssueIds('feat: no id here', 'Fixes [INFRA-3039](https://linear.app/uniswap/issue/INFRA-3039/x)'),
    ).toEqual(['INFRA-3039'])
  })

  test('"for" is not an attribution keyword — "waiting for INFRA-3040" never counts', () => {
    expect(extractLinearIssueIds('feat: no id here', 'waiting for INFRA-3040 to land')).toEqual([])
  })

  test('a bare INFRA mention in the body never counts', () => {
    expect(extractLinearIssueIds('feat: no id here', 'Related to the INFRA-2956 work.')).toEqual([])
  })

  test('an id inside a linear.app cross-reference URL in the body never counts', () => {
    expect(
      extractLinearIssueIds('feat: no id here', 'See https://linear.app/uniswap/issue/INFRA-2956/some-title'),
    ).toEqual([])
  })

  test('ignores other team prefixes and non-id text', () => {
    expect(extractLinearIssueIds('feat: x', 'Fixes APPS-1234; see WEB-9 and Fixes INFRA- (dangling)')).toEqual([])
  })
})

describe('review-queue.json schema + rendering', () => {
  const { prs, ctx } = loadFixture('independent-approval-ready')

  test('document is schemaVersion 1 with a generatedAt stamp', () => {
    const queue = buildQueue(prs, ctx)
    expect(queue.schemaVersion).toBe(1)
    expect(queue.metadata.generatedAt).toBe(ctx.now)
    expect(queue.metadata.label).toBe('tamagui-migration')
    expect(queue.metadata.tool).toContain('review-queue')
  })

  test('rows carry the INFRA-2961 contract fields', () => {
    const queue = buildQueue(prs, ctx)
    const row = rowIn(queue.buckets.readyToMerge, 301)
    expect(row?.createdAt).toBe('2026-07-25T12:00:00Z')
    expect(row?.updatedAt).toBeTruthy()
    expect(row?.author).toBe('claude[bot]')
    expect(row?.draft).toBe(false)
    expect(row?.checksState).toBe('success')
    expect(typeof row?.bucketReason).toBe('string')
  })

  test('markdown carries the updated-at staleness stamp', () => {
    const markdown = renderMarkdown(buildQueue(prs, ctx))
    expect(markdown).toContain('2026-07-28')
  })
})

describe('requester body-line formats', () => {
  const bodyPr = (body: string): PullRequest => ({
    number: 999,
    title: 'feat(web): body-line format probe',
    url: 'https://github.com/Uniswap/universe/pull/999',
    draft: true,
    author: { login: 'claude[bot]', type: 'Bot' },
    assignees: [],
    body,
    baseRefName: 'main',
    headRefName: 'thebotfather/infra-9999-probe',
    labels: [{ name: 'tamagui-migration' }],
    createdAt: '2026-07-27T12:00:00Z',
  })

  test('ccr-slack-attribution display name resolves through loginByName', () => {
    const requester = deriveRequester(bodyPr('_Requested by **Charlie Vance** ·_'), { 'charlie vance': 'charlievance' })
    expect(requester).toEqual({ login: 'charlievance', source: 'body' })
  })

  test('a stray @ in trailing link metadata never suppresses the display name — scans stop at the · separator', () => {
    const requester = deriveRequester(
      bodyPr('_Requested by **Charlie Vance** · [Slack thread](https://x.slack.com/@foo)_'),
      { 'charlie vance': 'charlievance' },
    )
    expect(requester).toEqual({ login: 'charlievance', source: 'body' })
  })

  test('a decoy unresolvable "Requested by" line above the real attribution never shadows it — every line is tried', () => {
    const requester = deriveRequester(
      bodyPr('Requested by @rando\n\n_Requested by **Charlie Vance** · [Slack thread](https://x.slack.com/archives/C1/p1)_'),
      { 'charlie vance': 'charlievance' },
      undefined,
      ['bob'],
    )
    expect(requester).toEqual({ login: 'charlievance', source: 'body' })
  })

  test('a stray @ BEFORE the separator (email in the attribution line) falls through to the resolvable display name', () => {
    const requester = deriveRequester(
      bodyPr('_Requested by **Charlie Vance** (charlie@example.com) ·_'),
      { 'charlie vance': 'charlievance' },
      undefined,
      ['bob'],
    )
    expect(requester).toEqual({ login: 'charlievance', source: 'body' })
  })

  test('unresolvable display name is unattributed — never guessed, never the bot author', () => {
    const requester = deriveRequester(bodyPr('_Requested by **Nobody Known** ·_'), { 'charlie vance': 'charlievance' })
    expect(requester).toEqual({ login: '', source: 'unattributed' })
  })

  test('anchored parse: prose "Changes requested by @alice" is never attribution', () => {
    const requester = deriveRequester(bodyPr('Changes requested by @alice were addressed in the latest push.'))
    expect(requester).toEqual({ login: '', source: 'unattributed' })
  })

  test('anchored parse: an indented/emphasized attribution line still resolves (registry login)', () => {
    const requester = deriveRequester(bodyPr('  _Requested by **@bob** ·_'), undefined, undefined, ['bob'])
    expect(requester).toEqual({ login: 'bob', source: 'body' })
  })

  test('bare @login is registry-gated: matched case-insensitively', () => {
    const requester = deriveRequester(bodyPr('Requested by @Bob'), undefined, undefined, ['bob'])
    expect(requester).toEqual({ login: 'Bob', source: 'body' })
  })

  test('a non-registry bare @login is ignored entirely — never an ungated requester (spoof gate)', () => {
    const requester = deriveRequester(bodyPr('Requested by @rando'), undefined, undefined, ['bob'])
    expect(requester).toEqual({ login: '', source: 'unattributed' })
  })

  test('a non-registry bare @login falls through to the human author tier, symmetric with display names', () => {
    const humanPr: PullRequest = {
      ...bodyPr('Requested by @rando'),
      author: { login: 'carol', type: 'User' },
    }
    expect(deriveRequester(humanPr, undefined, undefined, ['bob'])).toEqual({ login: 'carol', source: 'author' })
  })

  test('a matched-but-unresolvable line falls through to the human author instead of suppressing it', () => {
    const humanPr: PullRequest = {
      ...bodyPr('_Requested by **Nobody Known** ·_'),
      author: { login: 'carol', type: 'User' },
    }
    expect(deriveRequester(humanPr, { 'charlie vance': 'charlievance' })).toEqual({ login: 'carol', source: 'author' })
  })
})

describe('a decoy "Requested by" line cannot launder a self-approval into readyToMerge', () => {
  // Bot-authored PR: a prepended unresolvable "Requested by @rando" line must
  // not stop the parser before the real ccr attribution line resolving to
  // mallory — dropping to unattributed would make mallory's own approval
  // count as independent.
  const decoyPr: PullRequest = {
    number: 1501,
    title: 'feat(web): decoy attribution probe',
    url: 'https://github.com/Uniswap/universe/pull/1501',
    draft: false,
    author: { login: 'claude[bot]', type: 'Bot' },
    assignees: [],
    body: 'Requested by @rando\n\n_Requested by **Mallory Vance** ·_',
    baseRefName: 'main',
    headRefName: 'thebotfather/infra-1501-probe',
    labels: [{ name: 'tamagui-migration' }],
    createdAt: '2026-07-27T12:00:00Z',
  }
  const ctx: QueueContext = {
    reviews: {
      1501: [{ author: { login: 'mallory', type: 'User' }, state: 'APPROVED', submittedAt: '2026-07-27T13:00:00Z' }],
    },
    checks: { 1501: 'success' },
    requestedReviewers: {},
    basePrByRef: {},
    defaultBranch: 'main',
    now: '2026-07-28T12:00:00Z',
    podByLogin: {},
    podThrottle: { min: 3, max: 5 },
    loginByName: { 'mallory vance': 'mallory' },
    registryLogins: ['mallory'],
  }

  test('the real attribution line still resolves, so the requester is mallory', () => {
    expect(deriveRequester(decoyPr, ctx.loginByName, undefined, ctx.registryLogins)).toEqual({
      login: 'mallory',
      source: 'body',
    })
  })

  test('the self-approved PR stays in needsIndependentReview, never readyToMerge', () => {
    const decision = bucketPr(decoyPr, ctx)
    expect(decision?.bucket).toBe('needsIndependentReview')
    const queue = buildQueue([decoyPr], ctx)
    expect(rowIn(queue.buckets.needsIndependentReview, 1501)).toBeDefined()
    expect(rowIn(queue.buckets.readyToMerge, 1501)).toBeUndefined()
  })
})

describe('deleted (ghost) author never becomes the requester', () => {
  const ghostPr: PullRequest = {
    number: 960,
    title: 'chore(web): authored by a deleted account',
    url: 'https://github.com/Uniswap/universe/pull/960',
    draft: false,
    author: { login: 'ghost', type: 'User' },
    assignees: [],
    body: 'No attribution anywhere.',
    baseRefName: 'main',
    headRefName: 'orphan/infra-none-ghost',
    labels: [{ name: 'tamagui-migration' }],
    createdAt: '2026-07-27T12:00:00Z',
  }
  const ctx: QueueContext = {
    reviews: {},
    checks: {},
    requestedReviewers: {},
    basePrByRef: {},
    defaultBranch: 'main',
    now: '2026-07-28T12:00:00Z',
    podByLogin: {},
    podThrottle: { min: 3, max: 5 },
  }

  test('deriveRequester yields unattributed, not a literal @ghost', () => {
    expect(deriveRequester(ghostPr)).toEqual({ login: '', source: 'unattributed' })
  })

  test('the row is flagged unattributed and @ghost never enters the assignment plan', () => {
    const queue = buildQueue([ghostPr], ctx)
    const row = rowIn(allRows(queue), 960)
    expect(row?.requester).toBeNull()
    expect(row?.requesterSource).toBe('unattributed')
    expect(queue.assignmentPlan).toEqual([])
  })
})

describe('a deleted (ghost) reviewer never satisfies the independent-review bar', () => {
  const ghostApprovedPr: PullRequest = {
    number: 962,
    title: 'feat(web): approved only by a deleted account',
    url: 'https://github.com/Uniswap/universe/pull/962',
    draft: false,
    author: { login: 'claude[bot]', type: 'Bot' },
    assignees: ['alice'],
    body: '',
    baseRefName: 'main',
    headRefName: 'thebotfather/infra-9962-ghost-review',
    labels: [{ name: 'tamagui-migration' }],
    createdAt: '2026-07-27T12:00:00Z',
  }
  const ctx: QueueContext = {
    reviews: {
      962: [{ author: { login: 'ghost', type: 'User' }, state: 'APPROVED', submittedAt: '2026-07-27T13:00:00Z' }],
    },
    checks: { 962: 'success' },
    requestedReviewers: { 962: { users: [], teams: [] } },
    basePrByRef: {},
    defaultBranch: 'main',
    now: '2026-07-28T12:00:00Z',
    podByLogin: {},
    podThrottle: { min: 3, max: 5 },
  }

  test('a PR whose only approval is from a ghost reviewer stays in needsIndependentReview', () => {
    const queue = buildQueue([ghostApprovedPr], ctx)
    expect(rowIn(queue.buckets.needsIndependentReview, 962)).toBeDefined()
    expect(rowIn(queue.buckets.readyToMerge, 962)).toBeUndefined()
  })

  test('ghost never appears in the reviewers list', () => {
    const queue = buildQueue([ghostApprovedPr], ctx)
    expect(rowIn(queue.buckets.needsIndependentReview, 962)?.reviewers).toEqual([])
  })

  test('a ghost CHANGES_REQUESTED counts for nothing either', () => {
    const ghostBlocked: QueueContext = {
      ...ctx,
      reviews: {
        962: [
          { author: { login: 'ghost', type: 'User' }, state: 'CHANGES_REQUESTED', submittedAt: '2026-07-27T13:00:00Z' },
        ],
      },
    }
    const queue = buildQueue([ghostApprovedPr], ghostBlocked)
    expect(rowIn(queue.buckets.changesRequested, 962)).toBeUndefined()
    expect(rowIn(queue.buckets.needsIndependentReview, 962)).toBeDefined()
  })
})

describe('a bot assignee never becomes the requester', () => {
  const botAssigneePr: PullRequest = {
    number: 961,
    title: 'chore(web): assigned to an app account',
    url: 'https://github.com/Uniswap/universe/pull/961',
    draft: false,
    author: { login: 'carol', type: 'User' },
    assignees: ['thebotfather[bot]'],
    body: 'No attribution anywhere.',
    baseRefName: 'main',
    headRefName: 'thebotfather/infra-9961-bot-assignee',
    labels: [{ name: 'tamagui-migration' }],
    createdAt: '2026-07-27T12:00:00Z',
  }

  test('deriveRequester skips the bot assignee and falls through (here: human author)', () => {
    expect(deriveRequester(botAssigneePr)).toEqual({ login: 'carol', source: 'author' })
  })

  test('a human assignee listed after the bot still wins as assignee', () => {
    const mixed: PullRequest = { ...botAssigneePr, assignees: ['thebotfather[bot]', 'alice'] }
    expect(deriveRequester(mixed)).toEqual({ login: 'alice', source: 'assignee' })
  })

  test('a bot-assigned bot-authored PR stays unattributed, never @thebotfather[bot]', () => {
    const botAuthored: PullRequest = { ...botAssigneePr, author: { login: 'claude[bot]', type: 'Bot' } }
    expect(deriveRequester(botAuthored)).toEqual({ login: '', source: 'unattributed' })
  })
})

describe('a bot-only assignee never blocks attribution (Linear prefilter + assign-back gates)', () => {
  const botOnlyPr: PullRequest = {
    number: 963,
    title: 'feat(web): bot-only assignee probe [INFRA-9963]',
    url: 'https://github.com/Uniswap/universe/pull/963',
    draft: false,
    author: { login: 'claude[bot]', type: 'Bot' },
    assignees: ['thebotfather[bot]'],
    body: '',
    baseRefName: 'main',
    headRefName: 'thebotfather/infra-9963-bot-only-assignee',
    labels: [{ name: 'tamagui-migration' }],
    createdAt: '2026-07-27T12:00:00Z',
  }
  const ctx: QueueContext = {
    reviews: {},
    checks: {},
    requestedReviewers: {},
    basePrByRef: {},
    defaultBranch: 'main',
    now: '2026-07-28T12:00:00Z',
    podByLogin: {},
    podThrottle: { min: 3, max: 5 },
    linearAssigneeByIssue: { 'INFRA-9963': 'alice' },
    // Linear-sourced plan entries are registry-gated (fail closed).
    registryLogins: ['alice'],
  }

  test('hasHumanAssignee: a bot-only (or empty) assignee list has no human — the Linear prefilter must treat it as needing attribution', () => {
    expect(hasHumanAssignee(botOnlyPr.assignees)).toBe(false)
    expect(hasHumanAssignee([])).toBe(false)
  })

  test('hasHumanAssignee: any human in the list counts, regardless of position', () => {
    expect(hasHumanAssignee(['alice'])).toBe(true)
    expect(hasHumanAssignee(['thebotfather[bot]', 'alice'])).toBe(true)
  })

  test('a bot-only-assigned PR whose requester resolves via Linear enters the assignment plan (assign-back converges)', () => {
    const queue = buildQueue([botOnlyPr], ctx)
    expect(queue.assignmentPlan).toContainEqual({ number: 963, login: 'alice', source: 'linear' })
  })

  test('a human assignee alongside the bot still keeps the PR out of the plan (humans are never overwritten)', () => {
    const humanAssigned: PullRequest = { ...botOnlyPr, assignees: ['thebotfather[bot]', 'alice'] }
    const queue = buildQueue([humanAssigned], ctx)
    expect(queue.assignmentPlan).toEqual([])
  })
})

describe('draft groups match requester casing-insensitively, preserving display casing', () => {
  const draftPr = (number: number, assignee: string): PullRequest => ({
    number,
    title: `feat(web): draft casing probe #${number}`,
    url: `https://github.com/Uniswap/universe/pull/${number}`,
    draft: true,
    author: { login: 'claude[bot]', type: 'Bot' },
    assignees: [assignee],
    body: '',
    baseRefName: 'main',
    headRefName: `thebotfather/infra-99${number}-draft-probe`,
    labels: [{ name: 'tamagui-migration' }],
    createdAt: '2026-07-27T12:00:00Z',
  })
  const ctx: QueueContext = {
    reviews: {},
    checks: {},
    requestedReviewers: {},
    basePrByRef: {},
    defaultBranch: 'main',
    now: '2026-07-28T12:00:00Z',
    podByLogin: {},
    podThrottle: { min: 3, max: 5 },
  }

  test('drafts whose requesters differ only in casing render under one group header', () => {
    const markdown = renderMarkdown(buildQueue([draftPr(990, 'Alice'), draftPr(991, 'alice')], ctx))
    expect(markdown).toContain('**@Alice** (2)')
    expect(markdown).not.toContain('(1)')
  })
})

describe('registry-matched mentions use the canvas embed dialect (never chat mrkdwn)', () => {
  const pr = (number: number, assignee: string, draft: boolean): PullRequest => ({
    number,
    title: `feat(web): mention dialect probe #${number}`,
    url: `https://github.com/Uniswap/universe/pull/${number}`,
    draft,
    author: { login: 'claude[bot]', type: 'Bot' },
    assignees: [assignee],
    body: '',
    baseRefName: 'main',
    headRefName: `thebotfather/infra-98${number}-mention-probe`,
    labels: [{ name: 'tamagui-migration' }],
    createdAt: '2026-07-27T12:00:00Z',
  })
  const ctx: QueueContext = {
    reviews: {
      950: [{ author: { login: 'jmrossy', type: 'User' }, state: 'APPROVED', submittedAt: '2026-07-27T13:00:00Z' }],
    },
    checks: { 950: 'success' },
    requestedReviewers: {},
    basePrByRef: {},
    defaultBranch: 'main',
    now: '2026-07-28T12:00:00Z',
    podByLogin: {},
    podThrottle: { min: 3, max: 5 },
  }
  const options = { slackIdByLogin: { cbachmeier: 'U0AAAAAAAA1', jmrossy: 'U0AAAAAAAA2' } }

  test('requester and reviewer mentions render as ![](@U…) canvas embeds', () => {
    const markdown = renderMarkdown(buildQueue([pr(950, 'cbachmeier', false)], ctx), options)
    expect(markdown).toContain('requested by ![](@U0AAAAAAAA1)')
    expect(markdown).toContain('reviews: ![](@U0AAAAAAAA2)')
  })

  test('chat mrkdwn <@U…> never appears — canvases render it as raw text', () => {
    const markdown = renderMarkdown(buildQueue([pr(950, 'cbachmeier', false), pr(951, 'cbachmeier', true)], ctx), options)
    expect(markdown).not.toContain('<@')
  })

  test('draft group header emits the embed unwrapped — bold markers around an embed are not portable', () => {
    const markdown = renderMarkdown(buildQueue([pr(951, 'cbachmeier', true), pr(952, 'CBachmeier', true)], ctx), options)
    expect(markdown).toContain('![](@U0AAAAAAAA1) (2)')
    expect(markdown).not.toContain('**![](')
  })

  test('logins outside the registry stay plain @login text', () => {
    const markdown = renderMarkdown(buildQueue([pr(953, 'outsider', true)], ctx), options)
    expect(markdown).toContain('**@outsider** (1)')
    expect(markdown).not.toContain('![](@outsider)')
  })
})

describe('footer pod counts match POD_BY_LOGIN case-insensitively', () => {
  const podPr = (number: number, assignee: string): PullRequest => ({
    number,
    title: `feat(web): pod casing probe #${number}`,
    url: `https://github.com/Uniswap/universe/pull/${number}`,
    draft: false,
    author: { login: 'claude[bot]', type: 'Bot' },
    assignees: [assignee],
    body: '',
    baseRefName: 'main',
    headRefName: `thebotfather/infra-99${number}-pod-probe`,
    labels: [{ name: 'tamagui-migration' }],
    createdAt: '2026-07-27T12:00:00Z',
  })
  const ctx: QueueContext = {
    reviews: {},
    checks: {},
    requestedReviewers: {},
    basePrByRef: {},
    defaultBranch: 'main',
    now: '2026-07-28T12:00:00Z',
    podByLogin: { alice: 'swap-fe', CarolVance: 'eng-ui' },
    podThrottle: { min: 3, max: 5 },
  }

  test('an API login cased differently from the map key still counts under the mapped pod', () => {
    const queue = buildQueue([podPr(980, 'Alice')], ctx)
    expect(queue.footer.podCounts).toEqual({ 'swap-fe': 1 })
  })

  test('a map key cased differently from the API login also counts (both sides normalized)', () => {
    const queue = buildQueue([podPr(981, 'carolvance')], ctx)
    expect(queue.footer.podCounts).toEqual({ 'eng-ui': 1 })
  })

  test('a genuinely unmapped login still lands in unknown-pod', () => {
    const queue = buildQueue([podPr(982, 'dave')], ctx)
    expect(queue.footer.podCounts).toEqual({ 'unknown-pod': 1 })
  })
})

describe('renderMarkdown escapes titles (Slack injection)', () => {
  const HOSTILE_TITLE = 'feat: pwn <!channel> & [link](https://evil) tail ](https://evil)'
  const ESCAPED_TITLE = 'feat: pwn &lt;!channel&gt; &amp; \\[link\\](https://evil) tail \\](https://evil)'
  // Matches a `](https://evil)` whose `]` is NOT backslash-escaped — i.e. one
  // that could still close a live markdown link.
  const UNESCAPED_LINK_CLOSE = /[^\\]\]\(https:\/\/evil\)/
  const titledPr = (number: number, title: string, draft = false): PullRequest => ({
    number,
    title,
    url: `https://github.com/Uniswap/universe/pull/${number}`,
    draft,
    author: { login: 'claude[bot]', type: 'Bot' },
    assignees: ['alice'],
    body: '',
    baseRefName: 'main',
    headRefName: `thebotfather/infra-99${number}-probe`,
    labels: [{ name: 'tamagui-migration' }],
    createdAt: '2026-07-27T12:00:00Z',
  })
  const ctx: QueueContext = {
    reviews: {},
    checks: {},
    requestedReviewers: {},
    basePrByRef: {},
    defaultBranch: 'main',
    now: '2026-07-28T12:00:00Z',
    podByLogin: {},
    podThrottle: { min: 3, max: 5 },
  }

  test('non-draft row renderer escapes &, <, >, [, ] so neither <!channel> nor [text](url) survives', () => {
    const markdown = renderMarkdown(buildQueue([titledPr(970, HOSTILE_TITLE)], ctx))
    expect(markdown).toContain(ESCAPED_TITLE)
    expect(markdown).not.toContain('<!channel>')
    expect(markdown).not.toMatch(UNESCAPED_LINK_CLOSE)
  })

  test('draft row renderer escapes the same way', () => {
    const markdown = renderMarkdown(buildQueue([titledPr(971, HOSTILE_TITLE, true)], ctx))
    expect(markdown).toContain(ESCAPED_TITLE)
    expect(markdown).not.toContain('<!channel>')
    expect(markdown).not.toMatch(UNESCAPED_LINK_CLOSE)
  })

  test('the ubiquitous [INFRA-xxxx] title tag renders as a backslash-escaped literal bracket, not an entity code', () => {
    const markdown = renderMarkdown(buildQueue([titledPr(972, 'feat(web): migrate thing [INFRA-1234]')], ctx))
    expect(markdown).toContain('\\[INFRA-1234\\]')
    expect(markdown).not.toContain('&#91;')
    expect(markdown).not.toContain('&#93;')
  })

  test('a [click](url) injection attempt cannot form a live link', () => {
    const markdown = renderMarkdown(buildQueue([titledPr(973, '[click](https://evil)')], ctx))
    expect(markdown).toContain('\\[click\\](https://evil)')
    expect(markdown).not.toMatch(UNESCAPED_LINK_CLOSE)
  })

  test('a pre-escaped \\[click\\](url) injection attempt cannot form a live link either (backslash doubled)', () => {
    const markdown = renderMarkdown(buildQueue([titledPr(974, '\\[click\\](https://evil)')], ctx))
    expect(markdown).toContain('\\\\\\[click\\\\\\](https://evil)')
    expect(markdown).not.toMatch(UNESCAPED_LINK_CLOSE)
  })
})

describe('stackWaiting reason distinguishes unknown checks from pending', () => {
  const approvedPr: PullRequest = {
    number: 950,
    title: 'feat(web): checks-state reason probe',
    url: 'https://github.com/Uniswap/universe/pull/950',
    draft: false,
    author: { login: 'claude[bot]', type: 'Bot' },
    assignees: ['alice'],
    body: '',
    baseRefName: 'main',
    headRefName: 'thebotfather/infra-9950-probe',
    labels: [{ name: 'tamagui-migration' }],
    createdAt: '2026-07-27T12:00:00Z',
  }
  const ctxWithChecks = (checks: ChecksRollup): QueueContext => ({
    reviews: { 950: [{ author: { login: 'bob', type: 'User' }, state: 'APPROVED', submittedAt: '2026-07-27T13:00:00Z' }] },
    checks: { 950: checks },
    requestedReviewers: { 950: { users: [], teams: [] } },
    basePrByRef: {},
    defaultBranch: 'main',
    now: '2026-07-28T12:00:00Z',
    podByLogin: {},
    podThrottle: { min: 3, max: 5 },
  })

  test('pending checks: stackWaiting, waiting on CI', () => {
    const decision = bucketPr(approvedPr, ctxWithChecks('pending'))
    expect(decision?.bucket).toBe('stackWaiting')
    expect(decision?.reason).toContain('checks pending — waiting on CI')
  })

  test('unknown checks: same bucket, but the reason says no CI status was found', () => {
    const decision = bucketPr(approvedPr, ctxWithChecks('unknown'))
    expect(decision?.bucket).toBe('stackWaiting')
    expect(decision?.reason).toContain('no CI status found — verify manually')
    expect(decision?.reason).not.toContain('waiting on CI')
  })
})

describe('meta: mandatory trap fixtures exist', () => {
  const MANDATORY_FIXTURES = [
    'bot-only-approvals',
    'requester-self-approval',
    'independent-approval-ready',
    'stacked-base-waiting',
    'changes-requested-latest',
    'drafts-grouped-by-requester',
    'unattributed-draft',
    'consumed-team-review-request',
    'gtmq-merge-queue-excluded',
    'do-not-merge-excluded',
    'linear-assignee-resolution',
    'pending-review-null-submitted',
  ]

  test.each(MANDATORY_FIXTURES)('fixture %s.json exists', (name) => {
    expect(existsSync(join(FIXTURES_DIR, `${name}.json`))).toBe(true)
  })
})
