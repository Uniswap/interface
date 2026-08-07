/**
 * Migration review queue (INFRA-3039) — pure bucketing/rendering core.
 *
 * GitHub querying lives in the CLI entry point one directory up
 * (`scripts/tamagui-migration/review-queue.ts`); everything here is pure and
 * fixture-testable, census-tool style.
 *
 * Run the suite with `bun test scripts/tamagui-migration/review-queue`.
 */

import type {
  Actor,
  AssignmentPlanEntry,
  AssignmentPlanExclusion,
  BucketDecision,
  PullRequest,
  QueueContext,
  QueueRow,
  Requester,
  Review,
  ReviewQueue,
} from './types'

export type {
  Actor,
  AssignmentPlanEntry,
  AssignmentPlanExclusion,
  BucketDecision,
  BucketKey,
  ChecksRollup,
  ClosedBasePr,
  Label,
  PodThrottle,
  PullRequest,
  QueueBuckets,
  QueueContext,
  QueueFooter,
  QueueMetadata,
  QueueRow,
  Requester,
  RequesterSource,
  RequestedReviewers,
  Review,
  ReviewQueue,
  ReviewState,
} from './types'

export const QUEUE_LABEL = 'tamagui-migration'
export const QUEUE_TOOL = 'scripts/tamagui-migration/review-queue.ts'
/** Graphite merge-queue heads — excluded from the queue entirely. */
const MERGE_QUEUE_HEAD_PREFIX = 'gtmq_'
/**
 * PRs carrying this label are excluded from the queue entirely, like gtmq_*
 * heads. Matched case-insensitively (trimmed) — label casing varies in the
 * wild ("do not merge", "DO NOT MERGE").
 */
const DO_NOT_MERGE_LABEL = 'do not merge'
const UNKNOWN_POD = 'unknown-pod'
/** GitHub's placeholder login for a deleted account — never attributable. */
const GHOST_LOGIN = 'ghost'
const DAY_MS = 24 * 60 * 60 * 1000

const UNATTRIBUTED: Requester = { login: '', source: 'unattributed' }

/** App accounts count for nothing anywhere (reviews, requester derivation). */
function isBotLogin(login: string): boolean {
  return login.endsWith('[bot]')
}

function isBot(actor: Actor): boolean {
  return actor.type === 'Bot' || isBotLogin(actor.login)
}

/**
 * True when at least one assignee is a human. Attribution gates must use
 * this, not `assignees.length` — deriveRequester skips bot assignees, so a
 * bot-only-assigned PR still needs its Linear lookup and assign-back.
 */
export function hasHumanAssignee(assignees: readonly string[]): boolean {
  return assignees.some((login) => !isBotLogin(login))
}

/** Reviews count only from attributable humans — never bots, never GitHub's `ghost` placeholder. */
function isCountableReviewer(actor: Actor): boolean {
  return !isBot(actor) && actor.login.toLowerCase() !== GHOST_LOGIN
}

/** True when any label matches "do not merge" (case-insensitive, trimmed). */
function hasDoNotMergeLabel(pr: PullRequest): boolean {
  return pr.labels.some((label) => label.name.trim().toLowerCase() === DO_NOT_MERGE_LABEL)
}

/**
 * Parse a "requested by <name>" attribution line, anchored to the line start
 * so prose ("Changes requested by @alice…") never parses as attribution.
 * Both forms are registry-gated (the body is author-controlled): display
 * names via `loginByName`, bare `@login` via `registryLogins`. EVERY matching
 * line is tried and the first that RESOLVES wins — committing to the first
 * match would let a prepended decoy line ("Requested by @rando") drop a
 * bot-authored PR to unattributed, where the real requester's self-approval
 * counts as independent. No line resolving yields undefined so derivation
 * falls through to later tiers instead of suppressing them.
 */
