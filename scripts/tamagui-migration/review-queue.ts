#!/usr/bin/env bun
/**
 * Tamagui migration review queue generator (INFRA-3039).
 *
 * Queries the GitHub GraphQL API for open `tamagui-migration`-labeled PRs in
 * Uniswap/universe (reviews, check rollups, base branches) and emits the
 * `review-queue.json` document (schemaVersion 1 — the stable interface for
 * the INFRA-2961 dashboard panel) plus the rendered markdown for the pinned
 * Slack canvas. Dependency-free: node builtins + fetch only. Bucketing and
 * rendering are pure functions in review-queue/review-queue.ts, fixture-tested
 * with `bun test scripts/tamagui-migration/review-queue`.
 *
 * Usage: bun scripts/tamagui-migration/review-queue.ts [flags]
 *   --json <path>       Write review-queue.json (atomic: temp file + rename;
 *                       an existing file is never clobbered on failure)
 *   --markdown <path>   Write the rendered canvas markdown (atomic, same rule)
 *   --no-generated-at   Pin metadata.generatedAt/footer.updatedAt to the epoch
 *                       for byte-identical reruns (never null — the INFRA-2961
 *                       consumer reserves null as its placeholder marker)
 *   --apply-assignments POST each assignmentPlan entry to the ADDITIVE
 *                       /issues/<n>/assignees endpoint (never overwrites an
 *                       existing assignee — the plan only contains unassigned
 *                       PRs), logging each write. Without the flag the plan is
 *                       emitted in the JSON but nothing is written back.
 *   --help              Print this usage
 * With no output flag, the JSON document is printed to stdout.
 *
 * Env:
 *   GITHUB_TOKEN        Required. Missing token fails fast with exit 1 and no
 *                       output written (the workbench Vercel build runs this
 *                       guarded and falls back to its committed snapshot).
 *                       --apply-assignments additionally needs
 *                       pull-requests: write on it.
 *   GITHUB_REPOSITORY   owner/repo override (default Uniswap/universe).
 *   LINEAR_API_KEY      Optional. Enables the Linear step of requester
 *                       derivation: INFRA-xxxx ids in unassigned PRs'
 *                       titles/bodies are resolved to the issue's
 *                       assignee-if-human else creator, then mapped to a
 *                       GitHub login (see GITHUB_LOGIN_BY_LINEAR_EMAIL).
 *                       When unset the step is skipped with a summary note —
 *                       never an error.
 *   TEAM_REGISTRY       JSON array of { githubLogin, slackUserId, name? } —
 *                       Slack mentions in the markdown, plus display-name ->
 *                       login resolution for "Requested by **Name**" body
 *                       lines when entries carry a name.
 *   POD_BY_LOGIN        JSON object { githubLogin: pod } for the footer's
 *                       per-pod counts; unmapped logins count as unknown-pod.
 *                       Never derived from (consumable) team review requests.
 *   GITHUB_STEP_SUMMARY When set (Actions), operational notes (Linear step
 *                       skipped, unmapped Linear users, failed assignment
 *                       writes) are appended to the run summary as well as
 *                       stderr.
 */

import { execSync } from 'node:child_process'
import { appendFileSync, existsSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { buildQueue, extractLinearIssueIds, hasHumanAssignee, renderMarkdown } from './review-queue/review-queue'
import type {
  Actor,
  AssignmentPlanEntry,
  ChecksRollup,
  ClosedBasePr,
  PullRequest,
  QueueContext,
  RequestedReviewers,
  Review,
} from './review-queue/types'

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql'
const DEFAULT_REPOSITORY = 'Uniswap/universe'
const QUEUE_LABEL = 'tamagui-migration'
const PAGE_SIZE = 50
const FETCH_TIMEOUT_MS = 30_000
const EPOCH_ISO = '1970-01-01T00:00:00.000Z'
const POD_THROTTLE = { min: 3, max: 5 }

interface CliArgs {
  json?: string
  markdown?: string
  noGeneratedAt: boolean
  applyAssignments: boolean
  help: boolean
}

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { noGeneratedAt: false, applyAssignments: false, help: false }
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i]
    switch (flag) {
      case '--json':
      case '--markdown': {
        const value = argv[++i]
        if (!value || value.startsWith('--')) {
          throw new Error(`${flag} requires a path argument`)
        }
        args[flag === '--json' ? 'json' : 'markdown'] = value
        break
      }
      case '--no-generated-at':
        args.noGeneratedAt = true
        break
      case '--apply-assignments':
        args.applyAssignments = true
        break
      case '--help':
      case '-h':
        args.help = true
        break
      default:
        throw new Error(`unknown flag: ${flag} (see --help)`)
    }
  }
  return args
}

