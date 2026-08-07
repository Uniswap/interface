/**
 * Data model for the Tamagui migration review queue (INFRA-3039).
 *
 * Inputs mirror the GitHub REST/GraphQL response shapes for
 * `is:open label:tamagui-migration` PRs plus their reviews, check rollups,
 * and requested reviewers. The output is the `review-queue.json` document
 * (schemaVersion 1) consumed by the pinned Slack canvas renderer and the
 * INFRA-2961 dashboard panel (mirror types in
 * labs/workbench/app/lib/review-queue-types.ts on that PR). The emitted
 * shape is a STABLE INTERFACE: breaking changes require a schemaVersion
 * bump. Dependency-free by design, matching the census-tool conventions.
 */

/** GitHub actor. `type: 'Bot'` covers app accounts (github-actions[bot], claude[bot], ...). */
export interface Actor {
  login: string
  type: 'User' | 'Bot'
}

export interface Label {
  name: string
}

/** One open pull request, as fetched from the GitHub API. */
export interface PullRequest {
  number: number
  title: string
  url: string
  draft: boolean
  author: Actor
  /** Assignee logins, in API order. */
  assignees: string[]
  body: string
  baseRefName: string
  headRefName: string
  labels: Label[]
  /** ISO 8601. */
  createdAt: string
  /** ISO 8601. Optional in fixtures; rows fall back to createdAt. */
  updatedAt?: string
}

export type ReviewState = 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING'

/** One review on a PR. */
export interface Review {
  author: Actor
  state: ReviewState
  /** ISO 8601; null for PENDING (unsubmitted draft) reviews. */
  submittedAt: string | null
}

/** Rollup of the PR head's check runs / commit statuses. */
export type ChecksRollup = 'success' | 'failure' | 'pending' | 'neutral' | 'unknown'

/**
 * Currently-pending review requests. NOTE: GitHub consumes these — a team
 * request disappears once a member reviews — so absence carries no signal
 * and no bucket decision may rely on this field alone.
 */
export interface RequestedReviewers {
  users: string[]
  teams: string[]
}

/** A closed PR whose head branch is some open PR's base (stack resolution). */
export interface ClosedBasePr {
  number: number
  /**
   * GitHub's merged flag. CAUTION: Graphite fast-forward merges can leave a
   * merged base PR reading CLOSED with merged:false (#35388/#36755); bucket
   * decisions treat closed-unmerged as "verify", never as merged or open.
   */
  merged: boolean
}

/**
 * Everything `bucketPr`/`buildQueue` need beyond the PR itself. All maps are
 * keyed by PR number (JSON fixture keys are strings; loaders coerce).
 */
export interface QueueContext {
  reviews: Record<number, Review[]>
  checks: Record<number, ChecksRollup>
  // TODO(INFRA-3039): fetched but not yet read by bucketPr/buildQueue/renderMarkdown — reserved for surfacing "review requested from @X" in the render (never for bucket decisions; see RequestedReviewers).
  requestedReviewers: Record<number, RequestedReviewers>
  /** headRefName -> PR number, for every OPEN PR in the query set (stack detection). */
  basePrByRef: Record<string, number>
  /** headRefName -> closed PR, for base refs that are not the default branch and not an open PR's head. */
  closedBasePrs?: Record<string, ClosedBasePr>
  /** Usually 'main'. */
  defaultBranch: string
  /** ISO 8601 timestamp used for ageDays and stamps (injectable for tests). */
  now: string
  /** Lowercased display name -> GitHub login, for resolving ccr-slack-attribution "Requested by **Name**" body lines. */
  loginByName?: Record<string, string>
  /**
   * GitHub logins present in TEAM_REGISTRY (matched case-insensitively).
   * Gates bare `Requested by @login` body lines at derivation, and gates
   * body/linear-derived assign-back plan entries (fail closed when unset).
   */
  registryLogins?: string[]
  /**
   * Linear issue identifier (uppercase, e.g. "INFRA-2956") -> GitHub login of
   * the engineer the issue resolves to, or null when Linear was consulted but
   * no mappable human was found. Consulted after the body-line step. The CLI
   * builds this from the Linear API when LINEAR_API_KEY is set.
   */
  linearAssigneeByIssue?: Record<string, string | null>
  /** requester login -> pod name, for the footer's per-pod counts (matched case-insensitively). Incomplete by design; unmapped logins count under 'unknown-pod'. */
  podByLogin: Record<string, string>
  /** The per-pod open-PR throttle from the migration playbook (3-5). */
  podThrottle: PodThrottle
  /** Commit the generator ran from; surfaced in metadata. */
  gitCommit?: string | null
}