function parseRequestedByLine(
  body: string,
  loginByName?: Record<string, string>,
  registryLogins?: ReadonlySet<string>,
): Requester | undefined {
  for (const line of body.split('\n')) {
    if (!/^[_*\s]*requested by\b/i.test(line)) {
      continue
    }
    const resolved = resolveRequestedByLine(line, loginByName, registryLogins)
    if (resolved) {
      return resolved
    }
  }
  return undefined
}

/** Resolve one attribution line, or undefined when neither form resolves. */
function resolveRequestedByLine(
  line: string,
  loginByName?: Record<string, string>,
  registryLogins?: ReadonlySet<string>,
): Requester | undefined {
  const rest = line.slice(line.toLowerCase().indexOf('requested by') + 'requested by'.length)
  // Trailing link metadata after the `·` separator (e.g. the ccr line's
  // "· [Slack thread](https://…/@foo)") can carry a stray `@`, so BOTH scans
  // stop at the separator — otherwise it would shadow a resolvable name.
  const scope = rest.split('·')[0] ?? rest
  const loginMatch = scope.match(/@([A-Za-z0-9](?:-?[A-Za-z0-9]){0,38})/)
  if (loginMatch?.[1] && registryLogins?.has(loginMatch[1].toLowerCase())) {
    return { login: loginMatch[1], source: 'body' }
  }
  // A stray `@` before the separator (e.g. an email in the attribution line)
  // that fails the registry check falls through here instead of suppressing
  // a resolvable **Display Name**.
  const name = (scope.match(/\*\*([^*]+)\*\*/)?.[1] ?? scope)
    .replace(/[_`:]/g, '')
    .trim()
  const resolved = name ? loginByName?.[name.toLowerCase()] : undefined
  return resolved ? { login: resolved, source: 'body' } : undefined
}

/**
 * Linear issue ids (INFRA-xxxx only) a PR is attributable to — uppercase,
 * deduped, title ids first. Title ids always count; body ids count only when
 * introduced by a closing/attribution keyword (`Fixes …`, `Part of …`), so
 * bare mentions and linear.app cross-reference URLs never misattribute.
 */
export function extractLinearIssueIds(title: string, body: string): string[] {
  const ids = new Set<string>()
  for (const match of title.matchAll(/\bINFRA-(\d+)\b/gi)) {
    ids.add(`INFRA-${match[1]}`)
  }
  for (const match of body.matchAll(/\b(?:fixes|closes|resolves|part of)\s*[:\-–]?\s*\[?INFRA-(\d+)\b/gi)) {
    ids.add(`INFRA-${match[1]}`)
  }
  return [...ids]
}

/**
 * Derive the requester. Tier order: first human assignee -> registry-gated
 * "requested by" body line -> Linear issue assignee (INFRA-xxxx id) ->
 * human author -> unattributed (flagged, never guessed).
 */
export function deriveRequester(
  pr: PullRequest,
  loginByName?: Record<string, string>,
  linearAssigneeByIssue?: Record<string, string | null>,
  registryLogins?: string[],
): Requester {
  const assignee = pr.assignees.find((login) => !isBotLogin(login))
  if (assignee) {
    return { login: assignee, source: 'assignee' }
  }
  const fromBody = parseRequestedByLine(
    pr.body,
    loginByName,
    new Set((registryLogins ?? []).map((login) => login.toLowerCase())),
  )
  if (fromBody) {
    return fromBody
  }
  if (linearAssigneeByIssue) {
    // Title ids first, then keyword-attributed body ids; first issue
    // resolving to a login wins.
    for (const issueId of extractLinearIssueIds(pr.title, pr.body)) {
      const login = linearAssigneeByIssue[issueId]
      if (login) {
        return { login, source: 'linear' }
      }
    }
  }
  if (!isBot(pr.author) && pr.author.login.toLowerCase() !== GHOST_LOGIN) {
    return { login: pr.author.login, source: 'author' }
  }
  return UNATTRIBUTED
}

/**
 * Submitted reviews in submission order. PENDING reviews (null submittedAt)
 * count for nothing and are dropped before the sort.
 */
function submittedReviewsInOrder(reviews: Review[]): Review[] {
  return reviews
    .filter((review) => review.state !== 'PENDING')
    .sort((a, b) => (a.submittedAt ?? '').localeCompare(b.submittedAt ?? ''))
}

/**
 * Each human reviewer's latest state-carrying review (APPROVED /
 * CHANGES_REQUESTED / DISMISSED), by submittedAt. Bot and ghost reviews
 * never enter the map; COMMENTED never overrides an earlier state.
 */
function latestHumanStateByReviewer(reviews: Review[]): Map<string, Review> {
  const sorted = submittedReviewsInOrder(reviews)
  const latest = new Map<string, Review>()
  for (const review of sorted) {
    if (!isCountableReviewer(review.author)) {
      continue
    }
    if (review.state === 'APPROVED' || review.state === 'CHANGES_REQUESTED' || review.state === 'DISMISSED') {
      latest.set(review.author.login.toLowerCase(), review)
    }
  }
  return latest
}

/** Human logins that submitted reviews, deduped, in first-review order. */
function humanReviewers(reviews: Review[]): string[] {
  const sorted = submittedReviewsInOrder(reviews)
  const seen = new Set<string>()
  const logins: string[] = []
  for (const review of sorted) {
    if (!isCountableReviewer(review.author) || seen.has(review.author.login.toLowerCase())) {
      continue
    }
    seen.add(review.author.login.toLowerCase())
    logins.push(review.author.login)
  }
  return logins
}

/**
 * Decide which bucket a PR belongs to, or `null` to exclude it entirely
 * ("do not merge" label, gtmq_* merge-queue heads). Lifecycle order: draft
 * -> changesRequested -> needsIndependentReview -> readyToMerge, with
 * stackWaiting for approved PRs blocked on a base or CI. The requester is
 * derived exactly once, here, and returned on the decision so the bucket
 * choice and the emitted row can never disagree.
 */
export function bucketPr(pr: PullRequest, ctx: QueueContext): BucketDecision | null {
  if (hasDoNotMergeLabel(pr)) {
    return null
  }
  if (pr.headRefName.startsWith(MERGE_QUEUE_HEAD_PREFIX)) {
    return null
  }

  const requester = deriveRequester(pr, ctx.loginByName, ctx.linearAssigneeByIssue, ctx.registryLogins)
  if (pr.draft) {
    return { bucket: 'draftsByRequester', reason: 'draft — awaiting the requester’s pre-open review pass', requester }
  }

  const latestByReviewer = latestHumanStateByReviewer(ctx.reviews[pr.number] ?? [])

  const changesRequestedBy = [...latestByReviewer.values()]
    .filter((review) => review.state === 'CHANGES_REQUESTED')
    .map((review) => review.author.login)
  if (changesRequestedBy.length > 0) {
    return {
      bucket: 'changesRequested',
      reason: `changes requested by ${changesRequestedBy.join(', ')} — back with the session/author`,
      requester,
    }
  }

  const independentApprovers = [...latestByReviewer.values()]
    .filter(
      (review) =>
        review.state === 'APPROVED' &&
        (requester.login === '' || review.author.login.toLowerCase() !== requester.login.toLowerCase()),
    )
    .map((review) => review.author.login)
  if (independentApprovers.length === 0) {
    return {
      bucket: 'needsIndependentReview',
      reason: 'no approval yet from a human who is not the requester',
      requester,
    }
  }

  const checks = ctx.checks[pr.number] ?? 'unknown'
  if (checks === 'failure') {
    return {
      bucket: 'changesRequested',
      reason: `approved by ${independentApprovers.join(', ')} but checks failing — back with the session/author`,
      requester,
    }
  }

  if (pr.baseRefName !== ctx.defaultBranch) {
    const openBase = ctx.basePrByRef[pr.baseRefName]
    if (openBase !== undefined && openBase !== pr.number) {
      return {
        bucket: 'stackWaiting',
        reason: `base branch is open PR #${openBase}’s head — merges after its base`,
        requester,
      }
    }
    const closedBase = ctx.closedBasePrs?.[pr.baseRefName]
    if (!closedBase) {
      return {
        bucket: 'stackWaiting',
        reason: `base branch ${pr.baseRefName} is not ${ctx.defaultBranch} and no merged base PR was found — verify`,
        requester,
      }
    }
    if (!closedBase.merged) {
      // Graphite fast-forward merges can close the base PR with merged:false
      // (#35388/#36755) — don't call it merged, don't call it open: verify.
      return {
        bucket: 'stackWaiting',
        reason: `base PR #${closedBase.number} closed unmerged (possible Graphite fast-forward) — verify before merging`,
        requester,
      }
    }
  }

  if (checks === 'success' || checks === 'neutral') {
    return {
      bucket: 'readyToMerge',
      reason: `approved by ${independentApprovers.join(', ')}, checks clean, base resolved`,
      requester,
    }
  }
  if (checks === 'unknown') {
    return {
      bucket: 'stackWaiting',
      reason: `approved by ${independentApprovers.join(', ')} but no CI status found — verify manually`,
      requester,
    }
  }
  return {
    bucket: 'stackWaiting',
    reason: `approved by ${independentApprovers.join(', ')} but checks ${checks} — waiting on CI`,
    requester,
  }
}