function usage(): string {
  return [
    'Usage: bun scripts/tamagui-migration/review-queue.ts [--json <path>] [--markdown <path>] [--no-generated-at] [--apply-assignments]',
    '',
    'Emits the tamagui-migration review queue (INFRA-3039): review-queue.json',
    '(schemaVersion 1, stable interface for INFRA-2961) and/or the pinned-canvas',
    'markdown. Requires GITHUB_TOKEN; honors LINEAR_API_KEY (Linear requester',
    'step), TEAM_REGISTRY, and POD_BY_LOGIN. --apply-assignments writes each',
    'assignmentPlan entry back as the PR assignee (additive endpoint — existing',
    'assignees are never overwritten). With no output flag, prints the JSON',
    'document to stdout.',
  ].join('\n')
}

// ---------------------------------------------------------------------------
// GitHub GraphQL fetcher
// ---------------------------------------------------------------------------

export interface GraphqlActor {
  login: string
  __typename: string
}

interface SearchPrNode {
  number: number
  title: string
  url: string
  isDraft: boolean
  author: GraphqlActor | null
  assignees: { nodes: { login: string }[] }
  body: string
  baseRefName: string
  headRefName: string
  labels: { nodes: { name: string }[] }
  createdAt: string
  updatedAt: string
  reviews: { nodes: { author: GraphqlActor | null; state: Review['state']; submittedAt: string | null }[] }
  reviewRequests: {
    nodes: { requestedReviewer: { __typename: string; login?: string; slug?: string } | null }[]
  }
  commits: { nodes: { commit: { statusCheckRollup: { state: string } | null } }[] }
}

interface SearchPage {
  search: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null }
    nodes: (SearchPrNode | Record<string, never>)[]
  }
}

interface RepositoryMeta {
  repository: { defaultBranchRef: { name: string } | null } | null
}

interface ClosedPrsByHeadRef {
  repository: {
    pullRequests: { nodes: { number: number; merged: boolean }[] }
  } | null
}

const SEARCH_QUERY = `
query ReviewQueueSearch($searchQuery: String!, $cursor: String) {
  search(query: $searchQuery, type: ISSUE, first: ${PAGE_SIZE}, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    nodes {
      ... on PullRequest {
        number title url isDraft
        author { login __typename }
        assignees(first: 10) { nodes { login } }
        body baseRefName headRefName
        labels(first: 20) { nodes { name } }
        createdAt updatedAt
        reviews(first: 100) { nodes { author { login __typename } state submittedAt } }
        reviewRequests(first: 20) {
          nodes { requestedReviewer { __typename ... on User { login } ... on Team { slug } } }
        }
        commits(last: 1) { nodes { commit { statusCheckRollup { state } } } }
      }
    }
  }
}`

const DEFAULT_BRANCH_QUERY = `
query ReviewQueueDefaultBranch($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) { defaultBranchRef { name } }
}`

const CLOSED_BASE_QUERY = `
query ReviewQueueClosedBase($owner: String!, $name: String!, $ref: String!) {
  repository(owner: $owner, name: $name) {
    pullRequests(headRefName: $ref, first: 5, states: [MERGED, CLOSED], orderBy: { field: UPDATED_AT, direction: DESC }) {
      nodes { number merged }
    }
  }
}`

async function githubGraphql<T>(token: string, query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(GITHUB_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'user-agent': 'uniswap-universe-review-queue',
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })
  if (!response.ok) {
    throw new Error(`GitHub GraphQL HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`)
  }
  const payload = (await response.json()) as { data?: T; errors?: { message: string }[] }
  if (payload.errors && payload.errors.length > 0) {
    throw new Error(`GitHub GraphQL errors: ${payload.errors.map((error) => error.message).join('; ')}`)
  }
  if (!payload.data) {
    throw new Error('GitHub GraphQL returned no data')
  }
  return payload.data
}