export interface PodThrottle {
  min: number
  max: number
}

/**
 * How the requester (the engineer who asked for the PR) was derived.
 * Order: assignee -> "requested by <name>" line in the body -> Linear issue
 * assignee (via the INFRA-xxxx identifier in the PR title/body) -> human
 * author -> unattributed (surfaced for manual assignment, never guessed).
 */
export type RequesterSource = 'assignee' | 'body' | 'linear' | 'author' | 'unattributed'

/** Internal derivation result; emitted rows flatten it to `requester` + `requesterSource`. */
export interface Requester {
  /** GitHub login; empty string when unattributed. */
  login: string
  source: RequesterSource
}

export type BucketKey =
  | 'draftsByRequester'
  | 'needsIndependentReview'
  | 'changesRequested'
  | 'readyToMerge'
  | 'stackWaiting'

/** The bucket a PR landed in, with a human-readable why. `null` from bucketPr = excluded from the queue. */
export interface BucketDecision {
  bucket: BucketKey
  reason: string
  /**
   * Requester derived exactly once, inside bucketPr — buildQueue consumes it
   * from the decision so the bucket choice and the emitted row can never
   * disagree (lockstep by construction).
   */
  requester: Requester
}

/**
 * One emitted row of the queue (the INFRA-2961 contract).
 * Required by the consumer: number, title, url, requester, createdAt.
 */
export interface QueueRow {
  number: number
  title: string
  url: string
  /** GitHub login of the requester, or null when unattributed — never guessed. */
  requester: string | null
  requesterSource: RequesterSource
  /** ISO 8601. */
  createdAt: string
  /** ISO 8601. */
  updatedAt: string
  /** PR author login (often a bot for session PRs). */
  author: string
  baseRef: string
  draft: boolean
  checksState: ChecksRollup
  /** Human (non-bot) logins that submitted reviews, deduped, in first-review order. */
  reviewers: string[]
  /** Whole days between createdAt and ctx.now, floored. */
  ageDays: number
  bucketReason: string
}

/**
 * Buckets in lifecycle order. Every bucket is a FLAT array of rows —
 * draftsByRequester grouping by requester happens client-side.
 */
export interface QueueBuckets {
  draftsByRequester: QueueRow[]
  needsIndependentReview: QueueRow[]
  changesRequested: QueueRow[]
  readyToMerge: QueueRow[]
  stackWaiting: QueueRow[]
}

export interface QueueMetadata {
  tool: string
  /**
   * ISO 8601. ALWAYS a real timestamp — the INFRA-2961 consumer reserves
   * null as its own placeholder marker. `--no-generated-at` pins it to the
   * epoch for byte-identical reruns; it never becomes null.
   */
  generatedAt: string
  gitCommit: string | null
  label: string
}

export interface QueueFooter {
  /** Open (non-draft, non-excluded) PR count per pod, vs the throttle. */
  podCounts: Record<string, number>
  throttle: PodThrottle
  /** ISO 8601 — the "updated HH:MM" staleness stamp source. */
  updatedAt: string
  /** Labeled PRs excluded from every bucket because they carry a "do not merge" label (additive field, INFRA-3039). */
  excludedDoNotMerge: number
}

/**
 * One planned assign-back write (additive field, INFRA-3039): a PR with no
 * current GitHub assignee whose requester resolved (any non-assignee source).
 * The plan never overwrites an existing assignee; `--apply-assignments` POSTs
 * each entry via the additive `/issues/<n>/assignees` endpoint.
 */
export interface AssignmentPlanEntry {
  number: number
  login: string
  source: RequesterSource
}

/**
 * A resolved requester deliberately kept OUT of the assignment plan, with
 * why (additive field, INFRA-3039). Produced by buildQueue's assign-back
 * gates: body/linear-derived logins outside TEAM_REGISTRY (spoof gate, fail
 * closed), and author-tier fallbacks on PRs whose INFRA ids Linear did not
 * resolve. Excluded PRs still render with their derived requester.
 */
export interface AssignmentPlanExclusion {
  number: number
  login: string
  source: RequesterSource
  reason: string
}

/** The review-queue.json document. Schema changes require a version bump (stable interface for INFRA-2961). */
export interface ReviewQueue {
  schemaVersion: 1
  metadata: QueueMetadata
  buckets: QueueBuckets
  footer: QueueFooter
  /** Always present, possibly empty (additive field, no schemaVersion bump). */
  assignmentPlan: AssignmentPlanEntry[]
  /** Always present, possibly empty (additive field, no schemaVersion bump): requesters resolved but excluded from the plan, with the reason. */
  assignmentPlanExclusions: AssignmentPlanExclusion[]
}