function ageDays(createdAt: string, now: string): number {
  const elapsed = new Date(now).getTime() - new Date(createdAt).getTime()
  return Math.max(0, Math.floor(elapsed / DAY_MS))
}

/**
 * Why a resolved requester stays OUT of the assign-back plan (undefined =
 * plan-eligible). Registry gate: body- and linear-derived logins come from
 * author-controlled text (body line / title INFRA id), so they only persist
 * when they resolve through TEAM_REGISTRY — fail closed when the registry is
 * unset. Degraded-Linear gate: an author-tier fallback on a PR whose INFRA
 * ids Linear did not resolve is never persisted — the assignee tier wins
 * every later run, so writing it would lock out a Linear-healthy run from
 * correcting it. The reason distinguishes a skipped/degraded lookup (id
 * absent from `linearAssigneeByIssue` — a healthy run may still attribute)
 * from a lookup that ran and resolved to no mappable human (id present with
 * null — only manual attribution fixes it). Excluded PRs still render with
 * their derived requester.
 */
function assignBackExclusionReason(
  pr: PullRequest,
  requester: Requester,
  registryLogins: ReadonlySet<string>,
  linearAssigneeByIssue?: Record<string, string | null>,
): string | undefined {
  if (
    (requester.source === 'body' || requester.source === 'linear') &&
    !registryLogins.has(requester.login.toLowerCase())
  ) {
    return `${requester.source}-derived login not in TEAM_REGISTRY — rendered as requester but never auto-assigned (spoof gate)`
  }
  if (requester.source === 'author') {
    const issueIds = extractLinearIssueIds(pr.title, pr.body)
    if (issueIds.length > 0) {
      const everyIdConsulted = issueIds.every((id) => linearAssigneeByIssue !== undefined && id in linearAssigneeByIssue)
      return everyIdConsulted
        ? 'author-tier fallback: Linear ran but its INFRA id(s) resolved to no mappable human — needs manual attribution'
        : 'author-tier fallback with INFRA id(s) Linear skipped or failed to fetch — not persisted so a Linear-healthy run can attribute properly'
    }
  }
  return undefined
}