export function toActor(actor: GraphqlActor | null): Actor {
  if (!actor) {
    return { login: 'ghost', type: 'User' }
  }
  return { login: actor.login, type: actor.__typename === 'Bot' ? 'Bot' : 'User' }
}

export function toChecksRollup(state: string | undefined): ChecksRollup {
  switch (state) {
    case 'SUCCESS':
      return 'success'
    case 'FAILURE':
    case 'ERROR':
      return 'failure'
    case 'PENDING':
    case 'EXPECTED':
      return 'pending'
    default:
      return 'unknown'
  }
}

/**
 * Pick the closed PR that resolves a base ref. The query orders by
 * UPDATED_AT DESC, but recency is the wrong tiebreak on its own: Graphite
 * leaves closed-unmerged siblings on the same head branch, and a late
 * comment on one would make the merged base resolve merged:false (or vice
 * versa). Prefer a MERGED node when any exists; otherwise fall back to the
 * most recently updated closed one.
 */
export function pickClosedBasePr(nodes: { number: number; merged: boolean }[]): ClosedBasePr | undefined {
  return nodes.find((node) => node.merged) ?? nodes[0]
}

interface FetchedQueueInputs {
  prs: PullRequest[]
  reviews: Record<number, Review[]>
  checks: Record<number, ChecksRollup>
  requestedReviewers: Record<number, RequestedReviewers>
  basePrByRef: Record<string, number>
  closedBasePrs: Record<string, ClosedBasePr>
  defaultBranch: string
}

async function fetchQueueInputs(token: string, owner: string, name: string): Promise<FetchedQueueInputs> {
  const meta = await githubGraphql<RepositoryMeta>(token, DEFAULT_BRANCH_QUERY, { owner, name })
  const defaultBranch = meta.repository?.defaultBranchRef?.name ?? 'main'

  const nodes: SearchPrNode[] = []
  let cursor: string | null = null
  const searchQuery = `repo:${owner}/${name} is:pr is:open label:${QUEUE_LABEL}`
  for (;;) {
    const page: SearchPage = await githubGraphql<SearchPage>(token, SEARCH_QUERY, { searchQuery, cursor })
    for (const node of page.search.nodes) {
      if ('number' in node) {
        nodes.push(node)
      }
    }
    if (!page.search.pageInfo.hasNextPage) {
      break
    }
    cursor = page.search.pageInfo.endCursor
  }

  const prs: PullRequest[] = []
  const reviews: Record<number, Review[]> = {}
  const checks: Record<number, ChecksRollup> = {}
  const requestedReviewers: Record<number, RequestedReviewers> = {}
  const basePrByRef: Record<string, number> = {}

  for (const node of nodes) {
    prs.push({
      number: node.number,
      title: node.title,
      url: node.url,
      draft: node.isDraft,
      author: toActor(node.author),
      assignees: node.assignees.nodes.map((assignee) => assignee.login),
      body: node.body,
      baseRefName: node.baseRefName,
      headRefName: node.headRefName,
      labels: node.labels.nodes,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
    })
    reviews[node.number] = node.reviews.nodes.map((review) => ({
      author: toActor(review.author),
      state: review.state,
      submittedAt: review.submittedAt,
    }))
    checks[node.number] = toChecksRollup(node.commits.nodes[0]?.commit.statusCheckRollup?.state)
    const users: string[] = []
    const teams: string[] = []
    for (const request of node.reviewRequests.nodes) {
      const reviewer = request.requestedReviewer
      if (reviewer?.login) {
        users.push(reviewer.login)
      } else if (reviewer?.slug) {
        teams.push(reviewer.slug)
      }
    }
    requestedReviewers[node.number] = { users, teams }
    basePrByRef[node.headRefName] = node.number
  }

  // Resolve base refs that are neither the default branch nor an open PR's
  // head: find the (closed or merged) PR whose head was that branch,
  // preferring a merged node over closed-unmerged siblings (pickClosedBasePr).
  // A base resolving closed-unmerged may be a Graphite fast-forward artifact —
  // bucketPr treats it as "verify", never as merged.
  const closedBasePrs: Record<string, ClosedBasePr> = {}
  const unresolvedRefs = [
    ...new Set(prs.map((pr) => pr.baseRefName).filter((ref) => ref !== defaultBranch && !(ref in basePrByRef))),
  ]
  for (const ref of unresolvedRefs) {
    const result = await githubGraphql<ClosedPrsByHeadRef>(token, CLOSED_BASE_QUERY, { owner, name, ref })
    const found = pickClosedBasePr(result.repository?.pullRequests.nodes ?? [])
    if (found) {
      closedBasePrs[ref] = { number: found.number, merged: found.merged }
    }
  }

  return { prs, reviews, checks, requestedReviewers, basePrByRef, closedBasePrs, defaultBranch }
}