/** Assemble the full review-queue.json document from the open labeled PRs. */
export function buildQueue(prs: PullRequest[], ctx: QueueContext): ReviewQueue {
  const buckets: ReviewQueue['buckets'] = {
    draftsByRequester: [],
    needsIndependentReview: [],
    changesRequested: [],
    readyToMerge: [],
    stackWaiting: [],
  }
  const podCounts: Record<string, number> = {}
  const assignmentPlan: AssignmentPlanEntry[] = []
  const assignmentPlanExclusions: AssignmentPlanExclusion[] = []
  const registryLogins = new Set((ctx.registryLogins ?? []).map((login) => login.toLowerCase()))
  // POD_BY_LOGIN keys are hand-maintained and may differ in case from API
  // logins — normalize once, like every other login lookup here.
  const podByLoginLower: Record<string, string> = {}
  for (const [login, pod] of Object.entries(ctx.podByLogin)) {
    podByLoginLower[login.toLowerCase()] = pod
  }
  let excludedDoNotMerge = 0

  const sorted = [...prs].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.number - b.number)
  for (const pr of sorted) {
    if (hasDoNotMergeLabel(pr)) {
      excludedDoNotMerge += 1
      continue
    }
    const decision = bucketPr(pr, ctx)
    if (!decision) {
      continue
    }
    // Derived once inside bucketPr — the bucket choice and the emitted row
    // always agree on the requester.
    const requester = decision.requester
    const row: QueueRow = {
      number: pr.number,
      title: pr.title,
      url: pr.url,
      requester: requester.login === '' ? null : requester.login,
      requesterSource: requester.source,
      createdAt: pr.createdAt,
      updatedAt: pr.updatedAt ?? pr.createdAt,
      author: pr.author.login,
      baseRef: pr.baseRefName,
      draft: pr.draft,
      checksState: ctx.checks[pr.number] ?? 'unknown',
      reviewers: humanReviewers(ctx.reviews[pr.number] ?? []),
      ageDays: ageDays(pr.createdAt, ctx.now),
      bucketReason: decision.reason,
    }
    buckets[decision.bucket].push(row)
    // Assign-back plan: PRs with no HUMAN assignee whose requester resolved
    // (any non-assignee source); existing human assignees are never
    // overwritten. Eligibility gates: assignBackExclusionReason.
    if (!hasHumanAssignee(pr.assignees) && requester.login !== '') {
      const exclusionReason = assignBackExclusionReason(pr, requester, registryLogins, ctx.linearAssigneeByIssue)
      if (exclusionReason) {
        assignmentPlanExclusions.push({
          number: pr.number,
          login: requester.login,
          source: requester.source,
          reason: exclusionReason,
        })
      } else {
        assignmentPlan.push({ number: pr.number, login: requester.login, source: requester.source })
      }
    }
    if (!pr.draft) {
      const pod = (requester.login !== '' && podByLoginLower[requester.login.toLowerCase()]) || UNKNOWN_POD
      podCounts[pod] = (podCounts[pod] ?? 0) + 1
    }
  }

  return {
    schemaVersion: 1,
    metadata: {
      tool: QUEUE_TOOL,
      generatedAt: ctx.now,
      gitCommit: ctx.gitCommit ?? null,
      label: QUEUE_LABEL,
    },
    buckets,
    footer: {
      podCounts,
      throttle: ctx.podThrottle,
      updatedAt: ctx.now,
      excludedDoNotMerge,
    },
    assignmentPlan,
    assignmentPlanExclusions,
  }
}

export interface RenderOptions {
  /** githubLogin -> Slack user id; mentions render as canvas `![](@U…)` embeds, falling back to plain `@login`. */
  slackIdByLogin?: Record<string, string>
}

/**
 * Neutralize Slack control characters in author-controlled titles: entity-
 * escape `&`/`<`/`>` (mentions, broadcasts) and backslash-escape `\`/`[`/`]`
 * (backslash first, so a pre-escaped title can't smuggle a bracket through)
 * so `[text](url)` can never form a live link. Tradeoff: the rare tier-2
 * mrkdwn fallback doesn't treat brackets as markup, so backslashes may
 * render literally there.
 */
function escapeTitle(title: string): string {
  return title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\\/g, '\\\\')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
}

/**
 * Canvas markdown user mention: `![](@U…)` is the only mention form the
 * canvas dialect understands — chat-mrkdwn `<@U…>` is stored by
 * canvases.edit as raw text (shown to readers as `<@U…|Name>`). Tradeoff
 * (as escapeTitle): the rare tier-2 chat.update mrkdwn fallback shows the
 * embed literally — no dual-dialect renderer.
 */
function mention(login: string, options?: RenderOptions): string {
  const slackId = options?.slackIdByLogin?.[login] ?? options?.slackIdByLogin?.[login.toLowerCase()]
  return slackId ? `![](@${slackId})` : `@${login}`
}