// ---------------------------------------------------------------------------
// Linear requester step (INFRA-3039 assign-back)
// ---------------------------------------------------------------------------

const LINEAR_GRAPHQL_URL = 'https://api.linear.app/graphql'
/** Aliased issues per Linear query — bounded so one request stays far under Linear's complexity cap. */
const LINEAR_BATCH_SIZE = 25

/**
 * Linear user -> GitHub login, keyed by (lowercased) Linear account email.
 * Small and explicit by design: the workflow logs unmapped Linear users to
 * the run summary rather than guessing. Entries verified via Linear's
 * User.gitHubUserId against the repo's assignable-users list.
 */
export const GITHUB_LOGIN_BY_LINEAR_EMAIL: Record<string, string> = {
  'charlie.bachmeier@uniswap.org': 'cbachmeier',
  'jm.rossy@uniswap.org': 'jmrossy',
  'thomas.osmonson@uniswap.org': 'aulneau',
  'zack.labadie@uniswap.org': 'zacklabadie',
}

/**
 * Linear accounts that are automation, not engineers. The dispatch bot is a
 * plain workspace member (User.app is false for it), so the `app` flag alone
 * cannot detect it — hence this explicit list.
 */
const LINEAR_BOT_EMAILS = new Set(['thebotfather@uniswap.org'])

export interface LinearUser {
  name: string
  email: string
  /** True for Linear app/agent users. The dispatch bot is NOT one — see LINEAR_BOT_EMAILS. */
  app: boolean
}

export interface LinearIssueActors {
  assignee: LinearUser | null
  creator: LinearUser | null
}

export function isLinearBot(user: LinearUser): boolean {
  return user.app || LINEAR_BOT_EMAILS.has(user.email.toLowerCase())
}

/**
 * Resolve a Linear issue to a GitHub login: the assignee when human, else
 * the creator when human (dispatch-created issues are creator = the
 * requesting engineer, with the bot as assignee), else null. A human without
 * a GITHUB_LOGIN_BY_LINEAR_EMAIL entry resolves to null and is recorded in
 * `unmapped` for the run summary — never guessed.
 */
export function resolveLinearIssueLogin(issue: LinearIssueActors, unmapped?: Set<string>): string | null {
  const human = [issue.assignee, issue.creator].find((user): user is LinearUser => user !== null && !isLinearBot(user))
  if (!human) {
    return null
  }
  const login = GITHUB_LOGIN_BY_LINEAR_EMAIL[human.email.toLowerCase()]
  if (!login) {
    // Name only: GITHUB_STEP_SUMMARY is world-readable — never emit the email.
    unmapped?.add(human.name)
    return null
  }
  return login
}

interface LinearIssueNode extends LinearIssueActors {
  identifier: string
}

/**
 * Batch-fetch each issue's assignee/creator from Linear and resolve them to
 * GitHub logins. Ids Linear cannot find map to null (consulted, unresolved)
 * when data comes back; but Linear's `issue(id:)` field is non-nullable
 * (`Issue!`), so a single deleted or typo'd id nulls `data` for its whole
 * batch. Failures are therefore contained PER BATCH: a failed batch (HTTP
 * error, thrown fetch, data-less GraphQL response) is skipped and logged to
 * stderr while every other batch keeps its results — one bad id must not
 * cost the whole run its Linear attribution. Never throws.
 */