function requesterLabel(row: QueueRow, options?: RenderOptions): string {
  return row.requester === null
    ? '⚠️ unattributed — needs manual requester assignment'
    : `requested by ${mention(row.requester, options)}`
}

function rowLine(row: QueueRow, options?: RenderOptions): string {
  const reviewers =
    row.reviewers.length > 0
      ? `reviews: ${row.reviewers.map((login) => mention(login, options)).join(', ')}`
      : 'no human reviews yet'
  return `- [#${row.number}](${row.url}) ${escapeTitle(row.title)} — ${requesterLabel(row, options)} · ${row.ageDays}d · ${reviewers}`
}

function section(heading: string, blurb: string, lines: string[]): string {
  const body = lines.length > 0 ? lines.join('\n') : '_(none)_'
  return `## ${heading}\n\n_${blurb}_\n\n${body}`
}

/** Render the queue as the markdown pushed to the pinned Slack canvas. */
export function renderMarkdown(queue: ReviewQueue, options?: RenderOptions): string {
  const { buckets, footer } = queue

  // Grouped case-insensitively (API login casing varies); the first-seen
  // row's casing is kept for display.
  const draftGroups = new Map<string, QueueRow[]>()
  for (const row of buckets.draftsByRequester) {
    const key = row.requester?.toLowerCase() ?? ''
    const group = draftGroups.get(key) ?? []
    group.push(row)
    draftGroups.set(key, group)
  }
  const draftLines: string[] = []
  for (const rows of draftGroups.values()) {
    const display = rows[0]?.requester ?? null
    // Embeds go unwrapped: bold markers around `![](@U…)` are not a
    // documented canvas construct, and the chip is already visually distinct.
    const label = display === null ? null : mention(display, options)
    draftLines.push(
      label === null
        ? '**⚠️ Unattributed — needs manual requester assignment**'
        : label.startsWith('![](')
          ? `${label} (${rows.length})`
          : `**${label}** (${rows.length})`,
    )
    for (const row of rows) {
      draftLines.push(`- [#${row.number}](${row.url}) ${escapeTitle(row.title)} — ${row.ageDays}d`)
    }
  }

  const updated = new Date(footer.updatedAt).toISOString()
  const stamp = `${updated.slice(11, 16)} UTC · ${updated.slice(0, 10)}`
  const podLine =
    Object.entries(footer.podCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([pod, count]) => `${pod} ${count}/${footer.throttle.max}`)
      .join(' · ') || '(no open PRs)'

  const excludedLines =
    footer.excludedDoNotMerge > 0 ? [`_${footer.excludedDoNotMerge} utility PR(s) excluded (do not merge)_`] : []

  return [
    '# Tamagui migration — review queue',
    section('Drafts: review before opening', 'Session PRs awaiting their requester’s pre-open pass, grouped by requester.', draftLines),
    section(
      'Needs independent review',
      'Merge bar: one human approval from someone who is NOT the requester — if that isn’t you below, you qualify.',
      buckets.needsIndependentReview.map((row) => rowLine(row, options)),
    ),
    section('Changes requested', 'Back with the session/author.', buckets.changesRequested.map((row) => rowLine(row, options))),
    section('Ready to merge', 'Independent approval, checks clean, base resolved.', buckets.readyToMerge.map((row) => rowLine(row, options))),
    section('Stack-waiting', 'Approved but waiting on a base PR or CI.', buckets.stackWaiting.map((row) => rowLine(row, options))),
    '---',
    `**Pod load** (throttle ${footer.throttle.min}-${footer.throttle.max} open PRs per pod): ${podLine}`,
    ...excludedLines,
    `_Updated ${stamp}_`,
    '**Refresh**: press the pinned refresh button · ask “@Claude refresh the migration review queue” in #proj-tamabyebye · or run `gh workflow run tamagui_review_queue.yml`',
  ].join('\n\n')
}