export async function fetchLinearAssigneeByIssue(
  apiKey: string,
  issueIds: string[],
  unmapped: Set<string>,
): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {}
  for (let start = 0; start < issueIds.length; start += LINEAR_BATCH_SIZE) {
    const batch = issueIds.slice(start, start + LINEAR_BATCH_SIZE)
    try {
      const fields = batch
        .map(
          (id, index) =>
            `i${index}: issue(id: ${JSON.stringify(id)}) { identifier assignee { name email app } creator { name email app } }`,
        )
        .join('\n')
      const response = await fetch(LINEAR_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          // Personal API key — Linear expects it raw, without a Bearer prefix.
          authorization: apiKey,
          'content-type': 'application/json',
          'user-agent': 'uniswap-universe-review-queue',
        },
        body: JSON.stringify({ query: `query {\n${fields}\n}` }),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      })
      if (!response.ok) {
        throw new Error(`Linear GraphQL HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`)
      }
      const payload = (await response.json()) as {
        data?: Record<string, LinearIssueNode | null>
        errors?: { message: string }[]
      }
      if (!payload.data) {
        throw new Error(
          `Linear GraphQL returned no data${payload.errors ? `: ${payload.errors.map((error) => error.message).join('; ')}` : ''}`,
        )
      }
      for (const [index, id] of batch.entries()) {
        const node = payload.data[`i${index}`]
        result[id] = node ? resolveLinearIssueLogin(node, unmapped) : null
      }
    } catch (error) {
      console.error(
        `Review queue: Linear batch ${batch[0]}..${batch[batch.length - 1]} failed and was skipped (${batch.length} ids lose Linear attribution this run): ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }
  return result
}

/** Operational note: stderr always; the Actions run summary too when available. */
function appendSummary(lines: string[]): void {
  const text = `${lines.join('\n')}\n`
  console.error(text.trimEnd())
  const summaryPath = process.env.GITHUB_STEP_SUMMARY
  if (summaryPath) {
    appendFileSync(summaryPath, `${text}\n`)
  }
}

/**
 * Write the assignment plan back to GitHub via the ADDITIVE assignees
 * endpoint (POST /issues/<n>/assignees) — it can only add, so an existing
 * assignee is never clobbered. EVERY per-entry failure — non-2xx, thrown
 * fetch (timeout, network), parse error, silently-dropped login — is
 * summarized, never fatal: one bad entry must not turn the refresh red and
 * skip the Slack render.
 */
async function applyAssignments(
  token: string,
  owner: string,
  name: string,
  plan: AssignmentPlanEntry[],
): Promise<void> {
  const failures: string[] = []
  for (const entry of plan) {
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${name}/issues/${entry.number}/assignees`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          accept: 'application/vnd.github+json',
          'content-type': 'application/json',
          'user-agent': 'uniswap-universe-review-queue',
        },
        body: JSON.stringify({ assignees: [entry.login] }),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      })
      if (!response.ok) {
        failures.push(`#${entry.number} -> @${entry.login}: HTTP ${response.status}`)
        console.error(`assign #${entry.number} -> @${entry.login} failed: HTTP ${response.status}`)
        continue
      }
      const updated = (await response.json()) as { assignees?: { login: string }[] }
      const landed = updated.assignees?.some((assignee) => assignee.login.toLowerCase() === entry.login.toLowerCase())
      if (landed) {
        console.error(`assigned @${entry.login} to #${entry.number} (source: ${entry.source})`)
      } else {
        // GitHub drops non-assignable logins silently (2xx, login absent).
        failures.push(`#${entry.number} -> @${entry.login}: dropped by GitHub (not assignable?)`)
        console.error(`assign #${entry.number} -> @${entry.login}: dropped by GitHub (not assignable?)`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      failures.push(`#${entry.number} -> @${entry.login}: ${message}`)
      console.error(`assign #${entry.number} -> @${entry.login} failed: ${message}`)
    }
  }
  if (failures.length > 0) {
    appendSummary([
      '### Review queue: assignment writes failed',
      '',
      ...failures.map((failure) => `- ${failure}`),
      '',
      'These PRs keep their unattributed flag in the canvas; assign manually or fix the mapping.',
    ])
  }
}

// ---------------------------------------------------------------------------
// Env-driven registries
// ---------------------------------------------------------------------------

interface TeamRegistryEntry {
  githubLogin: string
  slackUserId: string
  name?: string
}

export function parseTeamRegistry(raw: string | undefined): {
  slackIdByLogin: Record<string, string>
  loginByName: Record<string, string>
  registryLogins: string[]
} {
  const slackIdByLogin: Record<string, string> = {}
  const loginByName: Record<string, string> = {}
  const registryLogins: string[] = []
  if (!raw) {
    return { slackIdByLogin, loginByName, registryLogins }
  }
  const entries = JSON.parse(raw) as TeamRegistryEntry[]
  if (!Array.isArray(entries)) {
    throw new Error('TEAM_REGISTRY must be a JSON array of { githubLogin, slackUserId }')
  }
  for (const entry of entries) {
    if (entry.githubLogin) {
      // Gate list for body-line assign-back (see QueueContext.registryLogins):
      // any registry entry counts, with or without a Slack id.
      registryLogins.push(entry.githubLogin)
    }
    if (entry.githubLogin && entry.slackUserId) {
      slackIdByLogin[entry.githubLogin] = entry.slackUserId
      slackIdByLogin[entry.githubLogin.toLowerCase()] = entry.slackUserId
    }
    if (entry.githubLogin && entry.name) {
      loginByName[entry.name.toLowerCase()] = entry.githubLogin
    }
  }
  return { slackIdByLogin, loginByName, registryLogins }
}

export function parsePodByLogin(raw: string | undefined): Record<string, string> {
  if (!raw) {
    return {}
  }
  const parsed = JSON.parse(raw) as Record<string, string>
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('POD_BY_LOGIN must be a JSON object of { githubLogin: pod }')
  }
  return parsed
}

/**
 * Commit of the checkout that actually ran, for metadata.gitCommit. `git
 * rev-parse HEAD` is preferred: on pull_request-triggered Actions runs
 * GITHUB_SHA is the triggering PR's ephemeral merge sha, not the pinned-main
 * tree the workflow checked out. GITHUB_SHA is only the fallback for
 * environments without a usable .git directory.
 */
function resolveGitCommit(): string | null {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return process.env.GITHUB_SHA ?? null
  }
}

/** Write via temp file + rename so a failure never clobbers an existing output. */
export function writeAtomic(path: string, content: string): void {
  const tmp = `${path}.tmp.${process.pid}`
  try {
    writeFileSync(tmp, content)
    renameSync(tmp, path)
  } catch (error) {
    if (existsSync(tmp)) {
      unlinkSync(tmp)
    }
    throw error
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    process.stdout.write(`${usage()}\n`)
    return
  }

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    throw new Error(
      'GITHUB_TOKEN is required (repo read scope). Refusing to run without it — no output file is written, so an existing review-queue.json snapshot stays intact.',
    )
  }

  const repository = process.env.GITHUB_REPOSITORY ?? DEFAULT_REPOSITORY
  const [owner, name] = repository.split('/')
  if (!owner || !name) {
    throw new Error(`GITHUB_REPOSITORY must be owner/repo, got: ${repository}`)
  }

  const { slackIdByLogin, loginByName, registryLogins } = parseTeamRegistry(process.env.TEAM_REGISTRY)
  const podByLogin = parsePodByLogin(process.env.POD_BY_LOGIN)

  const inputs = await fetchQueueInputs(token, owner, name)

  // Linear step: only PRs with no HUMAN assignee consult the map (a human
  // assignee always wins in deriveRequester; a bot-only assignee carries no
  // attribution, so those PRs still need the lookup), so only their INFRA
  // ids are fetched.
  let linearAssigneeByIssue: Record<string, string | null> | undefined
  const unmappedLinearUsers = new Set<string>()
  const issueIds = [
    ...new Set(
      inputs.prs
        .filter((pr) => !hasHumanAssignee(pr.assignees))
        .flatMap((pr) => extractLinearIssueIds(pr.title, pr.body)),
    ),
  ]
  if (issueIds.length > 0) {
    const linearApiKey = process.env.LINEAR_API_KEY
    if (linearApiKey) {
      // Best-effort enrichment: a revoked key, a 429, or a data-less GraphQL
      // response must never block the refresh (the JSON/markdown writes come
      // after this call) — log it and continue with an empty map instead.
      try {
        linearAssigneeByIssue = await fetchLinearAssigneeByIssue(linearApiKey, issueIds, unmappedLinearUsers)
      } catch (error) {
        linearAssigneeByIssue = {}
        appendSummary([
          '### Review queue: Linear step failed (non-fatal)',
          '',
          `Fetching issue assignees from Linear failed: ${error instanceof Error ? error.message : String(error)}`,
          '',
          'Requester derivation continued without the Linear step this run — PRs resolving only through their INFRA-xxxx issue stay unattributed rather than blocking the refresh.',
        ])
      }
      if (unmappedLinearUsers.size > 0) {
        appendSummary([
          '### Review queue: unmapped Linear users',
          '',
          ...[...unmappedLinearUsers].sort().map((user) => `- ${user}`),
          '',
          'These issues resolved to a human with no GITHUB_LOGIN_BY_LINEAR_EMAIL entry (scripts/tamagui-migration/review-queue.ts) — their PRs stay unattributed rather than guessed; extend the map to cover them.',
        ])
      }
    } else {
      appendSummary([
        '### Review queue: Linear step skipped',
        '',
        'LINEAR_API_KEY is not set — requester derivation ran without the Linear issue-assignee step, so PRs resolving only through their INFRA-xxxx issue stay unattributed. Configure the secret to enable it (see scripts/tamagui-migration/README.md).',
      ])
    }
  }

  const ctx: QueueContext = {
    reviews: inputs.reviews,
    checks: inputs.checks,
    requestedReviewers: inputs.requestedReviewers,
    basePrByRef: inputs.basePrByRef,
    closedBasePrs: inputs.closedBasePrs,
    defaultBranch: inputs.defaultBranch,
    now: new Date().toISOString(),
    loginByName,
    registryLogins,
    linearAssigneeByIssue,
    podByLogin,
    podThrottle: POD_THROTTLE,
    gitCommit: resolveGitCommit(),
  }

  const queue = buildQueue(inputs.prs, ctx)
  if (args.noGeneratedAt) {
    queue.metadata.generatedAt = EPOCH_ISO
    queue.footer.updatedAt = EPOCH_ISO
  }

  const json = `${JSON.stringify(queue, null, 2)}\n`
  const markdown = `${renderMarkdown(queue, { slackIdByLogin })}\n`

  if (args.json) {
    writeAtomic(args.json, json)
    console.error(`wrote ${args.json}`)
  }
  if (args.markdown) {
    writeAtomic(args.markdown, markdown)
    console.error(`wrote ${args.markdown}`)
  }
  if (!args.json && !args.markdown) {
    process.stdout.write(json)
  }

  if (queue.assignmentPlan.length > 0) {
    if (args.applyAssignments) {
      await applyAssignments(token, owner, name, queue.assignmentPlan)
    } else {
      const planSummary = queue.assignmentPlan
        .map((entry) => `#${entry.number} -> @${entry.login} (${entry.source})`)
        .join(', ')
      console.error(`assignment plan (plan-only; pass --apply-assignments to write): ${planSummary}`)
    }
  }

  if (queue.assignmentPlanExclusions.length > 0) {
    appendSummary([
      '### Review queue: assign-back skipped',
      '',
      ...queue.assignmentPlanExclusions.map(
        (entry) => `- #${entry.number} -> @${entry.login} (${entry.source}): ${entry.reason}`,
      ),
      '',
      'These PRs render with their derived requester but are never written back as assignees this run.',
    ])
  }

  const bucketCounts = Object.entries(queue.buckets)
    .map(([bucket, rows]) => `${bucket}=${rows.length}`)
    .join(' ')
  console.error(`review queue: ${inputs.prs.length} open labeled PRs -> ${bucketCounts}`)
}

// import.meta.main guard: cli-helpers.test.ts imports the exported helpers
// above without triggering the network path.
if (import.meta.main) {
  main().catch((error: unknown) => {
    console.error(`review-queue: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  })
}
