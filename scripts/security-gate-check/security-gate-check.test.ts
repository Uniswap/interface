/**
 * Run with `bun test scripts/security-gate-check.test.ts`.
 */
import { afterAll, beforeAll, describe, expect, setDefaultTimeout, test } from 'bun:test'
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const REPO_ROOT = join(import.meta.dir, '..', '..')
const WORKFLOW_PATH = join(REPO_ROOT, '.github', 'workflows', 'security-gate-check.yml')
const SCRIPT_PATH = join(REPO_ROOT, 'scripts', 'security-gate-check', 'security-gate-check.sh')
const WORKFLOW_SOURCE = readFileSync(WORKFLOW_PATH, 'utf8')

setDefaultTimeout(20_000)

interface WorkflowConfig {
  on: {
    pull_request_target: { types: string[] }
    pull_request_review: { types: string[] }
    workflow_run: { workflows: string[]; types: string[] }
  }
  concurrency: {
    group: string
    'cancel-in-progress': string
  }
  jobs: {
    gate: {
      if?: string
      steps: Array<{
        env?: Record<string, string>
        name?: string
        uses?: string
        with?: Record<string, string | boolean>
      }>
    }
  }
}

interface FakeCall {
  method: string
  url: string
  body: Record<string, unknown> | null
}

interface GateRun {
  calls: FakeCall[]
  exitCode: number
  stderr: string
  stdout: string
}

// YAML 1.1 reads a bare `on:` key as the BOOLEAN true, and bun's parser follows that on some
// versions: 1.3.11 yields the string key "on", the 1.3.2 pinned by .bun-version yields `true`,
// which JS then stores as the key "true". So `WORKFLOW.on` was undefined in CI and every
// assertion against it threw TypeError -- the suite passed locally and failed the moment it
// first ran on a pinned bun. Normalised once here rather than at each use site.
const WORKFLOW_RAW = Bun.YAML.parse(WORKFLOW_SOURCE) as Record<string, unknown>
const WORKFLOW = {
  ...WORKFLOW_RAW,
  on: WORKFLOW_RAW.on ?? WORKFLOW_RAW.true,
} as unknown as WorkflowConfig
// What a real PR looks like now: both counting bots plus one human. A human-authored PR needs
// MIN_HUMAN + len(COUNTING_BOTS) = 3 counted approvals, so a lone human approval is 1/3 and the
// old single-entry fixture would have left most of this suite asserting a pending state.
const APPROVED_REVIEWS = [
  {
    id: 1,
    state: 'APPROVED',
    user: { login: 'reviewer', type: 'User' },
    commit_id: 'older-head',
  },
  { commit_id: 'older-head', id: 90, state: 'APPROVED', user: { login: 'github-actions[bot]', type: 'Bot' } },
  {
    commit_id: 'older-head',
    id: 91,
    state: 'APPROVED',
    user: { login: 'uniswap-security-gate[bot]', type: 'Bot' },
  },
]
const LOW_CLASSIFIER_RESPONSE = JSON.stringify({
  content: [
    {
      type: 'text',
      text: JSON.stringify({ risk: 'low', route: 'auto', categories: [], rationale: 'Low risk.' }),
    },
  ],
})
const MEDIUM_CLASSIFIER_RESPONSE = JSON.stringify({
  content: [
    {
      type: 'text',
      text: JSON.stringify({ risk: 'medium', route: 'human', categories: [], rationale: 'Medium risk.' }),
    },
  ],
})
// A deep review that WOULD have blocked before medium became advisory: one high-severity
// finding, which DEEP_BLOCK_MIN counts regardless of the model's own verdict.
const DEEP_REVIEW_WITH_FINDINGS = JSON.stringify({
  content: [
    {
      type: 'text',
      text: JSON.stringify({
        findings: [
          {
            category: 'input-validation',
            detail: 'Unbounded value derived from upstream data.',
            file: 'README.md',
            fix_end_line: 0,
            fix_start_line: 0,
            line: 1,
            severity: 'high',
            suggestion: '',
            title: 'Unbounded priority fee',
          },
        ],
        summary: 'One unbounded value.',
        verdict: 'changes_required',
      }),
    },
  ],
})
const ONE_CHANGED_FILE = JSON.stringify([{ filename: 'README.md', patch: '@@ -1 +1 @@\n-old\n+new' }])

const FAKE_CURL = `#!/usr/bin/env bash
set -uo pipefail

method="GET"
url=""
body_file=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    -X) method="$2"; shift 2 ;;
    --data-binary) body_file="\${2#@}"; shift 2 ;;
    http://*|https://*) url="$1"; shift ;;
    *) shift ;;
  esac
done

body="null"
if [ -n "$body_file" ] && [ -f "$body_file" ]; then
  body="$(jq -c . "$body_file")"
elif case "$url" in *api.anthropic.com*) true ;; *) false ;; esac; then
  # The model calls pipe their request on STDIN rather than passing --data-binary, so without
  # this the request body -- including the system prompt -- was never recorded and any assertion
  # about what the model was actually asked silently had nothing to inspect.
  body="$(cat | jq -c . 2>/dev/null || echo null)"
fi
jq -nc --arg method "$method" --arg url "$url" --argjson body "$body" '{method:$method,url:$url,body:$body}' >> "$FAKE_GH_LOG"

case "$url" in
  *"/issues/1/comments?per_page=100&page=1")
    printf '%s' "\${FAKE_COMMENTS_JSON:-[]}" ;;
  *"/pulls/1/reviews?per_page=100&page=2")
    printf '%s' "\${FAKE_REVIEWS_PAGE_2_JSON:-[]}" ;;
  *"/pulls/1/reviews?per_page=100&page=1")
    review_count="$(grep -c 'reviews?per_page=100&page=1' "$FAKE_GH_LOG")"
    if [ -n "\${FAKE_REVIEWS_JSON_AFTER_FIRST:-}" ] && [ "$review_count" -gt 1 ]; then
      printf '%s' "$FAKE_REVIEWS_JSON_AFTER_FIRST"
    else
      printf '%s' "\${FAKE_REVIEWS_JSON:-[]}"
    fi ;;
  *"/pulls/1/reviews?per_page=100")
    printf '%s' "\${FAKE_REVIEWS_JSON:-[]}" ;;
  *"/pulls/1/reviews")
    printf '%s' '{"id":1}' ;;
  *"/pulls/1/requested_reviewers")
    if [ "$method" = "GET" ]; then
      requested_count="$(grep -c 'requested_reviewers' "$FAKE_GH_LOG")"
      if [ -n "\${FAKE_REQUESTED_JSON_AFTER_FIRST:-}" ] && [ "$requested_count" -gt 1 ]; then
        printf '%s' "$FAKE_REQUESTED_JSON_AFTER_FIRST"
      else
        printf '%s' "$FAKE_REQUESTED_JSON"
      fi
    elif [ -n "\${FAKE_REQUEST_REVIEW_FAILS:-}" ]; then
      printf '%s' '{"message":"Reviews may only be requested from collaborators."}'
    else
      printf '%s' '{"number":1}'
    fi ;;
  *"/pulls/1")
    printf '%s' "$FAKE_PR_JSON" ;;
  *"/pulls/1/files?per_page=100&page=1")
    printf '%s' "\${FAKE_FILES_JSON:-[]}" ;;
  *"/commits/abc/statuses?per_page=100")
    printf '%s' "\${FAKE_STATUSES_JSON:-[]}" ;;
  *"/orgs/Uniswap/teams/"*"/members?per_page=100&page=2")
    printf '%s' '[]' ;;
  *"/orgs/Uniswap/teams/"*"/members?per_page=100&page=1")
    printf '%s' "\${FAKE_TEAM_MEMBERS_JSON:-[]}" ;;
  *"/orgs/Uniswap/teams/"*"/members?per_page=100")
    # FAKE_TEAMS_JSON maps team slug -> member array, for the owner resolver, which expands
    # several teams per run. Unset falls back to FAKE_TEAM_MEMBERS_JSON so the single-team
    # security-approval tests behave exactly as before.
    if [ -n "\${FAKE_TEAMS_JSON:-}" ]; then
      slug="\${url#*/teams/}"; slug="\${slug%%/members*}"
      # Case-insensitive, like the real endpoint: GitHub slugs are lowercase, and the resolver
      # lowercases the owner token before looking it up, so a mixed-case CODEOWNERS entry must
      # still find its team.
      printf '%s' "$FAKE_TEAMS_JSON" | jq -c --arg s "$slug" '
        to_entries | map(select((.key | ascii_downcase) == ($s | ascii_downcase)))
        | if length > 0 then .[0].value else [] end'
    else
      printf '%s' "\${FAKE_TEAM_MEMBERS_JSON:-[]}"
    fi ;;
  *"/git/trees/"*)
    printf '%s' "\${FAKE_TREE_JSON:-}" ;;
  *"/git/blobs/"*)
    # FAKE_BLOBS_JSON maps sha -> raw file body, for cases needing two CODEOWNERS files with
    # different contents (repo-wide precedence). FAKE_BLOB_JSON stays the single-blob shorthand.
    if [ -n "\${FAKE_BLOBS_JSON:-}" ]; then
      printf '%s' "$FAKE_BLOBS_JSON" | jq -c --arg s "\${url##*/}" \
        'if has($s) then {content: (.[$s] | @base64)} else {} end'
    else
      printf '%s' "\${FAKE_BLOB_JSON:-}"
    fi ;;
  *"/compare/"*)
    printf '%s' "\${FAKE_COMPARE_JSON:-}" ;;
  *"/commits/abc")
    printf '%s' '{"commit":{"message":"test commit"}}' ;;
  *"/statuses/abc")
    if [ -n "\${FAKE_STATUS_FAILURE_CONTEXT:-}" ] \
      && [ "$(printf '%s' "$body" | jq -r '.context // empty')" = "$FAKE_STATUS_FAILURE_CONTEXT" ]; then
      printf '%s' '{"message":"status rejected"}'
    else
      printf '%s' "$body"
    fi ;;
  *"/issues/1/comments"|*"/issues/comments/")
    printf '%s' '{"id":1}' ;;
  *"/graphql")
    # reviewThreads query vs resolveReviewThread mutation, told apart by the body
    if printf '%s' "$body" | grep -q resolveReviewThread; then
      printf '%s' '{"data":{"resolveReviewThread":{"thread":{"id":"T"}}}}'
    else
      printf '%s' "\${FAKE_THREADS_JSON:-}"
    fi ;;
  *"api.anthropic.com"*)
    anthropic_count="$(grep -c 'api.anthropic.com' "$FAKE_GH_LOG")"
    if [ -n "\${FAKE_ANTHROPIC_JSON_AFTER_FIRST:-}" ] && [ "$anthropic_count" -gt 1 ]; then
      printf '%s' "$FAKE_ANTHROPIC_JSON_AFTER_FIRST"
    else
      printf '%s' "\${FAKE_ANTHROPIC_JSON:-}"
    fi ;;
  *)
    printf '%s' '{}' ;;
esac
`

let fakeBin = ''

beforeAll(() => {
  fakeBin = mkdtempSync(join(tmpdir(), 'security-gate-test-'))
  const curlPath = join(fakeBin, 'curl')
  writeFileSync(curlPath, FAKE_CURL)
  chmodSync(curlPath, 0o755)
})

afterAll(() => {
  rmSync(fakeBin, { recursive: true, force: true })
})

function runGate(overrides: Record<string, string> = {}, expectedExitCode = 0): GateRun {
  const logPath = join(fakeBin, `calls-${crypto.randomUUID()}.jsonl`)
  // A FRESH RUNNER_TEMP per run. The script keeps job-scoped state on disk at deterministic
  // paths (the min-reviews memo, UC_FILE, ANCHORS_FILE) and treats file existence as a
  // build-once guard, so a shared /tmp lets one test's state satisfy the next one's guard.
  const runnerTemp = mkdtempSync(join(tmpdir(), 'security-gate-run-'))
  const result = Bun.spawnSync({
    cmd: ['bash', SCRIPT_PATH],
    cwd: REPO_ROOT,
    env: {
      ...process.env,
      PATH: `${fakeBin}:${process.env.PATH ?? ''}`,
      ANTHROPIC_API_KEY: 'test-key',
      BOT_LOGINS: 'uniswap-security-gate[bot]',
      EVENT_ACTION: 'review_requested',
      EVENT_NAME: 'pull_request_target',
      FAKE_ANTHROPIC_JSON: '',
      FAKE_ANTHROPIC_JSON_AFTER_FIRST: '',
      FAKE_COMMENTS_JSON: '[]',
      FAKE_COMPARE_JSON: '',
      FAKE_FILES_JSON: '[]',
      FAKE_GH_LOG: logPath,
      FAKE_PR_JSON: JSON.stringify({ head: { sha: 'abc' } }),
      FAKE_REQUESTED_JSON: JSON.stringify({ users: [], teams: [] }),
      FAKE_REQUESTED_JSON_AFTER_FIRST: '',
      FAKE_REQUEST_REVIEW_FAILS: '',
      FAKE_REVIEWS_JSON: JSON.stringify(APPROVED_REVIEWS),
      FAKE_REVIEWS_JSON_AFTER_FIRST: '',
      FAKE_REVIEWS_PAGE_2_JSON: '[]',
      FAKE_STATUSES_JSON: JSON.stringify([
        { context: 'security-gate', description: 'Risk: low — passes (no security approval required).' },
      ]),
      FAKE_BLOB_JSON: '{}',
      FAKE_TEAM_MEMBERS_JSON: '[]',
      FAKE_TEAMS_JSON: '',
      FAKE_THREADS_JSON: '',
      // Default: no CODEOWNERS tree resolves, so the resolver finds nothing and every other test
      // keeps the derived baseline.
      FAKE_TREE_JSON: '{"message":"Not Found"}',
      // Pin the outage escape hatch OFF: these tests assert fail-closed policy, and the
      // script default flips during incidents (defaulted ON for the 2026-08-18 outage).
      FAIL_OPEN_ON_UNAVAILABLE: '0',
      GATE_REVIEWS: '0',
      GH_TOKEN: 'test-token',
      HEAD_SHA: 'abc',
      PR_AUTHOR: 'author',
      PR_AUTHOR_TYPE: 'User',
      PR_NUMBER: '1',
      REPO: 'Uniswap/universe',
      RUNNER_TEMP: runnerTemp,
      SECURITY_APPROVERS: '',
      SECURITY_GATE_APP_TOKEN: '',
      SECURITY_GATE_ORG_TOKEN: '',
      ...overrides,
    },
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const stdout = new TextDecoder().decode(result.stdout)
  const stderr = new TextDecoder().decode(result.stderr)
  if (result.exitCode !== expectedExitCode) {
    throw new Error(`security gate exited ${result.exitCode}\nstdout:\n${stdout}\nstderr:\n${stderr}`)
  }
  const log = existsSync(logPath) ? readFileSync(logPath, 'utf8').trim() : ''
  const calls = log ? log.split('\n').map((line) => JSON.parse(line) as FakeCall) : []
  return { calls, exitCode: result.exitCode, stderr, stdout }
}

// The gate's sticky comment as it was LAST written in a run. It is written several times per run
// (running, deep review running, verdict); only the first write on a new PR is a POST, the rest are
// PATCHes of the same comment. The findings, the band note and "To clear this" live here -- the
// gate's review is only a pointer to it.
function stickyBody(calls: FakeCall[]): string {
  return (
    calls
      .filter(
        (c) =>
          (c.method === 'POST' && c.url.endsWith('/issues/1/comments')) ||
          (c.method === 'PATCH' && /\/issues\/comments\/\d+$/.test(c.url)),
      )
      .map((c) => (c.body?.body as string) ?? '')
      .at(-1) ?? ''
  )
}

function statusFor(calls: FakeCall[], context: string): Record<string, unknown> | undefined {
  return calls
    .filter((call) => call.method === 'POST' && call.url.endsWith('/statuses/abc'))
    .map((call) => call.body)
    .filter((body): body is Record<string, unknown> => body?.context === context)
    .at(-1)
}

describe('Security gate review-state workflow', () => {
  test('subscribes to every review-state change', () => {
    expect(WORKFLOW.on.pull_request_target.types).toEqual([
      'opened',
      'synchronize',
      'reopened',
      'ready_for_review',
      'review_requested',
      'review_request_removed',
    ])
    expect(WORKFLOW.on.pull_request_review.types).toEqual(['submitted', 'dismissed'])

    const gateStep = WORKFLOW.jobs.gate.steps.find((step) => step.name === 'Security gate (pass/fail)')
    expect(gateStep?.env?.EVENT_ACTION).toBe('${{ github.event.action }}')

    const checkoutStep = WORKFLOW.jobs.gate.steps.find((step) => step.uses?.startsWith('actions/checkout@'))
    expect(checkoutStep?.with?.ref).toBe('${{ github.event.repository.default_branch }}')
    // Both the script and the accepted-risk context come from the default branch. Asserted by
    // containment rather than equality so adding a third trusted file does not fail this test
    // for the wrong reason — what matters is the ref, and that these two are in the set.
    const sparse = String(checkoutStep?.with?.['sparse-checkout'])
    expect(sparse).toContain('scripts/security-gate-check/security-gate-check.sh')
    expect(sparse).toContain('scripts/security-gate-check/security-gate-context.md')
  })

  test('recomputes when the AI reviewer workflow completes', () => {
    // The reviewer posts with GITHUB_TOKEN, and GitHub does not trigger workflows from
    // GITHUB_TOKEN events — so its APPROVE never fires pull_request_review and the count went
    // stale. workflow_run fires on that workflow completing instead. The name must match the
    // reviewer's `name:` exactly or this silently never fires.
    expect(WORKFLOW.on.workflow_run).toEqual({ types: ['completed'], workflows: ['PR Review'] })

    // Fork PRs carry an empty pull_requests array; a run with no PR number would post a status
    // onto nothing.
    expect(WORKFLOW.jobs.gate.if).toContain("github.event_name != 'workflow_run'")
    expect(WORKFLOW.jobs.gate.if).toContain('pull_requests[0].number != null')

    // And it must not cancel an in-flight gate run, same as any other review-state event.
    expect(WORKFLOW.concurrency['cancel-in-progress']).toContain("github.event_name == 'workflow_run'")
  })

  test('derives the PR number and head SHA from every event shape', () => {
    // Three shapes now, each with the number and the SHA in a different place:
    //   pull_request_target / pull_request_review -> event.pull_request
    //   workflow_run                              -> event.workflow_run
    //   issue_comment                             -> event.issue + the prhead step, because a
    //                                                comment payload carries no head SHA at all
    // A missing arm does not fail loudly: HEAD_SHA arrives empty and the script's `${HEAD_SHA:?}`
    // guard aborts the run, which on a required check means the PR blocks with no explanation.
    const gate = (WORKFLOW as any).jobs.gate.steps.find((s: any) =>
      s.name?.startsWith('Security gate'),
    )
    for (const source of [
      'github.event.pull_request.number',
      'github.event.workflow_run.pull_requests[0].number',
      'github.event.issue.number',
    ]) {
      expect(gate.env.PR_NUMBER).toContain(source)
    }
    for (const source of [
      'github.event.pull_request.head.sha',
      'github.event.workflow_run.head_sha',
      'steps.prhead.outputs.sha',
    ]) {
      expect(gate.env.HEAD_SHA).toContain(source)
    }
  })

  test('the step that resolves a comment head actually runs before the gate', () => {
    // steps.prhead.outputs.sha is only populated if the step exists, is id'd `prhead`, and is
    // ordered ahead of the gate step. Referencing a later step yields empty, not an error.
    const steps = (WORKFLOW as any).jobs.gate.steps
    const prhead = steps.findIndex((s: any) => s.id === 'prhead')
    const gate = steps.findIndex((s: any) => s.name?.startsWith('Security gate'))
    expect(prhead).toBeGreaterThan(-1)
    expect(gate).toBeGreaterThan(prhead)
    expect(steps[prhead].if).toContain("github.event_name == 'issue_comment'")
  })

  test('queues review-state changes behind the PR gate without cancelling it', () => {
    // Asserted by containment, not equality. The group is now a conditional expression that
    // parks unauthorised comment runs in a throwaway lane, so pinning the whole string made this
    // test a change-detector. What it actually cares about is that a real run keys on the PR:
    // a group resolving empty would put every PR in one bucket and let them cancel each other.
    expect(WORKFLOW.concurrency.group).toContain('github.event.pull_request.number')
    expect(WORKFLOW.concurrency.group).toContain('workflow_run.pull_requests[0].number')
    const cancelExpression = WORKFLOW.concurrency['cancel-in-progress'].replace(/\s+/g, ' ')

    expect(cancelExpression).toContain("!(github.event_name == 'pull_request_review'")
    expect(cancelExpression).toContain("github.event.action == 'review_requested'")
    expect(cancelExpression).toContain("github.event.action == 'review_request_removed'")
  })

  test('every review-state trigger also queues instead of cancelling', () => {
    // The invariant, rather than a list: a pull_request_target action that does NOT change the
    // code must appear in the cancel-in-progress exclusion, or it can kill an in-flight run that
    // was about to post. ready_for_review was added to the trigger list without being added
    // there, and on Uniswap/backend#13856 that took out both runs -- two pull_request_target
    // events one second apart (ready_for_review plus a CODEOWNERS auto review_requested), both
    // cancelled. The statuses survived only because the gate's own APPROVE fired a later
    // pull_request_review run that redid the work.
    //
    // For a draft readied with no later push, that run is the ONLY one that posts on the head, so
    // losing it leaves both required contexts on "Expected" -- blocking with no explanation.
    const cancelExpression = WORKFLOW.concurrency['cancel-in-progress'].replace(/\s+/g, ' ')
    const types: string[] = (WORKFLOW as any).on.pull_request_target.types

    // Actions that genuinely obsolete in-flight work: a new head needs recomputing from scratch.
    const codeChanging = ['opened', 'synchronize', 'reopened']
    for (const action of types.filter((t) => !codeChanging.includes(t))) {
      expect(cancelExpression).toContain(`github.event.action == '${action}'`)
    }
    // And the code-changing ones must NOT be excluded, or stale verdicts would survive a push.
    for (const action of codeChanging) {
      expect(cancelExpression).not.toContain(`github.event.action == '${action}'`)
    }
  })
})

describe('draft PRs are not gated', () => {
  // Every assertion here is about the pair: skipping a draft is only safe because a draft cannot
  // merge, and only complete if the PR is gated again the moment it can. Losing either half is
  // worse than having neither -- a PR readied from draft with no re-gate sits on two required
  // contexts that never post, blocking with no explanation.
  const skippedCalls = (calls: FakeCall[]) =>
    calls.filter(
      (call) =>
        (call.method === 'POST' && call.url.endsWith('/statuses/abc')) ||
        /\/pulls\/1\/reviews$/.test(call.url) ||
        call.url.includes('api.anthropic.com') ||
        (call.method === 'POST' && call.url.endsWith('/issues/1/comments')),
    )

  test('the workflow re-gates on ready_for_review and skips drafts at the job guard', () => {
    // The trigger that turns the gate back on. Asserted separately from the full types list so a
    // reorder elsewhere does not hide its removal.
    expect(WORKFLOW.on.pull_request_target.types).toContain('ready_for_review')
    // Job-level guard for the events whose payload carries the flag. `!= true` and not `== false`
    // on purpose: workflow_run and issue_comment have no pull_request object, and null must let
    // the job run so the script can resolve the flag from the API. Bot-authored drafts always
    // reach the script, which owns the exempt-automation list.
    const guard = String(WORKFLOW.jobs.gate.if).replace(/\s+/g, ' ')
    expect(guard).toContain(
      "(github.event.pull_request.draft != true || github.event.pull_request.user.type == 'Bot')",
    )
    const gateStep = WORKFLOW.jobs.gate.steps.find((step) => step.name === 'Security gate (pass/fail)')
    expect(gateStep?.env?.PR_DRAFT).toBe('${{ github.event.pull_request.draft }}')
  })

  test('a draft from the event payload posts nothing and exits clean', () => {
    const run = runGate({ PR_DRAFT: 'true' })
    expect(run.stdout).toContain('draft: skipping')
    expect(skippedCalls(run.calls)).toEqual([])
  })

  test('a draft is resolved from the API when the payload did not carry the flag', () => {
    // workflow_run shape: no pull_request object, so author and draft both come from GET /pulls.
    const run = runGate({
      EVENT_ACTION: 'completed',
      EVENT_NAME: 'workflow_run',
      FAKE_PR_JSON: JSON.stringify({ draft: true, head: { sha: 'abc' }, user: { login: 'author', type: 'User' } }),
      PR_AUTHOR: '',
      PR_AUTHOR_TYPE: '',
      PR_DRAFT: '',
    })
    expect(run.stdout).toContain('draft=true')
    expect(run.stdout).toContain('draft: skipping')
    expect(skippedCalls(run.calls)).toEqual([])
  })

  test('an unknown draft state gates rather than skips', () => {
    // The API returned an error object, so the flag cannot be read. Skipping here would let an
    // API outage switch the gate off; the run must proceed and post as usual.
    const run = runGate({
      FAKE_PR_JSON: JSON.stringify({ message: 'Server Error' }),
      PR_DRAFT: '',
    })
    expect(run.stdout).toContain('draft=<unknown>')
    expect(run.stdout).not.toContain('draft: skipping')
    expect(statusFor(run.calls, 'security-gate')).toBeDefined()
    expect(statusFor(run.calls, 'review-integrity')).toBeDefined()
  })

  test('a ready PR is gated exactly as before', () => {
    const run = runGate({ PR_DRAFT: 'false' })
    expect(run.stdout).not.toContain('draft: skipping')
    expect(statusFor(run.calls, 'security-gate')).toBeDefined()
    expect(statusFor(run.calls, 'review-integrity')).toBeDefined()
  })

  test("an exempt automation author's draft is still gated", () => {
    // Exempt automation opens draft PRs it expects required checks to report on; skipping
    // would leave both contexts "Expected" forever.
    const run = runGate({
      PR_AUTHOR: 'dependabot[bot]',
      PR_AUTHOR_TYPE: 'Bot',
      PR_DRAFT: 'true',
    })
    expect(run.stdout).toContain('draft: gating anyway')
    expect(run.stdout).not.toContain('draft: skipping')
    expect(statusFor(run.calls, 'security-gate')).toBeDefined()
    expect(statusFor(run.calls, 'review-integrity')).toBeDefined()
  })

  test("a non-exempt bot's draft is skipped like a human's", () => {
    // The exemption is a denylist of authors that act on their own behalf; a coding agent's
    // draft is a person's work in progress and gets the same treatment as theirs.
    const run = runGate({
      PR_AUTHOR: 'claude[bot]',
      PR_AUTHOR_TYPE: 'Bot',
      PR_DRAFT: 'true',
    })
    expect(run.stdout).toContain('draft: skipping')
    expect(skippedCalls(run.calls)).toEqual([])
  })

  test('/gate re-run on a draft is skipped too', () => {
    // No override for the manual command. A re-run only ever REFRESHES a recorded verdict (see
    // rc_decline), and a PR opened as a draft has none: honouring it would post review-integrity
    // alone and walk away with security-gate never posted -- half a gate, which reads as a stuck
    // check rather than an unevaluated one. Marking the PR ready is the way to get a verdict.
    const run = runGate({
      EVENT_ACTION: 'created',
      EVENT_NAME: 'issue_comment',
      PR_DRAFT: 'true',
    })
    expect(run.stdout).toContain('draft: skipping')
    expect(skippedCalls(run.calls)).toEqual([])
  })
})

describe('Security gate review-state behavior', () => {
  test('re-requesting an approved reviewer makes the human approval pending', () => {
    const { calls } = runGate({
      FAKE_REQUESTED_JSON: JSON.stringify({ users: [{ login: 'reviewer' }], teams: [] }),
    })

    expect(statusFor(calls, 'review-integrity')).toMatchObject({
      state: 'pending',
      description: '2/3 approvals — 1 more needed (bot approvals count).',
    })
    expect(calls.some((call) => call.url.includes('api.anthropic.com'))).toBe(false)
  })

  test('re-requesting an approved reviewer through their team makes the human approval pending', () => {
    const { calls } = runGate({
      FAKE_REQUESTED_JSON: JSON.stringify({ users: [], teams: [{ slug: 'interface' }] }),
      FAKE_TEAM_MEMBERS_JSON: JSON.stringify([{ login: 'reviewer' }]),
      SECURITY_GATE_APP_TOKEN: 'app-token',
    })

    expect(statusFor(calls, 'review-integrity')).toMatchObject({
      state: 'pending',
      description: '2/3 approvals — 1 more needed (bot approvals count).',
    })
  })

  test('a request for an unrelated team does not invalidate an existing approval', () => {
    const { calls } = runGate({
      FAKE_REQUESTED_JSON: JSON.stringify({ users: [], teams: [{ slug: 'interface' }] }),
      FAKE_TEAM_MEMBERS_JSON: JSON.stringify([{ login: 'someone-else' }]),
      SECURITY_GATE_APP_TOKEN: 'app-token',
    })

    expect(statusFor(calls, 'review-integrity')).toMatchObject({
      state: 'success',
      description: '3 approval(s), 1 human (self-approval excluded).',
    })
  })

  test('removing the request restores the existing human approval', () => {
    const { calls } = runGate({ EVENT_ACTION: 'review_request_removed' })

    expect(statusFor(calls, 'review-integrity')).toMatchObject({
      state: 'success',
      description: '3 approval(s), 1 human (self-approval excluded).',
    })
    expect(calls.some((call) => call.url.includes('api.anthropic.com'))).toBe(false)
  })

  // There is deliberately no self-event skip: the workflow passes no actor identity, so a
  // gate-authored event runs the identical recompute a human-authored one does. Safe because
  // the review and team-request mutations are idempotent against canonical GitHub state.
  test.each([
    ['reviewer request', 'pull_request_target', 'review_requested'],
    ['submitted review', 'pull_request_review', 'submitted'],
  ])('recomputes canonical state for a %s event regardless of actor', (_label, eventName, action) => {
    const { calls } = runGate({
      EVENT_ACTION: action,
      EVENT_NAME: eventName,
    })

    expect(statusFor(calls, 'review-integrity')).toMatchObject({ state: 'success' })
    expect(statusFor(calls, 'security-gate')).toMatchObject({ state: 'success' })
  })

  test('fails closed when a review-state run cannot recover the prior risk', () => {
    const { calls } = runGate({ ANTHROPIC_API_KEY: '', FAKE_STATUSES_JSON: '[]' })

    expect(statusFor(calls, 'security-gate')).toMatchObject({
      state: 'failure',
      description: 'Assessment unavailable — security review required (fail-closed).',
    })
  })

  test('leaves review-state sentinels blocking when the prior status response is invalid', () => {
    const { calls, exitCode, stderr } = runGate(
      {
        FAKE_ANTHROPIC_JSON: LOW_CLASSIFIER_RESPONSE,
        FAKE_FILES_JSON: ONE_CHANGED_FILE,
        FAKE_STATUSES_JSON: JSON.stringify({ message: 'Service unavailable' }),
      },
      1,
    )

    expect(exitCode).toBe(1)
    expect(stderr).toContain('cannot read prior security-gate status')
    expect(statusFor(calls, 'review-integrity')).toMatchObject({ state: 'pending' })
    expect(statusFor(calls, 'security-gate')).toMatchObject({
      state: 'pending',
      description: 'Review state changed — recalculating.',
    })
    expect(calls.some((call) => call.url.includes('api.anthropic.com'))).toBe(false)
  })

  test('classifies a review-state event when a healthy status list has no prior gate decision', () => {
    const { calls } = runGate({
      FAKE_ANTHROPIC_JSON: LOW_CLASSIFIER_RESPONSE,
      FAKE_FILES_JSON: ONE_CHANGED_FILE,
      FAKE_STATUSES_JSON: '[]',
    })

    expect(statusFor(calls, 'security-gate')).toMatchObject({
      state: 'success',
      description: 'Risk: low — passes (no security approval required).',
    })
    expect(calls.some((call) => call.url.includes('api.anthropic.com'))).toBe(true)
  })

  test('replaces a prior green decision with pending before recalculating', () => {
    const { calls, exitCode, stderr } = runGate({ FAKE_STATUS_FAILURE_CONTEXT: 'review-integrity' }, 1)

    expect(exitCode).toBe(1)
    expect(stderr).toContain('cannot publish blocking pending statuses')
    expect(statusFor(calls, 'security-gate')).toMatchObject({
      state: 'pending',
      description: 'Recalculating — was: Risk: low — passes (no security approval required).',
    })
  })

  test("recovers the prior verdict from an interrupted run's sentinel", () => {
    const sentinel = 'Recalculating — was: Risk: low — passes (no security approval required).'
    const { calls } = runGate({
      ANTHROPIC_API_KEY: '',
      FAKE_STATUSES_JSON: JSON.stringify([{ context: 'security-gate', description: sentinel }]),
    })

    expect(statusFor(calls, 'security-gate')).toMatchObject({
      state: 'success',
      description: 'Risk: low — passes (no security approval required).',
    })
    expect(calls.some((call) => call.url.includes('api.anthropic.com'))).toBe(false)
    // Re-seeding from a sentinel must not nest prefixes — the embedded text stays parseable.
    const seed = calls
      .filter((call) => call.method === 'POST' && call.url.endsWith('/statuses/abc'))
      .map((call) => call.body)
      .find((body) => body?.context === 'security-gate' && body.state === 'pending')
    expect(seed).toMatchObject({ description: sentinel })
  })

  test('a stale review event recomputes the current PR head', () => {
    const { calls, stdout } = runGate({ HEAD_SHA: 'stale-head' })

    expect(stdout).toContain('review-state: refreshing stale head stale-head -> abc')
    expect(statusFor(calls, 'review-integrity')).toMatchObject({ state: 'success' })
    expect(statusFor(calls, 'security-gate')).toMatchObject({ state: 'success' })
    expect(calls.some((call) => call.url.endsWith('/statuses/stale-head'))).toBe(false)
  })

  test('uses a reviewer request that arrives during the run for its final integrity status', () => {
    const { calls } = runGate({
      FAKE_REQUESTED_JSON_AFTER_FIRST: JSON.stringify({ users: [{ login: 'reviewer' }], teams: [] }),
    })

    expect(statusFor(calls, 'review-integrity')).toMatchObject({
      state: 'pending',
      description: '2/3 approvals — 1 more needed (bot approvals count).',
    })
  })

  test('supersedes a requested-changes review found after the first review page', () => {
    const pageOneReviews = [
      ...Array.from({ length: 99 }, (_, index) => ({
        id: index + 1,
        state: 'COMMENTED',
        user: { login: `reviewer-${index}`, type: 'User' },
        commit_id: 'abc',
      })),
      {
        id: 100,
        state: 'APPROVED',
        user: { login: 'uniswap-security-gate[bot]', type: 'Bot' },
        commit_id: 'older-head',
      },
    ]
    const pageTwoReviews = [
      {
        id: 101,
        state: 'CHANGES_REQUESTED',
        user: { login: 'uniswap-security-gate[bot]', type: 'Bot' },
        commit_id: 'abc',
      },
    ]
    const { calls } = runGate({
      FAKE_REVIEWS_JSON: JSON.stringify(pageOneReviews),
      FAKE_REVIEWS_PAGE_2_JSON: JSON.stringify(pageTwoReviews),
      GATE_REVIEWS: '1',
      SECURITY_GATE_APP_TOKEN: 'app-token',
    })

    expect(calls).toContainEqual(
      expect.objectContaining({
        method: 'POST',
        url: expect.stringMatching(/\/pulls\/1\/reviews$/),
        body: expect.objectContaining({ event: 'APPROVE' }),
      }),
    )
  })

  test('does not submit a review when the final review refresh fails', () => {
    const { calls, stdout } = runGate({
      FAKE_REVIEWS_JSON_AFTER_FIRST: '{}',
      GATE_REVIEWS: '1',
      SECURITY_GATE_APP_TOKEN: 'app-token',
    })

    expect(stdout).toContain('gate-review: current review state unavailable — not submitting a review')
    expect(calls.some((call) => call.method === 'POST' && /\/pulls\/1\/reviews$/.test(call.url))).toBe(false)
  })

  test('uses a Security request that arrives during the run for its final gate status', () => {
    const securityApproval = [
      {
        id: 2,
        state: 'APPROVED',
        user: { login: 'security-reviewer', type: 'User' },
        commit_id: 'abc',
      },
    ]
    const { calls } = runGate({
      FAKE_REQUESTED_JSON_AFTER_FIRST: JSON.stringify({ users: [], teams: [{ slug: 'security' }] }),
      FAKE_REVIEWS_JSON: JSON.stringify(securityApproval),
      FAKE_STATUSES_JSON: JSON.stringify([
        {
          context: 'security-gate',
          description: 'Risk: high — blocked · deep review clear (0 findings, 0 blocking).',
        },
      ]),
      FAKE_TEAM_MEMBERS_JSON: JSON.stringify([{ login: 'security-reviewer' }]),
      SECURITY_GATE_APP_TOKEN: 'app-token',
    })

    expect(statusFor(calls, 'security-gate')).toMatchObject({
      state: 'failure',
      description: expect.stringContaining('security-team approval required'),
    })
  })

  test('re-requesting a Security approver invalidates their current-head approval', () => {
    const securityApproval = [
      {
        id: 2,
        state: 'APPROVED',
        user: { login: 'security-reviewer', type: 'User' },
        commit_id: 'abc',
      },
    ]
    const { calls } = runGate({
      FAKE_REQUESTED_JSON: JSON.stringify({ users: [{ login: 'security-reviewer' }], teams: [] }),
      FAKE_REVIEWS_JSON: JSON.stringify(securityApproval),
      FAKE_STATUSES_JSON: JSON.stringify([
        {
          context: 'security-gate',
          description: 'Risk: high — blocked · deep review clear (0 findings, 0 blocking).',
        },
      ]),
      FAKE_TEAM_MEMBERS_JSON: JSON.stringify([{ login: 'security-reviewer' }]),
      SECURITY_GATE_APP_TOKEN: 'app-token',
    })

    expect(statusFor(calls, 'security-gate')).toMatchObject({
      state: 'failure',
      description: expect.stringContaining('security-team approval required'),
    })
  })

  test('does not request Security again while the team request is pending', () => {
    const priorComment = {
      id: 1,
      user: { login: 'uniswap-security-gate[bot]' },
      body: '<!-- security-gate:required risk=high sha=abc team=1 deep=clear review=none dfp=0 -->',
    }
    const { calls } = runGate({
      ANTHROPIC_API_KEY: '',
      FAKE_COMMENTS_JSON: JSON.stringify([priorComment]),
      FAKE_REQUESTED_JSON: JSON.stringify({ users: [], teams: [{ slug: 'security' }] }),
      FAKE_REVIEWS_JSON: '[]',
      FAKE_STATUSES_JSON: JSON.stringify([
        {
          context: 'security-gate',
          description: 'Risk: high — blocked · deep review clear (0 findings, 0 blocking).',
        },
      ]),
      SECURITY_GATE_APP_TOKEN: 'app-token',
    })

    expect(calls.some((call) => call.method === 'POST' && call.url.endsWith('/pulls/1/requested_reviewers'))).toBe(
      false,
    )
    expect(statusFor(calls, 'security-gate')).toMatchObject({
      state: 'failure',
      description: expect.stringContaining('Risk: high'),
    })
  })

  test('does not request Security when requested-reviewer API returns an error object', () => {
    // A broken requested_reviewers read cannot tell whether the team is already pending, and
    // re-requesting fires review_requested — a run loop for as long as the endpoint is down.
    const { calls } = runGate({
      ANTHROPIC_API_KEY: '',
      FAKE_REQUESTED_JSON: JSON.stringify({ message: 'Service unavailable' }),
      FAKE_STATUSES_JSON: JSON.stringify([
        {
          context: 'security-gate',
          description: 'Risk: high — blocked · deep review clear (0 findings, 0 blocking).',
        },
      ]),
      SECURITY_GATE_APP_TOKEN: 'app-token',
    })

    expect(calls.some((call) => call.method === 'POST' && call.url.endsWith('/pulls/1/requested_reviewers'))).toBe(
      false,
    )
    expect(statusFor(calls, 'review-integrity')).toMatchObject({
      state: 'failure',
      description: 'Cannot verify approvals — failing closed.',
    })
    expect(statusFor(calls, 'security-gate')).toMatchObject({
      state: 'failure',
      description: expect.stringContaining('security-team approval required'),
    })
  })

  test('restores a gate-owned Security request after it is removed', () => {
    const priorComment = {
      id: 1,
      user: { login: 'uniswap-security-gate[bot]' },
      body: '<!-- security-gate:required risk=high sha=abc team=1 deep=clear review=none dfp=0 -->',
    }
    const { calls } = runGate({
      EVENT_ACTION: 'review_request_removed',
      FAKE_COMMENTS_JSON: JSON.stringify([priorComment]),
      FAKE_REVIEWS_JSON: '[]',
      FAKE_STATUSES_JSON: JSON.stringify([
        {
          context: 'security-gate',
          description: 'Risk: high — blocked · deep review clear (0 findings, 0 blocking).',
        },
      ]),
      SECURITY_GATE_APP_TOKEN: 'app-token',
    })

    expect(calls).toContainEqual(
      expect.objectContaining({ method: 'POST', url: expect.stringContaining('/pulls/1/requested_reviewers') }),
    )
    expect(statusFor(calls, 'security-gate')).toMatchObject({
      state: 'failure',
      description: expect.stringContaining('security-team approval required'),
    })
  })
})

describe('bot-authored PRs: which approvals count', () => {
  // The pre-existing suite had no bot-authored coverage at all, so none of it constrains this.
  const rv = (id: number, login: string, type: string) => ({
    commit_id: 'abc',
    id,
    state: 'APPROVED',
    user: { login, type },
  })
  const GA = rv(1, 'github-actions[bot]', 'Bot')
  const SG = rv(2, 'uniswap-security-gate[bot]', 'Bot')
  const ALICE = rv(3, 'alice', 'User')
  const BOB = rv(4, 'bob', 'User')
  const OTHER = rv(5, 'random[bot]', 'Bot')

  const botPr = (reviews: unknown[], extra: Record<string, string> = {}) => ({
    FAKE_ANTHROPIC_JSON: LOW_CLASSIFIER_RESPONSE,
    FAKE_FILES_JSON: ONE_CHANGED_FILE,
    FAKE_REVIEWS_JSON: JSON.stringify(reviews),
    PR_AUTHOR: 'claude[bot]',
    PR_AUTHOR_TYPE: 'Bot',
    ...extra,
  })

  test('the two reviewing bots alone do not satisfy the requirement', () => {
    // Both approve automatically, so if two were enough a bot-authored PR would merge with
    // nobody having read it. That is what the +1 is for.
    const { calls } = runGate(botPr([GA, SG]))
    expect(statusFor(calls, 'review-integrity')).toMatchObject({
      description: expect.stringContaining('2/4 approvals — 2 more needed'),
      state: 'pending',
    })
  })

  test('two bots plus one human is NOT enough', () => {
    // Was sufficient when the requirement was 3. It no longer is, because that single human
    // could be the engineer who asked the bot for the change.
    const { calls } = runGate(botPr([GA, SG, ALICE]))
    expect(statusFor(calls, 'review-integrity')).toMatchObject({
      description: expect.stringContaining('3/4'),
      state: 'pending',
    })
  })

  test('two humans plus ONE bot is short by one — the accepted cost of this rule', () => {
    // Two humans have approved, so the anti-self-merge intent is already satisfied — but the
    // count is 3 against a requirement of 4 because only one counting bot approved. Measured at
    // 4 of 31 recent merged bot-authored PRs (2 humans, gate approved, AI reviewer did not).
    // Those resolve when the reviewer approves; it is a real cost of expressing the rule as a
    // count rather than as "two humans", and it is deliberate.
    const { calls } = runGate(botPr([SG, ALICE, BOB]))
    expect(statusFor(calls, 'review-integrity')).toMatchObject({
      description: expect.stringContaining('3/4'),
      state: 'pending',
    })
  })

  test('two humans plus both bots passes', () => {
    const { calls } = runGate(botPr([GA, SG, ALICE, BOB]))
    expect(statusFor(calls, 'review-integrity')).toMatchObject({ state: 'success' })
  })

  test('a bot outside COUNTING_BOTS does not contribute', () => {
    const { calls, stdout } = runGate(botPr([GA, SG, OTHER]))
    expect(stdout).toContain('counting=2 req=4')
    expect(statusFor(calls, 'review-integrity')).toMatchObject({ state: 'pending' })
  })

  test('COUNTING_BOTS is configurable and drives the tally', () => {
    const { calls } = runGate(botPr([GA, SG, OTHER], { COUNTING_BOTS: 'random' }))
    // Only random[bot] counts now, so one approval against a requirement of three.
    expect(statusFor(calls, 'review-integrity')).toMatchObject({
      description: expect.stringContaining('1/3'),
      state: 'pending',
    })
  })

  test('BOT_APPROVALS_COUNT=0 restores the human-only rule', () => {
    const { calls } = runGate(botPr([GA, SG, ALICE], { BOT_APPROVALS_COUNT: '0' }))
    expect(statusFor(calls, 'review-integrity')).toMatchObject({
      description: expect.stringContaining('bot approvals do not count'),
      state: 'pending',
    })
  })

  test('an exempt bot author is unaffected', () => {
    // Exempt automation's PRs carry no reviewers by construction, so a human count would
    // permanently block them.
    const { calls } = runGate(botPr([], { PR_AUTHOR: 'dependabot[bot]' }))
    expect(statusFor(calls, 'review-integrity')).toMatchObject({
      description: expect.stringContaining('Exempt bot author'),
      state: 'success',
    })
  })

  test('a human-authored PR is unaffected by the counting allowlist', () => {
    // One human approval, plus both bots. The human floor is 1 here, and the bots must not be
    // what satisfies it.
    const { calls } = runGate({
      FAKE_ANTHROPIC_JSON: LOW_CLASSIFIER_RESPONSE,
      FAKE_FILES_JSON: ONE_CHANGED_FILE,
      FAKE_REVIEWS_JSON: JSON.stringify([GA, SG, ALICE]),
    })
    expect(statusFor(calls, 'review-integrity')).toMatchObject({ state: 'success' })
    const noHuman = runGate({
      FAKE_ANTHROPIC_JSON: LOW_CLASSIFIER_RESPONSE,
      FAKE_FILES_JSON: ONE_CHANGED_FILE,
      FAKE_REVIEWS_JSON: JSON.stringify([GA, SG]),
    })
    expect(statusFor(noHuman.calls, 'review-integrity')).toMatchObject({
      description: expect.stringContaining('more needed'),
      state: 'pending',
    })
  })
})

describe('workflow_run recomputes without reclassifying', () => {
  const priorLow = JSON.stringify([
    { context: 'security-gate', description: 'Risk: low — passes (no security approval required).' },
  ])

  test('reuses the prior risk instead of calling the model again', () => {
    // The whole point of routing workflow_run through is_review_state_event: the AI reviewer
    // finishing means approvals may have changed, not that the diff has. Reclassifying would
    // pay for a model call on every reviewer run.
    const { calls } = runGate({
      EVENT_ACTION: '',
      EVENT_NAME: 'workflow_run',
      FAKE_ANTHROPIC_JSON: LOW_CLASSIFIER_RESPONSE,
      FAKE_FILES_JSON: ONE_CHANGED_FILE,
      FAKE_STATUSES_JSON: priorLow,
    })
    expect(calls.some((call) => call.url.includes('api.anthropic.com'))).toBe(false)
    expect(statusFor(calls, 'security-gate')).toMatchObject({ state: 'success' })
  })

  test('picks up an approval that arrived without an event', () => {
    // The reviewer's APPROVE, invisible to pull_request_review. review-integrity must count it.
    const { calls, stdout } = runGate({
      EVENT_ACTION: '',
      EVENT_NAME: 'workflow_run',
      FAKE_FILES_JSON: ONE_CHANGED_FILE,
      FAKE_REVIEWS_JSON: JSON.stringify([
        { commit_id: 'abc', id: 1, state: 'APPROVED', user: { login: 'github-actions[bot]', type: 'Bot' } },
        { commit_id: 'abc', id: 2, state: 'APPROVED', user: { login: 'uniswap-security-gate[bot]', type: 'Bot' } },
      ]),
      FAKE_STATUSES_JSON: priorLow,
      PR_AUTHOR: 'claude[bot]',
      PR_AUTHOR_TYPE: 'Bot',
    })
    // Both counting bots seen — the number that was stuck at 1 on #12457. Two of the four a
    // bot-authored PR needs.
    expect(stdout).toContain('counting=2')
    expect(statusFor(calls, 'review-integrity')).toMatchObject({
      description: expect.stringContaining('2/4'),
      state: 'pending',
    })
  })
})

describe('PR author resolution', () => {
  test('resolves the author from the API when the payload omits it', () => {
    // workflow_run has no github.event.pull_request, and workflow_run.pull_requests[0] carries
    // no `user`. Without resolution the author arrives empty and review-integrity fails closed
    // — a red REQUIRED check on PRs that are fine, which is what #12462 shipped.
    const { calls, stdout } = runGate({
      EVENT_ACTION: '',
      EVENT_NAME: 'workflow_run',
      FAKE_FILES_JSON: ONE_CHANGED_FILE,
      FAKE_PR_JSON: JSON.stringify({ head: { sha: 'abc' }, user: { login: 'claude[bot]', type: 'Bot' } }),
      FAKE_STATUSES_JSON: JSON.stringify([
        { context: 'security-gate', description: 'Risk: low — passes (no security approval required).' },
      ]),
      PR_AUTHOR: '',
      PR_AUTHOR_TYPE: '',
    })
    expect(stdout).toContain('pr-author: resolved from API author=claude[bot]/Bot')
    expect(stdout).toContain('bot_authored=1')
    const ri = statusFor(calls, 'review-integrity')
    expect(ri).toMatchObject({ state: 'pending' })
    expect(ri?.description).not.toContain('Cannot verify approvals')
  })

  test('still fails closed when the author cannot be determined at all', () => {
    // The guard is intact: resolution makes the author available, it does not paper over an
    // author that genuinely cannot be read.
    // Exit stays 0: security-gate still passes on its own, only review-integrity fails.
    const { calls } = runGate({
      EVENT_ACTION: '',
      EVENT_NAME: 'workflow_run',
      FAKE_FILES_JSON: ONE_CHANGED_FILE,
      FAKE_PR_JSON: JSON.stringify({ head: { sha: 'abc' } }),
      PR_AUTHOR: '',
      PR_AUTHOR_TYPE: '',
    })
    expect(statusFor(calls, 'review-integrity')).toMatchObject({
      description: expect.stringContaining('Cannot verify approvals'),
      state: 'failure',
    })
  })
})

describe('bot-authored PRs require two humans', () => {
  const rv = (id: number, login: string, type: string) => ({
    commit_id: 'abc',
    id,
    state: 'APPROVED',
    user: { login, type },
  })
  const GA = rv(1, 'github-actions[bot]', 'Bot')
  const SG = rv(2, 'uniswap-security-gate[bot]', 'Bot')
  const ALICE = rv(3, 'alice', 'User')
  const BOB = rv(4, 'bob', 'User')

  const botPr = (reviews: unknown[], extra: Record<string, string> = {}) => ({
    FAKE_ANTHROPIC_JSON: LOW_CLASSIFIER_RESPONSE,
    FAKE_FILES_JSON: ONE_CHANGED_FILE,
    FAKE_REVIEWS_JSON: JSON.stringify(reviews),
    PR_AUTHOR: 'claude[bot]',
    PR_AUTHOR_TYPE: 'Bot',
    ...extra,
  })

  test('the status says self-approval counts', () => {
    // A requester chasing two humans needs to know they can be one of them. On a bot-authored
    // PR the author is the BOT, so ELIGIBLE_JQ excludes the bot and the requester's own approval
    // is counted — unlike a human-authored PR, whose message still reads "self-approval
    // excluded" because there the author IS the person.
    const { calls } = runGate(botPr([GA, SG, ALICE]))
    expect(statusFor(calls, 'review-integrity')?.description).toBe(
      '3/4 approvals — 1 more needed, yours counts (bot-authored, +2 for CODEOWNER).',
    )
  })

  test('human-authored PRs still say self-approval EXCLUDED', () => {
    const { calls } = runGate({
      FAKE_ANTHROPIC_JSON: LOW_CLASSIFIER_RESPONSE,
      FAKE_FILES_JSON: ONE_CHANGED_FILE,
      // Needs the full counted complement to reach the success path at all: a lone human
      // approval is 1/3 and reports the tally instead.
      FAKE_REVIEWS_JSON: JSON.stringify([GA, SG, ALICE]),
    })
    // Reached only once the counted requirement is met; before that the message is the tally.
    expect(statusFor(calls, 'review-integrity')?.description).toContain('self-approval excluded')
  })

  test('two bots and ONE human is not enough', () => {
    // The hole this closes. On a bot-authored PR the single required human could be the engineer
    // who asked the bot for the change: not the PR author, so GitHub's self-approval block does
    // not apply, and a code owner's approval also satisfies require_code_owner_reviews. One
    // person could open and merge it unaided.
    const { calls } = runGate(botPr([GA, SG, ALICE]))
    expect(statusFor(calls, 'review-integrity')).toMatchObject({
      description: expect.stringContaining('3/4 approvals — 1 more needed'),
      state: 'pending',
    })
  })

  test('two bots and two humans passes', () => {
    const { calls } = runGate(botPr([GA, SG, ALICE, BOB]))
    expect(statusFor(calls, 'review-integrity')).toMatchObject({ state: 'success' })
  })

  test('the requirement is derived from COUNTING_BOTS, not hardcoded', () => {
    // With one counting bot the requirement drops to 3, still leaving two humans. The guarantee
    // is MIN_HUMAN_BOT_AUTHORED regardless of how long the allowlist is — so adding a bot cannot
    // quietly buy back a human.
    const { calls } = runGate(botPr([SG, ALICE, BOB], { COUNTING_BOTS: 'uniswap-security-gate' }))
    expect(statusFor(calls, 'review-integrity')).toMatchObject({
      description: expect.stringContaining('3/3 approvals (bot-authored, +1 for CODEOWNER)'),
      state: 'success',
    })
  })

  test('a third counting bot raises the requirement instead of costing a human', () => {
    const { calls } = runGate(
      botPr([GA, SG, rv(5, 'third[bot]', 'Bot'), ALICE], {
        COUNTING_BOTS: 'github-actions,uniswap-security-gate,third',
      }),
    )
    // 3 bots + 1 human = 4 counted, but the requirement is now 5, so still short a human.
    expect(statusFor(calls, 'review-integrity')).toMatchObject({
      description: expect.stringContaining('4/5 approvals — 1 more needed'),
      state: 'pending',
    })
  })
})

describe('status description fits the visible budget', () => {
  // GitHub's PR checks list shows roughly the first 50 characters and prefixes its own
  // "Waiting for status to be reported — ". Anything a blocked developer needs to act on has to
  // survive that cut, which is why the tally and the human count come first.
  const VISIBLE = 50

  test('the pending description leads with the tally and what is still needed', () => {
    const { calls } = runGate({
      FAKE_ANTHROPIC_JSON: LOW_CLASSIFIER_RESPONSE,
      FAKE_FILES_JSON: ONE_CHANGED_FILE,
      FAKE_REVIEWS_JSON: JSON.stringify([
        { commit_id: 'abc', id: 1, state: 'APPROVED', user: { login: 'uniswap-security-gate[bot]', type: 'Bot' } },
      ]),
      PR_AUTHOR: 'claude[bot]',
      PR_AUTHOR_TYPE: 'Bot',
    })
    const d = statusFor(calls, 'review-integrity')?.description as string
    expect(d).not.toStartWith('Awaiting review')
    expect(d.slice(0, VISIBLE)).toContain('1/4')
    expect(d.slice(0, VISIBLE)).toContain('more needed')
    expect(d.slice(0, VISIBLE)).toContain('yours counts')
    expect(d.length).toBeLessThanOrEqual(140)
  })
})

describe('CODEOWNERS min-reviews raises the counted requirement', () => {
  const SVC = 'packages/services/trading'
  const blob = (body: string) => JSON.stringify({ content: Buffer.from(body).toString('base64') })
  const rv = (id: number, login: string, type: string) => ({
    commit_id: 'abc',
    id,
    state: 'APPROVED',
    user: { login, type },
  })
  const GA = rv(1, 'github-actions[bot]', 'Bot')
  const SG = rv(2, 'uniswap-security-gate[bot]', 'Bot')
  const H = (id: number, name: string) => rv(id, name, 'User')

  const declaring = (n: number, reviews: unknown[], extra: Record<string, string> = {}) => ({
    FAKE_ANTHROPIC_JSON: LOW_CLASSIFIER_RESPONSE,
    FAKE_BLOB_JSON: blob(`* @Uniswap/swap-be\n# uniswap:min-reviews ${n}\n`),
    FAKE_FILES_JSON: JSON.stringify([{ filename: `${SVC}/src/a.ts`, patch: '@@ -1 +1 @@\n-old\n+new' }]),
    FAKE_PR_JSON: JSON.stringify({ base: { ref: 'main' }, head: { sha: 'abc' } }),
    FAKE_REVIEWS_JSON: JSON.stringify(reviews),
    FAKE_TREE_JSON: JSON.stringify({ tree: [{ path: `${SVC}/CODEOWNERS`, sha: 'svc' }] }),
    ...extra,
  })

  test("the declared 3 is inert on a human-authored PR — it equals the baseline", () => {
    // base = MIN_HUMAN(1) + pad(2) = 3, so max(3, 3) = 3. This is why the 16 declarations
    // currently change nothing, and it is worth pinning so nobody reads it as a bug.
    const { calls, stdout } = runGate(declaring(3, [GA, SG, H(3, 'alice')]))
    expect(stdout).toContain('req=3 base=3 pad=2 decl=3')
    expect(statusFor(calls, 'review-integrity')).toMatchObject({ state: 'success' })
  })

  test('the declared 3 is inert on a bot-authored PR — the baseline is already 4', () => {
    const { calls, stdout } = runGate(
      declaring(3, [GA, SG, H(3, 'alice')], { PR_AUTHOR: 'claude[bot]', PR_AUTHOR_TYPE: 'Bot' }),
    )
    expect(stdout).toContain('req=4 base=4 pad=2 decl=3')
    expect(statusFor(calls, 'review-integrity')).toMatchObject({
      description: expect.stringContaining('3/4 approvals — 1 more needed'),
      state: 'pending',
    })
  })

  test('a declaration above the baseline raises it', () => {
    // 5 declared: 2 bots leave 3 humans to find.
    const { calls } = runGate(declaring(5, [GA, SG, H(3, 'alice'), H(4, 'bob')]))
    expect(statusFor(calls, 'review-integrity')).toMatchObject({
      description: expect.stringContaining('4/5 approvals — 1 more needed'),
      state: 'pending',
    })
    const ok = runGate(declaring(5, [GA, SG, H(3, 'alice'), H(4, 'bob'), H(5, 'carol')]))
    expect(statusFor(ok.calls, 'review-integrity')).toMatchObject({ state: 'success' })
  })

  test('a declaration below the baseline cannot lower it', () => {
    const { calls, stdout } = runGate(declaring(1, [GA, SG]))
    expect(stdout).toContain('req=3 base=3')
    expect(statusFor(calls, 'review-integrity')).toMatchObject({
      description: expect.stringContaining('2/3 approvals — 1 more needed'),
      state: 'pending',
    })
  })

  test('an unreadable CODEOWNERS leaves the baseline standing', () => {
    const { calls, stdout } = runGate(
      declaring(5, [GA, SG, H(3, 'alice')], { FAKE_TREE_JSON: '{"message":"Not Found"}' }),
    )
    expect(stdout).toContain('req=3 base=3 pad=2 decl=none')
    expect(statusFor(calls, 'review-integrity')).toMatchObject({ state: 'success' })
  })

  test('MIN_REVIEWS_ENABLED=0 skips the parse entirely', () => {
    // The base tree now has TWO consumers — the min-reviews floor and the owner resolver — each
    // with its own kill switch, so "nothing fetched the tree" needs both off. The min-reviews
    // half of the assertion is decl=none, which is what this test is actually about.
    const { calls, stdout } = runGate(
      declaring(5, [GA, SG, H(3, 'alice')], { MIN_REVIEWS_ENABLED: '0', OWNER_REVIEWS_ENABLED: '0' }),
    )
    expect(stdout).toContain('decl=none')
    expect(calls.some((call) => call.url.includes('/git/trees/'))).toBe(false)
    expect(statusFor(calls, 'review-integrity')).toMatchObject({ state: 'success' })
  })

  test('MIN_REVIEWS_ENABLED=0 alone still skips the min-reviews parse', () => {
    // Guards the half of the switch this feature could have quietly broken: the owner resolver
    // fetching the tree for its own reasons must not resurrect a floor the operator turned off.
    const { stdout } = runGate(declaring(5, [GA, SG, H(3, 'alice')], { MIN_REVIEWS_ENABLED: '0' }))
    expect(stdout).toContain('decl=none')
  })

  test('resolves CODEOWNERS from the base branch, never the PR head', () => {
    const { calls } = runGate(declaring(5, [GA, SG]))
    const treeCalls = calls.filter((call) => call.url.includes('/git/trees/'))
    expect(treeCalls.length).toBeGreaterThan(0)
    for (const call of treeCalls) {
      expect(call.url).toContain('/git/trees/main')
      expect(call.url).not.toContain('abc')
    }
  })

  test('only allowlisted bots count toward the requirement', () => {
    // A third bot approving must not fill a slot, or the human guarantee stops being arithmetic.
    const { calls, stdout } = runGate(declaring(3, [GA, SG, rv(9, 'random[bot]', 'Bot')]))
    expect(stdout).toContain('counting=2 req=3')
    expect(statusFor(calls, 'review-integrity')).toMatchObject({ state: 'pending' })
  })
})

describe('CODEOWNERS in .github/ and docs/ governs the whole repo', () => {
  // GitHub reads a repo-wide CODEOWNERS from .github/, the root, or docs/. Scoping the first and
  // last by directory made a declaration in the conventional single-file location apply to almost
  // nothing -- and silently, because "no CODEOWNERS matched" is a normal no-declaration result.
  const blob = (body: string) => JSON.stringify({ content: Buffer.from(body).toString('base64') })
  const rv = (id: number, login: string, type: string) => ({
    commit_id: 'abc',
    id,
    state: 'APPROVED',
    user: {login, type},
  })
  const GA = rv(1, 'github-actions[bot]', 'Bot')
  const SG = rv(2, 'uniswap-security-gate[bot]', 'Bot')
  const H = (id: number, name: string) => rv(id, name, 'User')

  const wide = (coPath: string, n: number, changed: string) => ({
    FAKE_ANTHROPIC_JSON: LOW_CLASSIFIER_RESPONSE,
    FAKE_BLOB_JSON: blob(`* @Uniswap/universe\n# uniswap:min-reviews ${n}\n`),
    FAKE_FILES_JSON: JSON.stringify([{filename: changed, patch: '@@ -1 +1 @@\n-old\n+new'}]),
    FAKE_PR_JSON: JSON.stringify({base: {ref: 'main'}, head: {sha: 'abc'}}),
    FAKE_REVIEWS_JSON: JSON.stringify([GA, SG, H(3, 'alice')]),
    FAKE_TREE_JSON: JSON.stringify({tree: [{path: coPath, sha: 'wide'}]}),
  })

  test('.github/CODEOWNERS applies to a file outside .github/', () => {
    const {stdout} = runGate(wide('.github/CODEOWNERS', 5, 'apps/web/src/a.ts'))
    expect(stdout).toContain('decl=5')
  })

  test('docs/CODEOWNERS applies to a file outside docs/', () => {
    const {stdout} = runGate(wide('docs/CODEOWNERS', 4, 'src/anything.ts'))
    expect(stdout).toContain('decl=4')
  })

  test('a deeper per-directory CODEOWNERS still wins over the repo-wide one', () => {
    const {stdout} = runGate({
      ...wide('.github/CODEOWNERS', 2, 'packages/services/trading/src/a.ts'),
      FAKE_BLOBS_JSON: JSON.stringify({
        svc: `* @Uniswap/swap-be\n# uniswap:min-reviews 6\n`,
        wide: `* @Uniswap/universe\n# uniswap:min-reviews 2\n`,
      }),
      FAKE_TREE_JSON: JSON.stringify({
        tree: [
          {path: '.github/CODEOWNERS', sha: 'wide'},
          {path: 'packages/services/trading/CODEOWNERS', sha: 'svc'},
        ],
      }),
    })
    expect(stdout).toContain('decl=6')
  })

  test('.github/ wins over the root file, matching GitHub precedence', () => {
    const {stdout} = runGate({
      ...wide('.github/CODEOWNERS', 6, 'src/a.ts'),
      FAKE_BLOBS_JSON: JSON.stringify({
        gh: `# uniswap:min-reviews 6\n`,
        root: `# uniswap:min-reviews 2\n`,
      }),
      FAKE_TREE_JSON: JSON.stringify({
        tree: [
          {path: 'CODEOWNERS', sha: 'root'},
          {path: '.github/CODEOWNERS', sha: 'gh'},
        ],
      }),
    })
    expect(stdout).toContain('decl=6')
  })
})

describe('min-reviews walks up to the nearest declaring parent', () => {
  // CLAUDE.md: "Resolution walks up to the nearest parent declaring the key, mirroring how
  // ownership itself inherits." A directory whose own CODEOWNERS exists but is silent -- an
  // owner override, typically -- must still inherit its parent's floor rather than lose it.
  const rv = (id: number, login: string, type: string) => ({
    commit_id: 'abc',
    id,
    state: 'APPROVED',
    user: {login, type},
  })
  const REVIEWS = [
    rv(1, 'github-actions[bot]', 'Bot'),
    rv(2, 'uniswap-security-gate[bot]', 'Bot'),
    rv(3, 'alice', 'User'),
  ]
  const PAR = 'packages/services/trading'

  const nested = (changed: string) => ({
    FAKE_ANTHROPIC_JSON: LOW_CLASSIFIER_RESPONSE,
    FAKE_BLOBS_JSON: JSON.stringify({
      deep: `* @Uniswap/third-team\n# uniswap:min-reviews 2\n`,
      kid: `* @Uniswap/other-team\n`,
      par: `* @Uniswap/swap-be\n# uniswap:min-reviews 5\n`,
    }),
    FAKE_FILES_JSON: JSON.stringify([{filename: changed, patch: '@@ -1 +1 @@\n-old\n+new'}]),
    FAKE_PR_JSON: JSON.stringify({base: {ref: 'main'}, head: {sha: 'abc'}}),
    FAKE_REVIEWS_JSON: JSON.stringify(REVIEWS),
    FAKE_TREE_JSON: JSON.stringify({
      tree: [
        {path: `${PAR}/CODEOWNERS`, sha: 'par'},
        {path: `${PAR}/sub/CODEOWNERS`, sha: 'kid'},
        {path: `${PAR}/deep/CODEOWNERS`, sha: 'deep'},
      ],
    }),
  })

  test('a silent child inherits its parent declaration instead of losing it', () => {
    const {stdout} = runGate(nested(`${PAR}/sub/a.ts`))
    expect(stdout).toContain('decl=5')
  })

  test('a deeper declaration overrides the parent — nearest wins, not the maximum', () => {
    const {stdout} = runGate(nested(`${PAR}/deep/a.ts`))
    expect(stdout).toContain('decl=2')
  })
})

describe('min-reviews resolution failures: transient vs author-controlled', () => {
  const SVC = 'packages/services/trading'
  const blob = (body: string) => JSON.stringify({ content: Buffer.from(body).toString('base64') })
  const base = (extra: Record<string, string> = {}) => ({
    FAKE_ANTHROPIC_JSON: LOW_CLASSIFIER_RESPONSE,
    FAKE_BLOB_JSON: blob(`* @Uniswap/swap-be\n# uniswap:min-reviews 9\n`),
    FAKE_FILES_JSON: JSON.stringify([{ filename: `${SVC}/a.ts`, patch: '@@ -1 +1 @@\n-o\n+n' }]),
    FAKE_PR_JSON: JSON.stringify({ base: { ref: 'main' }, head: { sha: 'abc' } }),
    FAKE_REVIEWS_JSON: JSON.stringify([
      { commit_id: 'abc', id: 1, state: 'APPROVED', user: { login: 'github-actions[bot]', type: 'Bot' } },
      { commit_id: 'abc', id: 2, state: 'APPROVED', user: { login: 'uniswap-security-gate[bot]', type: 'Bot' } },
      { commit_id: 'abc', id: 3, state: 'APPROVED', user: { login: 'alice', type: 'User' } },
    ]),
    FAKE_TREE_JSON: JSON.stringify({ tree: [{ path: `${SVC}/CODEOWNERS`, sha: 'svc' }] }),
    ...extra,
  })

  test('a transient read failure falls back to the baseline and does NOT block', () => {
    // An unreadable tree after retries is indistinguishable from a hiccup, and a hiccup must not
    // block PRs. The baseline still applies, so nothing is weakened below it.
    const { calls, stdout } = runGate(base({ FAKE_TREE_JSON: '' }))
    expect(stdout).toContain('rc=1')
    expect(statusFor(calls, 'review-integrity')).toMatchObject({ state: 'success' })
  })

  test('a truncated base tree fails closed', () => {
    // "Found no declaration" would be a lie when the response admits it is incomplete. Not
    // transient — it is the repo outgrowing one call.
    const { calls, stdout } = runGate(
      base({ FAKE_TREE_JSON: JSON.stringify({ truncated: true, tree: [] }) }),
    )
    expect(stdout).toContain('rc=2')
    expect(statusFor(calls, 'review-integrity')).toMatchObject({
      description: expect.stringContaining('Cannot verify the CODEOWNERS approval requirement'),
      state: 'failure',
    })
  })

  test('a declaration that resolves is still applied', () => {
    // Control for the two above: the same fixture with a readable tree raises the requirement to
    // the declared 9.
    const { calls, stdout } = runGate(base())
    expect(stdout).toContain('req=9')
    expect(statusFor(calls, 'review-integrity')).toMatchObject({
      description: expect.stringContaining('3/9 approvals — 6 more needed'),
      state: 'pending',
    })
  })

  test('the CODEOWNERS scratch file is not a fixed shared path', () => {
    // A constant name in the shared /tmp of a self-hosted pool is clobberable by a concurrent run
    // and pre-plantable by anything else on the host.
    const source = readFileSync(SCRIPT_PATH, 'utf8')
    expect(source).not.toContain('security-gate-codeowners.tsv')
    expect(source).toContain('mktemp "${RUNNER_TEMP:-/tmp}/security-gate-codeowners.XXXXXX"')
  })

  test('the memo path is scoped by repo and run, not just PR', () => {
    // PR #12 in two repos would otherwise share a path, and a cached "none" would outlive the run
    // that produced it — so a declaration added later would never take effect.
    //
    // The scoping now lives once in SG_TMP, which every per-run memo hangs off, rather than being
    // re-derived per file. That is the property worth asserting: a new memo added later inherits
    // the isolation instead of having to remember to repeat it.
    const source = readFileSync(SCRIPT_PATH, 'utf8')
    expect(source).toContain('SG_TMP="${RUNNER_TEMP:-/tmp}/security-gate-$(printf')
    expect(source).toContain('${GITHUB_RUN_ID:-0}')
    expect(source).toContain('MIN_REVIEWS_FILE="$SG_TMP/min-reviews"')
  })

  test('only exact CODEOWNERS basenames are discovered', () => {
    // endswith("CODEOWNERS") also matches tradingCODEOWNERS, whose derived prefix could win the
    // longest-prefix contest from a non-authoritative file.
    const source = readFileSync(SCRIPT_PATH, 'utf8')
    expect(source).toContain('select((.path=="CODEOWNERS") or (.path|endswith("/CODEOWNERS")))')
  })

  test("the repo's own CODEOWNERS declares nothing above the baseline, so it changes nothing today", () => {
    // Universe's CODEOWNERS lives in .github/ and declares no min-reviews: the owner resolver's
    // OWNER_MIN_FLOOR supplies the per-group floor instead. Against the flat count the rule is
    // max(baseline, declared), and the baseline is 3 -- so any declaration added here must stay
    // at or below 3, or it silently raises the requirement on every PR in the repo.
    const declared = readFileSync(join(REPO_ROOT, '.github', 'CODEOWNERS'), 'utf8')
      .split('\n')
      .flatMap((line) => /^#\s*uniswap:min-reviews\s+(\d+)\s*$/.exec(line)?.[1] ?? [])
    for (const n of declared) expect(Number(n)).toBeLessThanOrEqual(3)
  })
})

// --- CODEOWNERS owner resolution ------------------------------------------------------------
// The matcher is the only code here whose errors are SILENT UNDER-ENFORCEMENT: a pattern that
// fails to match resolves to no owner, "no owner" means everyone is an owner, and the
// requirement quietly stops applying with nothing in the log to say so. Hence the
// disproportionate coverage.
//
// Assertions read the `owner-reviews:` log line rather than the posted status, because during
// the report-only window the status deliberately does NOT reflect this verdict.
describe('CODEOWNERS owner resolution', () => {
  const rv = (id: number, login: string, type: string) => ({
    commit_id: 'abc',
    id,
    state: 'APPROVED',
    user: { login, type },
  })
  const approver = (id: number, name: string) => rv(id, name, 'User')
  const shaFor = (dir: string) => dir.replace(/\//g, '_')

  /** One CODEOWNERS at the repo root, plus whatever per-directory files a case needs. */
  const withOwners = (
    rootBody: string,
    files: string[],
    extra: Record<string, string> = {},
    perDir: Record<string, string> = {},
  ) => ({
    FAKE_ANTHROPIC_JSON: LOW_CLASSIFIER_RESPONSE,
    // Raw bodies: the fake curl base64-encodes them itself, mirroring the real blobs API.
    // Blob shas must not contain '/' — the fake extracts one with ${url##*/}, as a real hex sha
    // allows — so a nested directory's sha is its path with separators flattened.
    FAKE_BLOBS_JSON: JSON.stringify({
      root: rootBody,
      ...Object.fromEntries(Object.entries(perDir).map(([dir, body]) => [shaFor(dir), body])),
    }),
    FAKE_FILES_JSON: JSON.stringify(files.map((filename) => ({ filename, patch: '@@ -1 +1 @@\n-a\n+b' }))),
    FAKE_PR_JSON: JSON.stringify({ base: { ref: 'main' }, head: { sha: 'abc' } }),
    FAKE_TREE_JSON: JSON.stringify({
      tree: [
        { path: 'CODEOWNERS', sha: 'root' },
        ...Object.keys(perDir).map((dir) => ({ path: `${dir}/CODEOWNERS`, sha: shaFor(dir) })),
      ],
    }),
    // Team expansion needs an org-visible credential. Without one the resolver cannot read any
    // team and correctly fails closed — which is its own test below, not the default here.
    SECURITY_GATE_ORG_TOKEN: 'org-token',
    ...extra,
  })

  /** The `groups=[...]` field of the owner-reviews log line. */
  const groupsOf = (stdout: string): string => {
    const line = stdout.split('\n').find((l) => l.startsWith('owner-reviews:')) ?? ''
    return /groups=\[([^\]]*)\]/.exec(line)?.[1] ?? ''
  }

  test('every pattern shape resolves to its own owner', () => {
    // One run, five shapes, a distinct team per shape — so the team appearing in the log IS the
    // proof of which rule matched. The census of the real file found exactly these five.
    const { stdout } = runGate(
      withOwners(
        [
          '* @Uniswap/catchall',
          '/dir-glob/**/* @Uniswap/dirglob',
          '/dir-slash/ @Uniswap/dirslash',
          '/exact/file.ts @Uniswap/exactfile',
          '/mid/launch* @Uniswap/midglob',
        ].join('\n'),
        [
          'top-level.md',
          'dir-glob/nested/deep/a.ts',
          'dir-slash/b.ts',
          'exact/file.ts',
          'mid/launchpad.ts',
        ],
        {
          FAKE_TEAMS_JSON: JSON.stringify({
            catchall: [{ login: 'cat' }],
            dirglob: [{ login: 'dg' }],
            dirslash: [{ login: 'ds' }],
            exactfile: [{ login: 'ef' }],
            midglob: [{ login: 'mg' }],
          }),
        },
      ),
    )
    const groups = groupsOf(stdout)
    for (const team of ['catchall', 'dirglob', 'dirslash', 'exactfile', 'midglob']) {
      expect(groups).toContain(`@uniswap/${team}`)
    }
  })

  test('the LAST matching rule wins, not the first and not the union', () => {
    // GitHub: "the last matching pattern takes the most precedence." The real file has two
    // duplicate-pattern pairs where this silently drops a team, and the gate reproduces that
    // bug-for-bug on purpose — being more generous than GitHub desyncs the requested reviewers
    // from the enforced ones.
    const { stdout } = runGate(
      withOwners(
        ['/svc/**/* @Uniswap/first', '/svc/**/* @Uniswap/second'].join('\n'),
        ['svc/a.ts'],
        {
          FAKE_TEAMS_JSON: JSON.stringify({ first: [{ login: 'f' }], second: [{ login: 's' }] }),
        },
      ),
    )
    const groups = groupsOf(stdout)
    expect(groups).toContain('@uniswap/second')
    expect(groups).not.toContain('@uniswap/first')
  })

  test('a zero-owner rule un-owns its subtree, and everyone becomes an owner', () => {
    // /.claude/skills/ and /packages/lib/golang-clients/**/* both do this deliberately, so an
    // empty owner field has to survive parsing rather than be filtered out as a blank line.
    const { stdout } = runGate(
      withOwners(['* @Uniswap/catchall', '/skills/'].join('\n'), ['skills/a.md'], {
        FAKE_TEAMS_JSON: JSON.stringify({ catchall: [{ login: 'cat' }] }),
      }),
    )
    expect(groupsOf(stdout)).toContain('*=')
  })

  test('team slugs match case-insensitively', () => {
    // The real file carries both @uniswap/security and @Uniswap/security. A case-sensitive
    // compare is a silent zero-match: the requirement simply never applies, with no error.
    const { stdout } = runGate(
      withOwners('/svc/**/* @Uniswap/MixedCase', ['svc/a.ts'], {
        FAKE_REVIEWS_JSON: JSON.stringify([approver(3, 'Alice')]),
        FAKE_TEAMS_JSON: JSON.stringify({ MixedCase: [{ login: 'alice' }] }),
      }),
    )
    // Resolved to the lowercased slug, and Alice's approval counted despite the login casing.
    expect(groupsOf(stdout)).toContain('@uniswap/mixedcase=1/1')
  })

  test('an unreadable team fails closed rather than resolving to nobody', () => {
    // An empty members response means "could not see the team", never "the team is empty".
    // Reading it the other way here would erase the requirement instead of blocking on it.
    const { stdout } = runGate(
      withOwners('/svc/**/* @Uniswap/ghost', ['svc/a.ts'], { FAKE_TEAMS_JSON: '' }),
    )
    expect(stdout).toContain('owner-reviews: state=failed')
    expect(stdout).toContain('Cannot read team')
  })

  test('a bot-authored PR costs one extra approval per group', () => {
    const base = withOwners('/svc/**/* @Uniswap/team', ['svc/a.ts'], {
      FAKE_REVIEWS_JSON: JSON.stringify([approver(3, 'alice')]),
      FAKE_TEAMS_JSON: JSON.stringify({ team: [{ login: 'alice' }, { login: 'bob' }] }),
    })
    expect(groupsOf(runGate(base).stdout)).toContain('@uniswap/team=1/1')
    const bot = runGate({ ...base, PR_AUTHOR: 'claude[bot]', PR_AUTHOR_TYPE: 'Bot' })
    expect(groupsOf(bot.stdout)).toContain('@uniswap/team=1/2')
  })

  test('an exempt bot author pays no surcharge', () => {
    // Exempt automation acts on its own behalf, so it pays no bot-author surcharge.
    const { stdout } = runGate(
      withOwners('/svc/**/* @Uniswap/team', ['svc/a.ts'], {
        FAKE_REVIEWS_JSON: JSON.stringify([approver(3, 'alice')]),
        FAKE_TEAMS_JSON: JSON.stringify({ team: [{ login: 'alice' }] }),
        PR_AUTHOR: 'dependabot[bot]',
        PR_AUTHOR_TYPE: 'Bot',
      }),
    )
    expect(groupsOf(stdout)).toContain('@uniswap/team=1/1')
  })

  test('owner-bots satisfy their directory requirement', () => {
    // The whole point of the feature: an App-authenticated bot cannot be named in CODEOWNERS, so
    // it is declared in the per-directory metadata instead and counted here.
    const { stdout } = runGate(
      withOwners(
        '/svc/**/* @Uniswap/team',
        ['svc/a.ts'],
        {
          FAKE_REVIEWS_JSON: JSON.stringify([rv(3, 'trusted-reviewer[bot]', 'Bot')]),
          FAKE_TEAMS_JSON: JSON.stringify({ team: [{ login: 'alice' }] }),
        },
        { svc: '# uniswap:owner-bots trusted-reviewer\n' },
      ),
    )
    expect(groupsOf(stdout)).toContain('@uniswap/team=1/1')
  })

  test('a declared 0 cannot drop a path below one approval', () => {
    const { stdout } = runGate(
      withOwners(
        '/svc/**/* @Uniswap/team',
        ['svc/a.ts'],
        {
          FAKE_REVIEWS_JSON: '[]',
          FAKE_TEAMS_JSON: JSON.stringify({ team: [{ login: 'alice' }] }),
        },
        { svc: '# uniswap:min-reviews 0\n' },
      ),
    )
    expect(groupsOf(stdout)).toContain('@uniswap/team=0/1')
  })

  test('min-reviews and owner-bots are inherited independently', () => {
    // A directory declaring only bots must still inherit the floor from its parent, and vice
    // versa. Taking the deepest file that declares ANYTHING would drop whichever key it omitted.
    const { stdout } = runGate(
      withOwners(
        '/svc/**/* @Uniswap/team',
        ['svc/deep/a.ts'],
        {
          FAKE_REVIEWS_JSON: JSON.stringify([rv(3, 'helper[bot]', 'Bot')]),
          FAKE_TEAMS_JSON: JSON.stringify({ team: [{ login: 'alice' }] }),
        },
        {
          svc: '# uniswap:min-reviews 2\n',
          'svc/deep': '# uniswap:owner-bots helper\n',
        },
      ),
    )
    // Floor 2 inherited from svc/, bots from svc/deep/ — one bot approval against a need of 2.
    expect(groupsOf(stdout)).toContain('@uniswap/team=1/2')
  })

  describe('an owner-bot approval counts only on the commit it was given for', () => {
    // Humans keep head-independent approvals (a nit-fix push must not cost a re-review). A bot
    // re-scores every push, so an approval on an older commit vouches for code it never saw --
    // and before this, only the bot's own workflow dismissing it stopped it counting.
    const botAt = (id: number, commit: string, state = 'APPROVED') => ({
      ...rv(id, 'trusted-reviewer[bot]', 'Bot'),
      commit_id: commit,
      state,
    })
    const run = (reviews: object[]) =>
      runGate(
        withOwners(
          '/svc/**/* @Uniswap/team',
          ['svc/a.ts'],
          {
            FAKE_REVIEWS_JSON: JSON.stringify(reviews),
            FAKE_TEAMS_JSON: JSON.stringify({ team: [{ login: 'alice' }] }),
          },
          { svc: '# uniswap:owner-bots trusted-reviewer\n' },
        ),
      ).stdout
    const ownerLine = (stdout: string) => stdout.split('\n').find((l) => l.startsWith('owner-reviews:')) ?? ''

    test('a bot approval on an older commit does not satisfy the group, and the log says why', () => {
      const stdout = run([botAt(3, 'old')])
      expect(groupsOf(stdout)).toContain('@uniswap/team=0/1')
      expect(ownerLine(stdout)).toContain('stale-bot-approvals=[trusted-reviewer[bot]]')
    })

    test('re-approving the current head counts again', () => {
      const stdout = run([botAt(3, 'old'), botAt(4, 'abc')])
      expect(groupsOf(stdout)).toContain('@uniswap/team=1/1')
      expect(ownerLine(stdout)).not.toContain('stale-bot-approvals')
    })

    test('a human approval on an older commit still counts', () => {
      // The unchanged half: only bots are bound to the head.
      const stdout = run([{ ...approver(3, 'alice'), commit_id: 'old' }])
      expect(groupsOf(stdout)).toContain('@uniswap/team=1/1')
    })

    test('the latest review decides: an old approval under a newer request for changes is not stale-listed', () => {
      const stdout = run([botAt(3, 'old'), botAt(4, 'abc', 'CHANGES_REQUESTED')])
      expect(groupsOf(stdout)).toContain('@uniswap/team=0/1')
      expect(ownerLine(stdout)).not.toContain('stale-bot-approvals')
    })
  })

  describe('a bot is credited only for paths that declare it', () => {
    // The group is the owner SET, so two directories with the same owners collapse into one row.
    // A bot used to be credited for the whole row if ANY of its paths declared it.
    const twoDirs = (perDir: Record<string, string>, reviews: object[]) =>
      groupsOf(
        runGate(
          withOwners(
            ['/svc/**/* @Uniswap/team', '/other/**/* @Uniswap/team'].join('\n'),
            ['svc/a.ts', 'other/b.ts'],
            {
              FAKE_REVIEWS_JSON: JSON.stringify(reviews),
              FAKE_TEAMS_JSON: JSON.stringify({ team: [{ login: 'alice' }] }),
            },
            perDir,
          ),
        ).stdout,
      )
    const bot = (id: number, login: string) => rv(id, `${login}[bot]`, 'Bot')

    test('a group mixing declared and undeclared paths needs a human owner', () => {
      expect(twoDirs({ svc: '# uniswap:owner-bots trusted-reviewer\n' }, [bot(3, 'trusted-reviewer')])).toContain(
        '@uniswap/team=0/1',
      )
    })

    test('...and a human owner satisfies it', () => {
      expect(twoDirs({ svc: '# uniswap:owner-bots trusted-reviewer\n' }, [approver(3, 'alice')])).toContain(
        '@uniswap/team=1/1',
      )
    })

    test('when every path declares the bot, it satisfies the group', () => {
      const decl = '# uniswap:owner-bots trusted-reviewer\n'
      expect(twoDirs({ svc: decl, other: decl }, [bot(3, 'trusted-reviewer')])).toContain('@uniswap/team=1/1')
    })

    test('a bot named in a multi-bot declaration on every path still counts', () => {
      expect(
        twoDirs(
          { svc: '# uniswap:owner-bots helper, trusted-reviewer\n', other: '# uniswap:owner-bots: [trusted-reviewer]\n' },
          [bot(3, 'trusted-reviewer')],
        ),
      ).toContain('@uniswap/team=1/1')
    })

    test('bots declared on different paths of one group do not combine', () => {
      // Conservative on purpose: neither bot vouches for the whole group, so a human owner does.
      expect(
        twoDirs(
          { svc: '# uniswap:owner-bots alpha\n', other: '# uniswap:owner-bots beta\n' },
          [bot(3, 'alpha'), bot(4, 'beta')],
        ),
      ).toContain('@uniswap/team=0/1')
    })
  })
})

describe('owner resolution is report-only until enforcement is switched on', () => {
  const shortOwners = (extra: Record<string, string> = {}) => ({
    FAKE_ANTHROPIC_JSON: LOW_CLASSIFIER_RESPONSE,
    FAKE_BLOBS_JSON: JSON.stringify({ root: '/svc/**/* @Uniswap/team\n' }),
    FAKE_FILES_JSON: JSON.stringify([{ filename: 'svc/a.ts', patch: '@@ -1 +1 @@\n-a\n+b' }]),
    FAKE_PR_JSON: JSON.stringify({ base: { ref: 'main' }, head: { sha: 'abc' } }),
    // Two counting bots plus a human satisfies the FLAT count (req=3), while the owner group has
    // nobody from @Uniswap/team — so the two checks disagree, which is what makes this a test.
    FAKE_REVIEWS_JSON: JSON.stringify([
      { commit_id: 'abc', id: 1, state: 'APPROVED', user: { login: 'github-actions[bot]', type: 'Bot' } },
      { commit_id: 'abc', id: 2, state: 'APPROVED', user: { login: 'uniswap-security-gate[bot]', type: 'Bot' } },
      { commit_id: 'abc', id: 3, state: 'APPROVED', user: { login: 'alice', type: 'User' } },
    ]),
    FAKE_TEAMS_JSON: JSON.stringify({ team: [{ login: 'carol' }] }),
    FAKE_TREE_JSON: JSON.stringify({ tree: [{ path: 'CODEOWNERS', sha: 'root' }] }),
    SECURITY_GATE_ORG_TOKEN: 'org-token',
    ...extra,
  })

  test('report-only leaves review-integrity on the flat count', () => {
    // The safety property of shipping this first: the resolver can be wrong, or fail closed, and
    // no PR is blocked by it. GitHub is still enforcing require_code_owner_reviews meanwhile.
    const { calls, stdout } = runGate(shortOwners())
    expect(stdout).toContain('owner-reviews: state=short')
    expect(stdout).toContain('enforce=0')
    expect(statusFor(calls, 'review-integrity')).toMatchObject({
      description: expect.stringContaining('approval(s)'),
      state: 'success',
    })
  })

  test('enforcement replaces the flat count with the owner verdict', () => {
    const { calls } = runGate(shortOwners({ OWNER_REVIEWS_ENFORCE: '1' }))
    expect(statusFor(calls, 'review-integrity')).toMatchObject({
      description: expect.stringContaining('owner groups'),
      state: 'pending',
    })
  })

  test('enforcement never blocks an exempt bot author', () => {
    // Exempt automation's PRs carry no reviewers by construction; an owner requirement would
    // permanently block them.
    const { calls } = runGate(
      shortOwners({
        OWNER_REVIEWS_ENFORCE: '1',
        PR_AUTHOR: 'dependabot[bot]',
        PR_AUTHOR_TYPE: 'Bot',
      }),
    )
    expect(statusFor(calls, 'review-integrity')).toMatchObject({ state: 'success' })
  })

  test('a resolver failure under enforcement fails closed', () => {
    const { calls } = runGate(
      shortOwners({ FAKE_TEAMS_JSON: '', OWNER_REVIEWS_ENFORCE: '1' }),
    )
    expect(statusFor(calls, 'review-integrity')).toMatchObject({ state: 'failure' })
  })

  test('OWNER_REVIEWS_ENFORCE defaults off in the script, not only in workflow env', () => {
    // A re-run replays old workflow YAML while re-fetching this script from the default branch,
    // so a flag defaulted only in env silently reverts on replay (universe#39289). Here the
    // conservative value is the default, which makes a replay report-only.
    const source = readFileSync(SCRIPT_PATH, 'utf8')
    expect(source).toContain('OWNER_REVIEWS_ENFORCE="${OWNER_REVIEWS_ENFORCE:-0}"')
  })
})

describe('declarations survive the BOT_APPROVALS_COUNT override', () => {
  const SVC = 'packages/services/trading'
  const blob = (body: string) => JSON.stringify({ content: Buffer.from(body).toString('base64') })
  const H = (id: number, name: string) => ({
    commit_id: 'abc',
    id,
    state: 'APPROVED',
    user: { login: name, type: 'User' },
  })
  const decl = (n: number, reviews: unknown[], extra: Record<string, string> = {}) => ({
    BOT_APPROVALS_COUNT: '0',
    FAKE_ANTHROPIC_JSON: LOW_CLASSIFIER_RESPONSE,
    FAKE_BLOB_JSON: blob(`* @Uniswap/swap-be\n# uniswap:min-reviews ${n}\n`),
    FAKE_FILES_JSON: JSON.stringify([{ filename: `${SVC}/a.ts`, patch: '@@ -1 +1 @@\n-o\n+n' }]),
    FAKE_PR_JSON: JSON.stringify({ base: { ref: 'main' }, head: { sha: 'abc' } }),
    FAKE_REVIEWS_JSON: JSON.stringify(reviews),
    FAKE_TREE_JSON: JSON.stringify({ tree: [{ path: `${SVC}/CODEOWNERS`, sha: 'svc' }] }),
    PR_AUTHOR: 'claude[bot]',
    PR_AUTHOR_TYPE: 'Bot',
    ...extra,
  })

  test('a high declaration still applies when bot approvals do not count', () => {
    // The override is about WHICH approvals count, not about switching CODEOWNERS off. Declared
    // 9 counted, of which up to 2 could be bots, implies 7 humans.
    const { calls } = runGate(decl(9, [H(1, 'a'), H(2, 'b'), H(3, 'c')]))
    expect(statusFor(calls, 'review-integrity')).toMatchObject({
      description: expect.stringContaining('3/7 approvals'),
      state: 'pending',
    })
  })

  test('the two modes stay equivalent in human terms at current values', () => {
    // declared 3, pad 2 -> max(2, 1) = 2, which is exactly the un-overridden human rule.
    const { calls } = runGate(decl(3, [H(1, 'a'), H(2, 'b')]))
    expect(statusFor(calls, 'review-integrity')).toMatchObject({
      description: expect.stringContaining('2/2 human approvals'),
      state: 'success',
    })
  })

  test('the highest declaration in a file wins, not the first', () => {
    const { calls, stdout } = runGate({
      ...decl(0, [H(1, 'a')]),
      BOT_APPROVALS_COUNT: '1',
      FAKE_BLOB_JSON: blob('# uniswap:min-reviews 3\n# uniswap:min-reviews 8\n'),
    })
    expect(stdout).toContain('decl=8')
    expect(statusFor(calls, 'review-integrity')).toMatchObject({
      description: expect.stringContaining('/8 approvals'),
      state: 'pending',
    })
  })
})

describe('medium is advisory, not blocking', () => {
  // The medium band had NO test coverage before this — the suite never mentioned it — so none of
  // the 61 tests above constrain any of this.
  const medium = (extra: Record<string, string> = {}) => ({
    EVENT_ACTION: 'synchronize',
    FAKE_ANTHROPIC_JSON: MEDIUM_CLASSIFIER_RESPONSE,
    FAKE_ANTHROPIC_JSON_AFTER_FIRST: DEEP_REVIEW_WITH_FINDINGS,
    FAKE_FILES_JSON: ONE_CHANGED_FILE,
    FAKE_STATUSES_JSON: '[]',
    GATE_REVIEWS: '1',
    SECURITY_GATE_APP_TOKEN: 'app-token',
    ...extra,
  })

  test('a medium with a high-severity finding PASSES instead of blocking', () => {
    // backend#12438's shape: a medium rating whose deep review reports something that would
    // previously have set state=failure and REQUEST_CHANGES.
    const { calls, stdout } = runGate(medium())
    expect(stdout).toContain('risk=medium')
    expect(statusFor(calls, 'security-gate')).toMatchObject({
      description: expect.stringContaining('passes, findings advisory'),
      state: 'success',
    })
  })

  test('it still submits an APPROVE, so it cannot deadlock its own earlier block', () => {
    const { stdout } = runGate(medium())
    expect(stdout).toContain('review=APPROVE')
  })

  test('the findings are still posted — advisory must not mean discarded', () => {
    // The trap this guards: findings were only attached when the verdict was REQUEST_CHANGES, so
    // flipping medium to APPROVE would have run the deep review, paid for it, and reported
    // nothing. Asserted on the sticky comment, which is the durable channel (the review is only a
    // pointer to it) — inline anchoring needs the diff-anchors file and is exercised separately.
    const { calls, stdout } = runGate(medium())
    expect(stdout).toMatch(/findings=[1-9]/)
    const body = stickyBody(calls)
    // Case-insensitive: the review now shows the decision through display_desc(), which
    // capitalises the first letter to match the sticky ("Passes, findings advisory").
    expect(body).toMatch(/passes, findings advisory/i)
    expect(body).toContain('Unbounded priority fee')
    // CLAMPED to the band: the deep review reported `high`, but this PR is medium, so displaying
    // `high` would show a severity the gate does not assign to the change.
    expect(body).toContain('| medium |')
    expect(body).not.toContain('| high |')
  })

  test('changed findings refresh even though the verdict stays APPROVE', () => {
    // The second half of the fix. The findings-changed check was gated on REQUEST_CHANGES, so
    // advisory findings riding on an APPROVE would have frozen at the first commit's set.
    const source = readFileSync(SCRIPT_PATH, 'utf8')
    expect(source).not.toContain('"$want_review" = "REQUEST_CHANGES" ] && [ "$dfp"')
    expect(source).toContain('[ "$dfp" != "$(prior_dfp)" ] && [ "$nfind" -gt 0 ] && need=1')
  })

  test('it does not request the security team', () => {
    // Medium cannot block, so pushing work into the security queue for it is pure noise.
    const { calls } = runGate(medium())
    const teamRequests = calls.filter(
      (call) => call.method === 'POST' && call.url.includes('/requested_reviewers'),
    )
    expect(teamRequests).toHaveLength(0)
  })

  test('high still blocks and still requires a security-team approval', () => {
    // The line moved; it did not disappear.
    const { calls } = runGate({
      ...medium(),
      FAKE_ANTHROPIC_JSON: JSON.stringify({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ risk: 'high', route: 'appsec', categories: [], rationale: 'High.' }),
          },
        ],
      }),
    })
    expect(statusFor(calls, 'security-gate')).toMatchObject({
      description: expect.stringContaining('security-team approval required'),
      state: 'failure',
    })
  })
})

describe('the gate says how to get a security review', () => {
  // The sticky, not the review: the review is only a pointer to it.
  const reviewBody = (calls: FakeCall[]) => stickyBody(calls)

  const risky = (level: string, extra: Record<string, string> = {}) => ({
    EVENT_ACTION: 'synchronize',
    FAKE_ANTHROPIC_JSON: JSON.stringify({
      content: [
        {
          type: 'text',
          text: JSON.stringify({ risk: level, route: 'appsec', categories: [], rationale: 'r' }),
        },
      ],
    }),
    FAKE_FILES_JSON: ONE_CHANGED_FILE,
    FAKE_STATUSES_JSON: '[]',
    GATE_REVIEWS: '1',
    SECURITY_GATE_APP_TOKEN: 'app-token',
    ...extra,
  })

  test('high says the team was requested for you, when it actually was', () => {
    // An org token is present and the request succeeds, so the honest instruction is "wait".
    const { calls } = runGate(risky('high', { SECURITY_GATE_ORG_TOKEN: 'org-token' }))
    expect(reviewBody(calls)).toContain('has been requested automatically')
  })

  test('high tells you to add the team yourself when the request failed', () => {
    // The branch that would otherwise lie. ORG_TOKENS includes the App token, and the gate needs
    // that token to review at all, so the request cannot be made to fail by withholding
    // credentials — the endpoint has to reject it. If it fails and we still say "requested
    // automatically", the PR sits waiting on nobody.
    const { calls } = runGate(risky('high', { FAKE_REQUEST_REVIEW_FAILS: '1' }))
    const body = reviewBody(calls)
    expect(body).toContain('add `@Uniswap/security` as a reviewer')
    expect(body).not.toContain('has been requested automatically')
  })

  test('medium says the findings are advisory and how to ask anyway', () => {
    const { calls } = runGate({
      ...risky('medium'),
      FAKE_ANTHROPIC_JSON_AFTER_FIRST: DEEP_REVIEW_WITH_FINDINGS,
    })
    const body = reviewBody(calls)
    expect(body).toContain('Advisory — these do not block')
    expect(body).toContain('add `@Uniswap/security` as a reviewer')
  })

  test('the team handle follows SECURITY_TEAM rather than being hardcoded', () => {
    const { calls } = runGate(risky('high', { SECURITY_TEAM: 'appsec' }))
    expect(reviewBody(calls)).toContain('@Uniswap/appsec')
  })
})

describe('a deep review never raises the risk band', () => {
  test('a medium whose deep review returns a HIGH finding stays medium', () => {
    // risk is only ever set by the triage classifier, a recovered prior status, or "unknown" on
    // classifier failure — the deep review cannot touch it. Pinned because a `high` row in the
    // findings table under "Risk: medium" reads like an escalation, and because escalating would
    // silently move the PR into the band that demands a security-team approval.
    const { calls, stdout } = runGate({
      EVENT_ACTION: 'synchronize',
      FAKE_ANTHROPIC_JSON: MEDIUM_CLASSIFIER_RESPONSE,
      FAKE_ANTHROPIC_JSON_AFTER_FIRST: DEEP_REVIEW_WITH_FINDINGS,
      FAKE_FILES_JSON: ONE_CHANGED_FILE,
      FAKE_STATUSES_JSON: '[]',
      GATE_REVIEWS: '1',
      SECURITY_GATE_APP_TOKEN: 'app-token',
    })
    expect(stdout).toContain('risk=medium')
    expect(stdout).not.toContain('risk=high')
    expect(statusFor(calls, 'security-gate')).toMatchObject({ state: 'success' })
    // and it must not have queued the security team, which is what a high band does
    expect(
      calls.filter((call) => call.method === 'POST' && call.url.includes('/requested_reviewers')),
    ).toHaveLength(0)
  })

  test('the medium status keeps the wire format the verdict is recovered from', () => {
    // Dropping "(N findings, M blocking)" from the medium description made every review event
    // fail to recover the verdict and re-run the deep review — a second high-effort call, and a
    // chance for model non-determinism to flip the result with no code change behind it.
    const { calls } = runGate({
      EVENT_ACTION: 'synchronize',
      FAKE_ANTHROPIC_JSON: MEDIUM_CLASSIFIER_RESPONSE,
      FAKE_ANTHROPIC_JSON_AFTER_FIRST: DEEP_REVIEW_WITH_FINDINGS,
      FAKE_FILES_JSON: ONE_CHANGED_FILE,
      FAKE_STATUSES_JSON: '[]',
      GATE_REVIEWS: '1',
      SECURITY_GATE_APP_TOKEN: 'app-token',
    })
    const desc = statusFor(calls, 'security-gate')?.description as string
    // medium writes the advisory shape; the counts and their order are what the parser reads.
    expect(desc).toContain('deep review noted')
    expect(desc).toMatch(/\(\d+ findings, \d+ advisory\)/)
    expect(desc).not.toContain('blocking')
    expect(desc.length).toBeLessThanOrEqual(140)
  })

  test('the sticky says a finding severity is not the PR band', () => {
    const { calls } = runGate({
      EVENT_ACTION: 'synchronize',
      FAKE_ANTHROPIC_JSON: MEDIUM_CLASSIFIER_RESPONSE,
      FAKE_ANTHROPIC_JSON_AFTER_FIRST: DEEP_REVIEW_WITH_FINDINGS,
      FAKE_FILES_JSON: ONE_CHANGED_FILE,
      FAKE_STATUSES_JSON: '[]',
      GATE_REVIEWS: '1',
      SECURITY_GATE_APP_TOKEN: 'app-token',
    })
    const body = stickyBody(calls)
    expect(body).toContain("does not change this PR's risk band")
    expect(body).toContain('add `@Uniswap/security` as a reviewer')
  })
})

describe('verdict recovery accepts both wire formats', () => {
  // Statuses already sitting on open PRs say "requested changes" on a medium, because that is
  // what the previous script wrote. If the parser only understood the new "noted" shape, every
  // one of those would fail to recover on its next review event and re-run the deep review —
  // a second high-effort call, and a chance for the verdict to flip with no code change.
  const recoverFrom = (description: string) =>
    runGate({
      EVENT_ACTION: '',
      EVENT_NAME: 'pull_request_review',
      FAKE_FILES_JSON: ONE_CHANGED_FILE,
      FAKE_STATUSES_JSON: JSON.stringify([{ context: 'security-gate', description }]),
      GATE_REVIEWS: '0',
    })

  test('the OLD shape still recovers, so open PRs do not re-run the model', () => {
    const { stdout } = recoverFrom(
      'Risk: medium — blocked · deep review requested changes (3 findings, 2 blocking).',
    )
    expect(stdout).toContain('recovered verdict=changes_required findings=3 blocking=2')
    expect(stdout).not.toContain('api.anthropic.com')
  })

  test('the NEW advisory shape recovers identically', () => {
    const { stdout } = recoverFrom(
      'Risk: medium — passes, findings advisory · deep review noted (3 findings, 2 advisory).',
    )
    expect(stdout).toContain('recovered verdict=changes_required findings=3 blocking=2')
  })

  test('a clear medium recovers under the advisory label', () => {
    const { stdout } = recoverFrom('Risk: medium — passes · deep review clear (1 findings, 0 advisory).')
    expect(stdout).toContain('recovered verdict=clear findings=1')
  })
})

describe('superseded inline threads are resolved', () => {
  const thread = (id: string, authors: string[], resolved = false) => ({
    comments: { nodes: authors.map((login) => ({ author: { login } })) },
    id,
    isResolved: resolved,
  })
  const threadsPayload = (nodes: unknown[]) =>
    JSON.stringify({
      data: { repository: { pullRequest: { reviewThreads: { nodes } } } },
    })

  const mediumWithThreads = (nodes: unknown[]) => ({
    EVENT_ACTION: 'synchronize',
    FAKE_ANTHROPIC_JSON: MEDIUM_CLASSIFIER_RESPONSE,
    FAKE_ANTHROPIC_JSON_AFTER_FIRST: DEEP_REVIEW_WITH_FINDINGS,
    FAKE_FILES_JSON: ONE_CHANGED_FILE,
    FAKE_STATUSES_JSON: '[]',
    FAKE_THREADS_JSON: threadsPayload(nodes),
    GATE_REVIEWS: '1',
    SECURITY_GATE_APP_TOKEN: 'app-token',
  })

  const resolveCalls = (calls: FakeCall[]) =>
    calls.filter(
      (call) =>
        call.url.endsWith('/graphql') &&
        typeof call.body?.query === 'string' &&
        (call.body.query as string).includes('resolveReviewThread'),
    )

  test('existing threads are snapshotted BEFORE the new review is posted', () => {
    // The ordering is the invariant: the review posted below creates threads of its own, so
    // reading the list afterwards would sweep up the comments just written. Which threads
    // qualify is covered exhaustively at the shell level (threads-test.sh, 9 cases) — the
    // mutation itself needs inline comments, and this harness cannot produce them because the
    // diff-anchors file is never written here.
    const { calls } = runGate(mediumWithThreads([thread('T_old', ['uniswap-security-gate'])]))
    const queryAt = calls.findIndex(
      (call) => call.url.endsWith('/graphql') && !(call.body?.query as string)?.includes('resolveReviewThread'),
    )
    const reviewAt = calls.findIndex(
      (call) => call.method === 'POST' && /\/pulls\/1\/reviews$/.test(call.url),
    )
    expect(queryAt).toBeGreaterThanOrEqual(0)
    expect(reviewAt).toBeGreaterThanOrEqual(0)
    expect(queryAt).toBeLessThan(reviewAt)
  })

  test('nothing is resolved when the thread read failed', () => {
    // A bad read must never be treated as "no threads to keep" — that direction deletes detail.
    const { calls } = runGate({
      ...mediumWithThreads([thread('T_old', ['uniswap-security-gate'])]),
      FAKE_THREADS_JSON: '{"errors":[{"message":"Bad credentials"}]}',
    })
    expect(resolveCalls(calls)).toHaveLength(0)
  })

  test('a thread a human replied to is left alone', () => {
    // Resolving hides the conversation, and someone pushing back on a finding is the most
    // valuable thing on the PR.
    const { calls } = runGate(
      mediumWithThreads([thread('T_discussed', ['uniswap-security-gate', 'alice'])]),
    )
    expect(resolveCalls(calls)).toHaveLength(0)
  })

  test("another bot's thread is not touched", () => {
    const { calls } = runGate(mediumWithThreads([thread('T_reviewer', ['github-actions'])]))
    expect(resolveCalls(calls)).toHaveLength(0)
  })

  test('an already-resolved thread is not resolved again', () => {
    const { calls } = runGate(
      mediumWithThreads([thread('T_done', ['uniswap-security-gate'], true)]),
    )
    expect(resolveCalls(calls)).toHaveLength(0)
  })

  test('nothing is resolved when no new inline comments were posted', () => {
    // Body-only review: the old threads are the only place those findings still appear, so
    // resolving them would delete detail rather than supersede it.
    const { calls } = runGate({
      ...mediumWithThreads([thread('T_old', ['uniswap-security-gate'])]),
      FAKE_ANTHROPIC_JSON_AFTER_FIRST: JSON.stringify({
        content: [{ type: 'text', text: JSON.stringify({ findings: [], summary: 's', verdict: 'clear' }) }],
      }),
    })
    expect(resolveCalls(calls)).toHaveLength(0)
  })
})

describe('findings are scoped to security', () => {
  const deep = (findings: unknown[]) =>
    JSON.stringify({
      content: [
        { type: 'text', text: JSON.stringify({ findings, summary: 's', verdict: 'changes_required' }) },
      ],
    })
  const finding = (category: string, title: string, severity = 'medium') => ({
    category,
    detail: 'd',
    file: 'README.md',
    fix_end_line: 0,
    fix_start_line: 0,
    line: 1,
    recommendation: 'r',
    severity,
    suggestion: '',
    title,
  })
  const run = (findings: unknown[]) =>
    runGate({
      EVENT_ACTION: 'synchronize',
      FAKE_ANTHROPIC_JSON: MEDIUM_CLASSIFIER_RESPONSE,
      FAKE_ANTHROPIC_JSON_AFTER_FIRST: deep(findings),
      FAKE_FILES_JSON: ONE_CHANGED_FILE,
      FAKE_STATUSES_JSON: '[]',
      GATE_REVIEWS: '1',
      SECURITY_GATE_APP_TOKEN: 'app-token',
    })

  test('scoping every finding away also clears the stale changes_required verdict', () => {
    // The model returns verdict=changes_required about findings that are then all dropped. The
    // verdict must not survive them. Latent on backend, where medium is advisory and nothing
    // reads deep_block — but universe blocks a medium when the verdict is not "clear", so the
    // same response blocked a PR there while displaying "0 findings, 0 blocking".
    const { stdout } = run([finding('not-security', 'Flaky test'), finding('not-security', 'Perf')])
    expect(stdout).toContain('dropped 2 non-security finding(s) of 2')
    expect(stdout).toContain('deep=clear')
    expect(stdout).not.toContain('deep=changes_required')
  })

  test('a not-security finding is dropped and never reaches the PR', () => {
    const { calls, stdout } = run([
      finding('not-security', 'Reliability: nack loop on retry'),
      finding('injection', 'Command injection via unescaped arg'),
    ])
    expect(stdout).toContain('dropped 1 non-security finding(s) of 2')
    expect(stdout).toContain('findings=1')
    const body = stickyBody(calls)
    expect(body).toContain('Command injection')
    expect(body).not.toContain('nack loop')
  })

  test('a finding with no category at all is treated as not-security', () => {
    // Fails closed on scope: an unlabelled finding is not evidence of a security defect.
    const { stdout } = run([{ detail: 'd', file: 'README.md', line: 1, severity: 'high', title: 'Unlabelled' }])
    expect(stdout).toContain('findings=0')
  })

  test('every security category survives', () => {
    const cats = [
      'backdoor', 'authz', 'secrets', 'injection', 'deserialization',
      'input-validation', 'egress', 'crypto', 'supply-chain', 'ci-permissions',
    ]
    const { stdout } = run(cats.map((c) => finding(c, `${c} issue`)))
    expect(stdout).toContain(`findings=${cats.length}`)
  })

  test('dropping everything leaves a clean review, not a broken one', () => {
    const { calls, stdout } = run([finding('not-security', 'Style nit'), finding('not-security', 'Perf')])
    expect(stdout).toContain('dropped 2 non-security finding(s) of 2')
    expect(stdout).toContain('findings=0')
    expect(statusFor(calls, 'security-gate')).toMatchObject({ state: 'success' })
  })

  test('the schema requires a category, so the model cannot omit it', () => {
    const source = readFileSync(SCRIPT_PATH, 'utf8')
    expect(source).toContain('"required":["category","severity"')
    expect(source).toContain('"not-security"')
  })
})

describe('the verdict is a property of the head SHA', () => {
  // The incident: re-running a pull_request_target run on Uniswap/backend#12478 re-sampled the
  // classifier, moved an unchanged diff from medium to high, flipped the check to failing and
  // paged the security team. Same code, same SHA, different answer.
  const priorStatus = (description: string) =>
    JSON.stringify([{ context: 'security-gate', description }])

  const rerun = (extra: Record<string, string> = {}) =>
    runGate({
      EVENT_ACTION: 'synchronize',
      EVENT_NAME: 'pull_request_target',
      FAKE_ANTHROPIC_JSON: JSON.stringify({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ risk: 'high', route: 'appsec', categories: [], rationale: 'r' }),
          },
        ],
      }),
      FAKE_FILES_JSON: ONE_CHANGED_FILE,
      ...extra,
    })

  test('a recorded band is reused, not re-sampled, on a re-run', () => {
    // The classifier is primed to answer "high". The prior status for this SHA says medium, so
    // medium must win — otherwise the same head holds two verdicts.
    const { stdout } = rerun({
      FAKE_STATUSES_JSON: priorStatus('Risk: medium — passes · deep review clear (1 findings, 0 advisory).'),
    })
    expect(stdout).toContain('reusing risk=medium')
    expect(stdout).toContain('risk=medium')
    expect(stdout).not.toContain('risk=high')
  })

  test('no prior status means a fresh classification — a push is never suppressed', () => {
    // A push writes a new SHA with no status, which is what makes the reuse safe.
    const { stdout } = rerun({ FAKE_STATUSES_JSON: '[]' })
    expect(stdout).toContain('risk=high')
    expect(stdout).not.toContain('reusing risk')
  })

  test('a recorded "unknown" is NOT reused, so a failed run can retry', () => {
    // Pinning a failure to the SHA forever would be worse than re-sampling it.
    const { stdout } = rerun({
      FAKE_STATUSES_JSON: priorStatus('Assessment unavailable — security review required (fail-closed).'),
    })
    expect(stdout).toContain('risk=high')
    expect(stdout).not.toContain('reusing risk')
  })

  test('the deep-review outcome is recovered too, not just the band', () => {
    // Half a fix would reuse the band and then pay for a fresh deep review returning a different
    // finding set — one head, two answers again.
    const { stdout } = rerun({
      FAKE_ANTHROPIC_JSON_AFTER_FIRST: DEEP_REVIEW_WITH_FINDINGS,
      FAKE_STATUSES_JSON: priorStatus('Risk: medium — passes, findings advisory · deep review noted (3 findings, 2 advisory).'),
    })
    expect(stdout).toContain('recovered verdict=changes_required findings=3')
    expect(stdout).not.toContain('api.anthropic.com')
  })
})

describe('the sticky comment does not contradict itself on medium', () => {
  // POST or PATCH: the sticky is now written several times per run (running, deep review running,
  // verdict), and only the first write on a new PR is a POST. The verdict is the LAST write.
  const sticky = (calls: FakeCall[]) =>
    calls
      .filter((call) => (call.method === 'POST' || call.method === 'PATCH') && /\/issues\/(1\/comments|comments\/)/.test(call.url))
      .map((call) => call.body?.body as string)
      .filter(Boolean)
      .at(-1)

  const band = (risk: string) => ({
    EVENT_ACTION: 'synchronize',
    FAKE_ANTHROPIC_JSON: JSON.stringify({
      content: [
        { type: 'text', text: JSON.stringify({ risk, route: 'human', categories: [], rationale: 'r' }) },
      ],
    }),
    FAKE_ANTHROPIC_JSON_AFTER_FIRST: DEEP_REVIEW_WITH_FINDINGS,
    FAKE_FILES_JSON: ONE_CHANGED_FILE,
    FAKE_STATUSES_JSON: '[]',
    GATE_REVIEWS: '1',
    SECURITY_GATE_APP_TOKEN: 'app-token',
  })

  test('a passing medium never says "blocking" or "changes_required" in visible text', () => {
    // It printed `changes_required — N finding(s), M blocking` two lines under a pass heading.
    // Visible text only: the HTML marker legitimately still carries deep=changes_required,
    // which is the wire value prior_status_desc reads back to recover the verdict.
    const body = sticky(runGate(band('medium')).calls) as string
    const visible = body.replace(/<!--[\s\S]*?-->/g, '')
    // A table cell now ("| **Deep review** |"), not a "- **Deep review:**" bullet.
    expect(visible).toContain('Deep review')
    expect(visible).toContain('advisory')
    expect(visible).not.toContain('blocking')
    expect(visible).not.toContain('changes_required')
  })

  test('high still says blocking, where it is true', () => {
    const body = sticky(runGate(band('high')).calls) as string
    expect(body.replace(/<!--[\s\S]*?-->/g, '')).toContain('blocking')
  })

  test('the machine-readable marker keeps the wire value', () => {
    // Breaking this would cost a model call on every run now that #12509 recovers on all events.
    const body = sticky(runGate(band('medium')).calls) as string
    expect(body).toContain('security-gate:required')
    expect(body).toMatch(/deep=changes_required/)
  })
})

describe('repo accepted-risk context', () => {
  const CTX_PATH = join(REPO_ROOT, 'scripts', 'security-gate-check', 'security-gate-context.md')

  const runWithContext = (extra: Record<string, string> = {}) =>
    runGate({
      EVENT_ACTION: 'synchronize',
      FAKE_ANTHROPIC_JSON: MEDIUM_CLASSIFIER_RESPONSE,
      FAKE_ANTHROPIC_JSON_AFTER_FIRST: DEEP_REVIEW_WITH_FINDINGS,
      FAKE_FILES_JSON: ONE_CHANGED_FILE,
      FAKE_STATUSES_JSON: '[]',
      SECURITY_CONTEXT_FILE: CTX_PATH,
      ...extra,
    })

  const systemPromptsOf = (calls: FakeCall[]) =>
    calls.filter((call) => call.url.includes('api.anthropic.com')).map((call) => call.body?.system as string)

  test('the context reaches BOTH the triage and the deep review', () => {
    const prompts = systemPromptsOf(runWithContext().calls)
    expect(prompts.length).toBeGreaterThanOrEqual(2)
    for (const prompt of prompts) {
      expect(prompt).toContain('REPOSITORY ACCEPTED-RISK CONTEXT')
      expect(prompt).toContain('Things that look wrong but aren')
    }
  })

  test('it is labelled TRUSTED and distinguished from the diff', () => {
    // Both system prompts already tell the model that instruction-shaped text is hostile data to
    // report and never obey. Without saying this came from the protected default branch, the
    // model would be right to treat a suppression list as an injection attempt.
    const prompt = systemPromptsOf(runWithContext().calls)[0]
    expect(prompt).toContain('TRUSTED')
    expect(prompt).toContain('NOT from the diff under review')
  })

  test('it cannot silence a real finding in the diff being judged', () => {
    const prompt = systemPromptsOf(runWithContext().calls)[0]
    expect(prompt).toContain('never overrides a concrete exploitable finding')
  })

  test('a missing context file is not an error — the gate just reviews without it', () => {
    // Absence makes the gate stricter, not broken, so it must not fail closed on it.
    const { calls, stdout } = runWithContext({ SECURITY_CONTEXT_FILE: '/nonexistent/ctx.md' })
    expect(stdout).toContain('reviewing without accepted-risk context')
    expect(systemPromptsOf(calls)[0]).not.toContain('REPOSITORY ACCEPTED-RISK CONTEXT')
    expect(statusFor(calls, 'security-gate')).toMatchObject({ state: 'success' })
  })

  test('the context is capped so it cannot crowd out the diff', () => {
    // An unbounded file would push the diff out of the window — the gate would review less code
    // while still looking like it worked.
    const { calls } = runWithContext({ SECURITY_CONTEXT_CAP: '120' })
    const prompt = systemPromptsOf(calls)[0]
    expect(prompt).toContain('REPOSITORY ACCEPTED-RISK CONTEXT')
    expect(prompt).not.toContain('Known-noisy patterns')
  })

  test('the workflow reads it from the default branch, never the PR head', () => {
    // The whole security property: a PR supplying its own suppression list could silence the
    // gate on the change being judged.
    const checkout = WORKFLOW.jobs.gate.steps.find((step) => step.uses?.startsWith('actions/checkout@'))
    expect(checkout?.with?.ref).toBe('${{ github.event.repository.default_branch }}')
    expect(String(checkout?.with?.['sparse-checkout'])).toContain('scripts/security-gate-check/security-gate-context.md')
  })
})

describe('the feedback tip rides on each finding\'s inline comment', () => {
  // One thread per finding is the only granularity at which a reaction means anything: a 👎 on a
  // summary carrying four findings tells the aggregator nothing about which one was wrong. It is
  // also not put in the sticky, where an alert inside the collapsed findings section rendered as a
  // literal "[!TIP]".
  const TIP = 'Was this finding useful?'
  const HIGH_CLASSIFIER_RESPONSE = JSON.stringify({
    content: [{ type: 'text', text: JSON.stringify({ risk: 'high', route: 'human', categories: [], rationale: 'High risk.' }) }],
  })
  const run = (extra: Record<string, string>) =>
    runGate({
      EVENT_ACTION: 'synchronize',
      FAKE_FILES_JSON: ONE_CHANGED_FILE,
      FAKE_REVIEWS_JSON: '[]',
      FAKE_STATUSES_JSON: '[]',
      GATE_REVIEWS: '1',
      SECURITY_GATE_APP_TOKEN: 'app-token',
      ...extra,
    })
  const lastReview = (calls: FakeCall[]) =>
    calls.filter((call) => call.method === 'POST' && /\/pulls\/1\/reviews$/.test(call.url)).at(-1)?.body

  test('every inline finding comment ends with it; the review and the sticky do not carry it', () => {
    const { calls, stdout } = run({
      FAKE_ANTHROPIC_JSON: HIGH_CLASSIFIER_RESPONSE,
      FAKE_ANTHROPIC_JSON_AFTER_FIRST: DEEP_REVIEW_WITH_FINDINGS,
    })
    // DEEP_REVIEW_WITH_FINDINGS has no `recommendation`: a missing free-text field must not fail
    // the whole filter and drop every inline comment to zero.
    expect(stdout).toContain('inline=1')
    const review = lastReview(calls)
    const comments = (review?.comments ?? []) as { body: string; path: string }[]
    expect(comments).toHaveLength(1)
    // The finding's own header stays the first line: the feedback aggregator reads only that.
    expect(comments[0].body.split('\n')[0]).toBe('**HIGH · input-validation — Unbounded priority fee**')
    expect(comments[0].body).toEndWith(
      '> [!TIP]\n> **Was this finding useful?** Help the gate improve: react 👍 if it helped, 👎 if it was a false positive. Reply to add context. The security team reads these weekly and tunes the gate from them.',
    )
    expect(review?.body as string).not.toContain(TIP)
    const sticky = stickyBody(calls)
    expect(sticky).toContain('Unbounded priority fee')
    expect(sticky).not.toContain(TIP)
  })

  test('the sticky points to its own findings section, not to the review', () => {
    const sticky = stickyBody(
      run({ FAKE_ANTHROPIC_JSON: HIGH_CLASSIFIER_RESPONSE, FAKE_ANTHROPIC_JSON_AFTER_FIRST: DEEP_REVIEW_WITH_FINDINGS })
        .calls,
    )
    expect(sticky).toContain('1 blocking. Detail is in the Findings section below.')
    expect(sticky).not.toContain('in the gate review')
  })

  test('a clean low-risk run carries it nowhere', () => {
    const { calls } = run({ FAKE_ANTHROPIC_JSON: LOW_CLASSIFIER_RESPONSE })
    expect(JSON.stringify(calls.filter((call) => call.method !== 'GET').map((call) => call.body))).not.toContain(TIP)
  })
})

describe('the gate counts the approval it just cast', () => {
  const source = readFileSync(SCRIPT_PATH, 'utf8')

  test('review-integrity is re-evaluated after an approving review is posted', () => {
    // It is evaluated BEFORE submit_review, so the gate's own approval landed in the next run
    // rather than this one — and that next run is not guaranteed, because GitHub suppresses
    // workflow triggers for GITHUB_TOKEN-generated events (an approval from github-actions[bot]
    // wakes nothing). A PR with only bot approvals could sit showing a count one too low.
    const after = source.slice(source.indexOf('submit_review "$want_review"'))
    expect(after).toContain('evaluate_review_integrity')
    expect(after).toContain('"$want_review" = "APPROVE"')
  })

  test('a failed refetch keeps the count already posted', () => {
    // evaluate_review_integrity fails closed on an unreadable snapshot. Correct when it is the
    // run's only verdict; wrong for a best-effort recount layered on a status that already
    // posted correctly — a blip must not replace a good count with "Cannot verify approvals".
    const after = source.slice(source.indexOf('submit_review "$want_review"'))
    expect(after).toContain('[ -n "$REVIEWS_OK" ] && [ -n "$PENDING_OK" ]')
    expect(after).toContain('recount skipped')
  })
})

describe('the gate explains where the band came from', () => {
  const source = readFileSync(SCRIPT_PATH, 'utf8')

  test('a high PR says the band is not the highest finding', () => {
    // The complaint this answers: "why is this high when the findings are medium and low?"
    // Triage sets the band from the whole change; the deep review cannot move it, and the clamp
    // only caps findings DOWN to it. So high-with-medium-findings is correct and needs saying.
    expect(source).toContain('The risk band comes from the change as a whole, not from the highest finding —')
  })

  test('the triage rationale survives a reused verdict', () => {
    // #12509 pins the band to the SHA, which skips the classifier on every later run for that
    // head. route/cats/rationale are only assigned when the classifier runs, so the sticky
    // comment was rewritten with them blank — no PR had ever displayed a rationale.
    expect(source).toContain('TRIAGE_MARKER')
    expect(source).toContain('prior_triage()')
    // Recovery has to sit in the reuse branch, not only in the classify branch.
    const reuse = source.slice(source.indexOf('risk="$prisk"'), source.indexOf('if [ -z "$risk" ]'))
    expect(reuse).toContain('prior_triage')
  })

  test('the persisted rationale cannot close the HTML comment early', () => {
    // It is model output derived from the untrusted diff. A literal "-->" would end the marker
    // and spill the remainder into the rendered comment body.
    expect(source).toMatch(/sed 's\/--\*>\/-\/g'/)
  })
})

describe('re-reviewing the same findings does not repost them', () => {
  const source = readFileSync(SCRIPT_PATH, 'utf8')

  test('the findings fingerprint ignores the prose the model rewords', () => {
    // Every rebase is a new head SHA, so the deep review runs again and rewords freely:
    // "Committed env override redirects Trading API traffic" one run, "Checked-in env override
    // redirects trading API traffic" the next, about the identical line. Hashing the whole
    // findings array made that look like a new finding set and posted another review.
    // Uniswap/universe#40896: 25 reviews and 32 threads for TWO findings, 25 of them on the
    // same file:line.
    // `line` is excluded too: the model re-anchors the same issue a line or two away between
    // runs on an identical diff. Observed on Uniswap/universe#40925 — one finding moved from
    // line 21 to 22 with no diff change, which put the drift straight back into the key.
    expect(source).toContain('{file, category, severity}')
    expect(source).not.toContain('{file, line, category, severity}')
    expect(source).not.toMatch(/dfp="\$\(printf '%s' "\$deep_json" \| jq -Sc '\(\.findings \/\/ \[\]\)'/)
  })

  test('thread resolution is confirmed from the response, not curl exit status', () => {
    // GraphQL answers 200 with an errors[] body when a mutation is rejected, so checking curl's
    // exit code counted round-trips. #40896 logged "resolved 29 superseded inline thread(s)"
    // with 30 threads still open.
    expect(source).toContain('.data.resolveReviewThread.thread.isResolved == true')
    expect(source).toContain('FAILED to resolve')
  })
})

describe('a comment can re-run the gate', () => {
  const source = readFileSync(WORKFLOW_PATH, 'utf8')

  test('the trigger is guarded to PRs, the command, and members', () => {
    // issue_comment fires for issues too, and for every comment by anyone. Without all three
    // guards any account able to comment could spend CI on demand.
    expect(source).toContain('issue_comment:')
    expect(source).toContain('github.event.issue.pull_request != null')
    expect(source).toContain("startsWith(github.event.comment.body, '/gate re-run')")
    // startsWith, not contains: the footer advertises the command, so a comment quoting it — or
    // one saying "I tried /gate re-run and nothing happened" — must not trigger a run.
    expect(source).not.toContain("contains(github.event.comment.body")
    // COLLABORATOR is deliberately absent: it includes read- and triage-only collaborators,
    // so it is wider than write access.
    expect(source).toContain('OWNER","MEMBER"')
    expect(source).not.toContain('COLLABORATOR"]')
  })

  test('the comment body is only ever pattern-matched, never interpolated', () => {
    // It is attacker-influenceable text. The invariant is not "appears once" — it legitimately
    // appears in the job `if` and in the concurrency group — but that EVERY occurrence is a
    // startsWith() match. Counting occurrences was too brittle (adding the concurrency guard
    // broke it); scanning run: blocks was too narrow (it missed single-line run: steps).
    const all = source.match(/github\.event\.comment\.body/g) ?? []
    const matched = source.match(/startsWith\(github\.event\.comment\.body/g) ?? []
    expect(all.length).toBeGreaterThan(0)
    expect(matched).toHaveLength(all.length)
  })

  test('the concurrency group resolves on a comment event', () => {
    // Without the issue.number fallback the group is "security-gate-" for every comment run,
    // putting unrelated PRs in one bucket where they cancel each other.
    expect(WORKFLOW.concurrency.group).toContain('github.event.issue.number')
    expect(WORKFLOW.concurrency['cancel-in-progress']).toContain("'issue_comment'")
  })

  test('the pending status says a recheck was requested, not that review state changed', () => {
    // A recheck is a review-state event for the fail-closed prior-status read, but no review
    // state changed — someone asked for a recount. A status claiming otherwise is the same
    // class of wrong as a footer saying it fails closed when it does not.
    const script = readFileSync(SCRIPT_PATH, 'utf8')
    expect(script).toContain('seed_reason="Recheck requested"')
    expect(script).toContain('[ "$EVENT" = "issue_comment" ] && seed_reason=')
    // and the literal must no longer be hardcoded into the status calls
    expect(script).not.toContain('pending "Review state changed — recalculating."')
  })

  test('the lane guard mirrors every condition in the job guard', () => {
    // Concurrency is evaluated BEFORE the job `if`, so a run that will skip still takes the
    // lane and can evict a queued review-state run — silently dropping a dismissal. Mirroring
    // only the command string was not enough: an unauthorised /gate re-run still took the lane.
    const group = String(WORKFLOW.concurrency.group)
    for (const cond of [
      'startsWith(github.event.comment.body',
      'issue.pull_request != null',
      'OWNER","MEMBER',
    ]) {
      expect(group).toContain(cond)
    }
  })

  test('a re-run declines unless a real band is recorded for the head', () => {
    // This is the half that makes "a re-run cannot change a verdict" true, and the stated
    // justification for admitting bare MEMBER. A non-empty test was not enough: a run that died
    // after seeding leaves the head holding the pending text, which is not a verdict.
    const script = readFileSync(SCRIPT_PATH, 'utf8')
    expect(script).toContain('rc_decline')
    expect(script).toMatch(/trivial\|low\|medium\|high\|critical\) ;;\n\s*\*\) rc_decline=1/)
    // and it must decline AFTER review-integrity is recomputed, since the run occupied the lane
    const riCall = script.indexOf('evaluate_review_integrity || exit 1')
    const decline = script.indexOf('if [ -n "$rc_decline" ]; then')
    expect(decline).toBeGreaterThan(riCall)
  })

  // Keyed on the command string and the printf prefix, NOT on the surrounding prose. An earlier
  // version of these tests looked for the literal lead-in "Re-run this check:", so rewording the
  // sentence made `.find()` return undefined -- and `undefined` silently satisfies
  // `.not.toContain()`, so the <sub> assertion below would have passed while checking nothing.
  const rerunPrintf = (script: string) =>
    script
      .split('\n')
      .find((l) => l.trimStart().startsWith('printf') && l.includes('`/gate re-run`'))

  test('the sticky comment tells people the command exists', () => {
    const script = readFileSync(SCRIPT_PATH, 'utf8')
    // "in the PR conversation" matters: an inline diff comment is a different event that this
    // workflow does not subscribe to, so the command typed there silently does nothing.
    expect(script).toContain('`/gate re-run` in the PR conversation (not on a diff line)')
  })

  test('the re-run line offers the command rather than instructing', () => {
    // Most PRs need no re-run. An imperative lead-in told every author to go do something on a
    // verdict that was already correct, so the line is phrased as a condition.
    const line = rerunPrintf(readFileSync(SCRIPT_PATH, 'utf8'))
    expect(line).toBeDefined()
    expect(line).not.toMatch(/\*\*Re-run this check:\*\*/)
    expect(line).toMatch(/\*\*[^*]*\?\*\*/)
  })

  test('the re-run line renders at body size, not as small print', () => {
    // It is the only actionable line in the comment. Inside <sub> it sat directly under three
    // lines of identically-sized policy text and read as more boilerplate. Asserted on the
    // printf itself so wrapping it back in <sub> fails here rather than only in a screenshot.
    const line = rerunPrintf(readFileSync(SCRIPT_PATH, 'utf8'))
    expect(line).toBeDefined()
    expect(line).not.toContain('<sub>')
  })

  test('the re-run rule cannot turn the preceding line into a heading', () => {
    // `---` directly beneath text is a setext heading in GitHub Markdown, which would silently
    // promote whatever printf ran before it to an <h2>. The blank line is what keeps it an <hr>.
    const line = rerunPrintf(readFileSync(SCRIPT_PATH, 'utf8'))
    expect(line).toBeDefined()
    expect(line).toContain("'\\n---\\n\\n")
  })

  test('the actionable line comes before the policy small print', () => {
    // Ordering is the point: verdict, then what you can do, then reference text.
    const script = readFileSync(SCRIPT_PATH, 'utf8')
    const rerun = script.indexOf('`/gate re-run` in the PR conversation')
    const policy = script.indexOf('<sub>Required check. trivial/low auto-approved.')
    expect(rerun).toBeGreaterThan(-1)
    expect(policy).toBeGreaterThan(rerun)
  })

  test('the footer no longer claims it fails closed', () => {
    // FAIL_OPEN_ON_UNAVAILABLE defaults to 1: an unavailable assessment PASSES and says so.
    // Asserted against the footer printf specifically, not the whole file — grepping the source
    // passed only because the comment explaining the removal omits the trailing period.
    const script = readFileSync(SCRIPT_PATH, 'utf8')
    const footer = script.split('\n').find((l) => l.includes('<sub>Required check.')) ?? ''
    expect(footer).not.toContain('Fails closed')
    expect(footer).toContain('Break-glass')
  })
})

describe('the risk-history guard does not error on an empty history', () => {
  // Runs the guard as shell rather than only grepping for it: the bug was that a jq invocation
  // which SUCCEEDS but prints nothing defeats an `|| echo 0` fallback, and only execution shows
  // that. Kept as a standalone probe -- reproducing it through runGate would need a PR with a
  // recorded risk history, which the fake harness does not build.
  const probe = (lines: string[]) =>
    Bun.spawnSync({ cmd: ['bash', '-e', '-c', lines.join('\n')], stdout: 'pipe', stderr: 'pipe' })

  const CURRENT = [
    'history=""',
    '_hist_n="$(printf \'%s\' "$history" | jq \'length\' 2>/dev/null | head -1)"',
    'if [ "${_hist_n:-0}" -gt 1 ]; then echo RENDER; else echo SKIP; fi',
  ]

  test('an empty history skips the block silently', () => {
    const r = probe(CURRENT)
    expect(new TextDecoder().decode(r.stderr)).toBe('')
    expect(new TextDecoder().decode(r.stdout).trim()).toBe('SKIP')
  })

  test('the form it replaced really did error, so this is not a cosmetic edit', () => {
    // Guards against "fixing" a bug that was never there. If this stops erroring on some future
    // jq, the fix above is unnecessary and this test says so out loud.
    const r = probe([
      'history=""',
      'if [ "$(printf \'%s\' "$history" | jq \'length\' 2>/dev/null || echo 0)" -gt 1 ]; then echo RENDER; else echo SKIP; fi',
    ])
    expect(new TextDecoder().decode(r.stderr)).toContain('integer expression expected')
  })

  test('a history with more than one entry still renders', () => {
    const r = probe([
      'history=\'[{"risk":"low"},{"risk":"high"}]\'',
      '_hist_n="$(printf \'%s\' "$history" | jq \'length\' 2>/dev/null | head -1)"',
      'if [ "${_hist_n:-0}" -gt 1 ]; then echo RENDER; else echo SKIP; fi',
    ])
    expect(new TextDecoder().decode(r.stderr)).toBe('')
    expect(new TextDecoder().decode(r.stdout).trim()).toBe('RENDER')
  })

  test('a single-entry history is not a change worth rendering', () => {
    const r = probe([
      'history=\'[{"risk":"low"}]\'',
      '_hist_n="$(printf \'%s\' "$history" | jq \'length\' 2>/dev/null | head -1)"',
      'if [ "${_hist_n:-0}" -gt 1 ]; then echo RENDER; else echo SKIP; fi',
    ])
    expect(new TextDecoder().decode(r.stdout).trim()).toBe('SKIP')
  })

  test('the script uses the defaulted form, not the fallback that cannot fire', () => {
    const script = readFileSync(SCRIPT_PATH, 'utf8')
    expect(script).toContain('if [ "${_hist_n:-0}" -gt 1 ]; then')
    expect(script).not.toContain('jq \'length\' 2>/dev/null || echo 0')
  })
})

describe('repo orientation', () => {
  // Orientation is a SEPARATE file because the accepted-risk block is introduced to the model as
  // "the maintainers have decided these are acceptable, do not report them". Describing the
  // codebase under that heading would tell the model not to report the architecture -- and the
  // failure would be invisible, because findings would simply stop appearing in whatever area got
  // described. Two files, two headings, two meanings; these tests pin the difference.
  const ORIENT_PATH = join(REPO_ROOT, 'scripts', 'security-gate-check', 'security-gate-orientation.md')
  const CTX_PATH = join(REPO_ROOT, 'scripts', 'security-gate-check', 'security-gate-context.md')

  const run = (extra: Record<string, string> = {}) =>
    runGate({
      EVENT_ACTION: 'synchronize',
      FAKE_ANTHROPIC_JSON: MEDIUM_CLASSIFIER_RESPONSE,
      FAKE_ANTHROPIC_JSON_AFTER_FIRST: DEEP_REVIEW_WITH_FINDINGS,
      FAKE_FILES_JSON: ONE_CHANGED_FILE,
      FAKE_STATUSES_JSON: '[]',
      SECURITY_ORIENTATION_FILE: ORIENT_PATH,
      ...extra,
    })

  const systemPromptsOf = (calls: FakeCall[]) =>
    calls.filter((call) => call.url.includes('api.anthropic.com')).map((call) => call.body?.system as string)

  test('orientation reaches BOTH the triage and the deep review', () => {
    const prompts = systemPromptsOf(run().calls)
    expect(prompts.length).toBeGreaterThanOrEqual(2)
    for (const prompt of prompts) {
      expect(prompt).toContain('REPOSITORY ORIENTATION')
      expect(prompt).toContain('Entry Gateway')
    }
  })

  test('it is labelled TRUSTED and separated from the diff', () => {
    const prompt = systemPromptsOf(run().calls)[0]
    const header = prompt.slice(prompt.indexOf('REPOSITORY ORIENTATION'))
    expect(header).toContain('TRUSTED')
    expect(header).toContain('NOT from the diff under review')
  })

  test('orientation does NOT read as a suppression instruction', () => {
    // The entire reason this is a second file. If the orientation heading ever acquires mute
    // language, every area it describes goes quiet and nothing reports that it happened.
    const prompt = systemPromptsOf(run().calls)[0]
    const start = prompt.indexOf('REPOSITORY ORIENTATION')
    const end = prompt.indexOf('REPOSITORY ACCEPTED-RISK CONTEXT')
    expect(start).toBeGreaterThan(-1)
    const block = end > start ? prompt.slice(start, end) : prompt.slice(start)
    expect(block).toContain('does NOT suppress anything')
    expect(block).not.toContain('Do not report them')
  })

  test('orientation comes before the accepted-risk list', () => {
    // It calibrates severity for everything after it, including how to read the mute list. The
    // reverse order invites the model to read the description as more of the same.
    const prompt = systemPromptsOf(run({ SECURITY_CONTEXT_FILE: CTX_PATH }).calls)[0]
    const orient = prompt.indexOf('REPOSITORY ORIENTATION')
    const accepted = prompt.indexOf('REPOSITORY ACCEPTED-RISK CONTEXT')
    expect(orient).toBeGreaterThan(-1)
    expect(accepted).toBeGreaterThan(orient)
  })

  test('a missing orientation file is not an error', () => {
    const { calls, stdout } = run({ SECURITY_ORIENTATION_FILE: '/nonexistent/orient.md' })
    expect(stdout).toContain('reviewing without repo orientation')
    expect(systemPromptsOf(calls)[0]).not.toContain('REPOSITORY ORIENTATION')
    expect(statusFor(calls, 'security-gate')).toMatchObject({ state: 'success' })
  })

  test('it has its own cap, so the two files cannot starve each other', () => {
    const prompt = systemPromptsOf(run({ SECURITY_ORIENTATION_CAP: '80' }).calls)[0]
    expect(prompt).toContain('REPOSITORY ORIENTATION')
    expect(prompt).not.toContain('Entry Gateway')
  })

  test('the workflow reads it from the default branch, never the PR head', () => {
    // Same property as the accepted-risk file: it is prompt input on a privileged run, so a PR
    // supplying its own copy could reshape how the gate judges that very change.
    const checkout = WORKFLOW.jobs.gate.steps.find((step) => step.uses?.startsWith('actions/checkout@'))
    expect(checkout?.with?.ref).toBe('${{ github.event.repository.default_branch }}')
    expect(String(checkout?.with?.['sparse-checkout'])).toContain(
      'scripts/security-gate-check/security-gate-orientation.md',
    )
  })

  test('the shipped orientation file makes no promise to suppress', () => {
    // Guards the FILE, not just the wrapper: an entry written as "ignore X" would be honoured as
    // one despite the heading, because the model reads both.
    const text = readFileSync(ORIENT_PATH, 'utf8')
    expect(text).toContain('not a suppression list')
    expect(text.toLowerCase()).not.toContain('do not report')
  })

  test('a cap landing mid-character does not corrupt the context', () => {
    // `head -c` cuts at a BYTE offset and both trusted files are prose full of em-dashes, so a
    // file that reaches its cap can be truncated inside a multibyte sequence. jq does not reject
    // that -- it substitutes U+FFFD and carries on -- so the tail of the context arrives silently
    // mangled. The loader runs the read through `iconv -c` to drop the incomplete sequence.
    //
    // Driven through the real script: a cap chosen to land mid-em-dash must still produce a
    // prompt with no replacement characters in it.
    const bytes = readFileSync(ORIENT_PATH)
    let cut = -1
    for (let i = 40; i < Math.min(bytes.length, 4000); i++) {
      // 0xE2 starts the 3-byte sequence for an em-dash; cutting right after it splits the char.
      if (bytes[i - 1] === 0xe2) { cut = i; break }
    }
    expect(cut).toBeGreaterThan(-1)

    const prompt = systemPromptsOf(run({ SECURITY_ORIENTATION_CAP: String(cut) }).calls)[0]
    expect(prompt).toContain('REPOSITORY ORIENTATION')
    expect(prompt).not.toContain('\uFFFD')
  })

  test('the Areas section carries no mute wording', () => {
    // Contributions land under "## Areas", and contributors are not on the security team. The
    // whole-file "do not report" check above cannot be tightened much further, because the
    // guidance prose deliberately QUOTES the dangerous forms as counter-examples -- so the strict
    // check is scoped to the section where entries actually go.
    //
    // Phrase-level, not word-level, and deliberately so: a legitimate escalation entry may well
    // contain "skip" or "ignore" ("code that ignores the return value", "do not skip validation
    // here"). Only wording directed AT the gate is banned.
    const text = readFileSync(ORIENT_PATH, 'utf8')
    const start = text.indexOf('## Areas')
    expect(start).toBeGreaterThan(-1)
    const rest = text.slice(start + '## Areas'.length)
    const end = rest.search(/\n## /)
    const areas = (end === -1 ? rest : rest.slice(0, end)).toLowerCase()

    for (const phrase of [
      'do not report',
      "don't report",
      'do not flag',
      "don't flag",
      'no need to flag',
      'safe to ignore',
      'can be ignored',
      'should be ignored',
      'false positive',
      'skip them',
      'skip these',
      'skip findings',
      'suppress',
      'not a finding',
    ]) {
      expect(areas).not.toContain(phrase)
    }
  })

  test('the file says contributors do not need to be on the security team', () => {
    // The point of the section. If this sentence goes, the file quietly becomes security-only
    // again and the per-area knowledge it is asking for never arrives.
    const text = readFileSync(ORIENT_PATH, 'utf8')
    expect(text).toContain('You do not need to be on the security team')
    expect(text).toContain('## Areas')
  })

  test('a file that outgrows its cap says so instead of truncating silently', () => {
    // `head -c` cuts without complaint, and the tail is where new entries land -- so an outgrown
    // file drops exactly what someone just added while the run still reports success. Now that
    // the file invites contributions, growth is expected rather than hypothetical.
    const { stdout } = run({ SECURITY_ORIENTATION_CAP: '400' })
    expect(stdout).toContain('hit the 400-byte cap')
    expect(stdout).toContain('TRUNCATED')
  })

  test('a file comfortably under its cap gets no truncation warning', () => {
    const { stdout } = run()
    expect(stdout).toContain('bytes of repo orientation')
    expect(stdout).not.toContain('TRUNCATED')
  })

  test('being server-side does not excuse a committed credential literal', () => {
    // Universe's twin of this file (Uniswap/universe#42143) was pulled up in review for saying a
    // hardcoded credential was exposure in one directory while "the same string" in the
    // server-side directory "may be a normal server-side secret reference". That is a
    // location-conditional excuse for the secrets category -- the SOFT form of suppression, which
    // the "do not report" check above does not catch, in the one file that must never carry
    // either form. It was also wrong: being server-side protects values supplied at RUNTIME, not
    // values committed to the repository. Internal is not public, but a literal in git is
    // org-readable, permanent, and in every clone.
    //
    // Whitespace-collapsed: the file is prose and gets rewrapped, so an assertion that depends on
    // where the lines happen to break is a false failure waiting to happen.
    // Universe's own wording (scripts/security-gate-check/security-gate-orientation.md).
    const text = readFileSync(ORIENT_PATH, 'utf8')
    expect(text).toContain('literal vs binding')
    expect(text).toMatch(/literal.{0,40}is a finding wherever it appears/s)
    expect(text).not.toMatch(/normal server-side secret reference/)
    expect(text).not.toMatch(/not by the string/)
  })
})

describe('the sticky comment: one per PR, live while running, sized to the band', () => {
  // Every write to the sticky, in order. The first write on a new PR is a POST; every later one
  // must be a PATCH of that same comment -- that is the whole "one comment per PR" guarantee.
  const writes = (calls: FakeCall[]) =>
    calls.filter(
      (c) =>
        (c.method === 'POST' && c.url.endsWith('/issues/1/comments')) ||
        (c.method === 'PATCH' && /\/issues\/comments\/\d+$/.test(c.url)),
    )
  const bodyOf = (c: FakeCall) => (c.body?.body as string) ?? ''
  const visible = (b: string) => b.replace(/<!--[\s\S]*?-->/g, '')
  const classifier = (risk: string, rationale = 'r', categories: string[] = []) =>
    JSON.stringify({
      content: [{ type: 'text', text: JSON.stringify({ risk, route: 'human', categories, rationale }) }],
    })
  // A head that needs a FRESH classification: a push, and no verdict recorded on it yet.
  const fresh = (extra: Record<string, string> = {}) => ({
    EVENT_ACTION: 'synchronize',
    FAKE_ANTHROPIC_JSON: LOW_CLASSIFIER_RESPONSE,
    FAKE_FILES_JSON: ONE_CHANGED_FILE,
    FAKE_STATUSES_JSON: '[]',
    // Pinned off so the "no job link" case is the same locally and on CI, where the test job's
    // own GITHUB_RUN_ID would otherwise leak into the script's environment.
    GITHUB_RUN_ID: '',
    ...extra,
  })
  const PRIOR_MARKERS = [
    '<!-- security-gate:required risk=low sha=0123456789abcdef0123456789abcdef01234567 team=1 deep=na review=APPROVE dfp=4242 -->',
    '<!-- security-gate:history [{"sha":"0123456","risk":"medium","subject":"first"},{"sha":"89abcde","risk":"low","subject":"second"}] -->',
    '<!-- security-gate:triage auth|previous rationale -->',
  ]
  const PRIOR_COMMENT = JSON.stringify([
    { id: 7, user: { login: 'uniswap-security-gate[bot]' }, body: `${PRIOR_MARKERS.join('\n')}\n### old layout` },
  ])

  test("a PR's first run creates one comment and then only edits it", () => {
    // comment_id() is read ONCE at the top of the script. With several writes per run, a cached
    // "no comment yet" would make the verdict POST a second comment after the running state.
    const w = writes(runGate(fresh()).calls)
    expect(w.length).toBeGreaterThanOrEqual(2)
    expect(w.filter((c) => c.method === 'POST')).toHaveLength(1)
    expect(w[0].method).toBe('POST')
    for (const c of w.slice(1)) expect(c.url).toEndWith('/issues/comments/1')
  })

  test('every version of the comment starts with the marker the next run looks for', () => {
    // own_comments() finds the sticky by this prefix. A version without it would make the next
    // run open a second comment.
    const w = writes(runGate(fresh()).calls)
    for (const c of w) expect(bodyOf(c).startsWith('<!-- security-gate:required')).toBe(true)
  })

  test('a running state edits the existing comment and carries its hidden state forward unchanged', () => {
    const w = writes(runGate(fresh({ FAKE_COMMENTS_JSON: PRIOR_COMMENT })).calls)
    expect(w.filter((c) => c.method === 'POST')).toHaveLength(0)
    const running = bodyOf(w[0])
    expect(w[0].url).toEndWith('/issues/comments/7')
    expect(visible(running)).toContain('⏳ Running')
    // The previous verdict's persisted state, byte for byte: team=1 and dfp=4242 are read back by
    // later runs, and the history is what the "Risk history" table is built from.
    for (const m of PRIOR_MARKERS) expect(running).toContain(m)
    expect(visible(running)).toContain('Previous verdict: <code>low</code> on <code>0123456</code>')
    expect(visible(running)).toContain('Risk history — 2 changes')
  })

  test('a review-state recount never shows a running state', () => {
    // Approvals and review requests reuse the recorded verdict and finish in seconds; flashing
    // "running" on them would be noise. This is a guard, so it also holds on the old script.
    const w = writes(runGate({ GITHUB_RUN_ID: '' }).calls)
    expect(w.length).toBeGreaterThan(0)
    for (const c of w) expect(visible(bodyOf(c))).not.toContain('Running')
  })

  test('a medium that gets a deep review shows each step before the verdict', () => {
    const w = writes(
      runGate(
        fresh({
          FAKE_ANTHROPIC_JSON: classifier('medium', 'medium rationale'),
          FAKE_ANTHROPIC_JSON_AFTER_FIRST: DEEP_REVIEW_WITH_FINDINGS,
        }),
      ).calls,
    ).map((c) => visible(bodyOf(c)))
    const triage = w.findIndex((b) => b.includes('Assessing the latest changes'))
    const deep = w.findIndex((b) => b.includes('so a deep security review is running'))
    expect(triage).toBe(0)
    expect(deep).toBeGreaterThan(triage)
    expect(w[deep]).toContain('| Triage | ✅ Done — `medium` |')
    expect(w.at(-1)).not.toContain('⏳ Running')
    expect(w.at(-1)).toContain('### 🔒 Security gate · ✅ Passes · `medium`')
  })

  test('both statuses link to the job when the run is known, and to nothing otherwise', () => {
    const env = {
      GITHUB_REPOSITORY: 'Uniswap/backend',
      GITHUB_RUN_ATTEMPT: '2',
      GITHUB_RUN_ID: '123456',
      GITHUB_SERVER_URL: 'https://github.com',
    }
    const url = 'https://github.com/Uniswap/backend/actions/runs/123456/attempts/2'
    const r = runGate(fresh(env))
    expect(statusFor(r.calls, 'security-gate')).toMatchObject({ target_url: url })
    expect(statusFor(r.calls, 'review-integrity')).toMatchObject({ target_url: url })
    expect(visible(bodyOf(writes(r.calls)[0]))).toContain(`[View the job ↗](${url})`)
    // Outside Actions: no key at all, rather than an empty or broken link.
    expect(statusFor(runGate(fresh()).calls, 'security-gate')).not.toHaveProperty('target_url')
  })

  test('a low PR gets a one-line verdict with the full assessment collapsed and never cut', () => {
    // The old layout rendered "${rationale:0:1500}", a hard slice that ended mid-word.
    const long = `${'word '.repeat(600)}END-OF-RATIONALE`
    const verdict = bodyOf(
      writes(runGate(fresh({ FAKE_ANTHROPIC_JSON: classifier('low', long, ['code-quality']) })).calls).at(-1)!,
    )
    const shown = visible(verdict)
    expect(shown).toContain('### 🔒 Security gate · ✅ Passes · `low`')
    expect(shown).not.toContain('| **Decision** |')
    expect(shown).toContain('<summary>Full assessment</summary>')
    expect(shown).toContain('END-OF-RATIONALE')
    // The re-run line and the policy footer are unchanged and still last.
    expect(shown.indexOf('Need to re-run this check?')).toBeGreaterThan(shown.indexOf('END-OF-RATIONALE'))
  })

  test('a blocked PR leads with a caution callout and states the decision once', () => {
    const shown = visible(
      bodyOf(
        writes(
          runGate(
            fresh({
              FAKE_ANTHROPIC_JSON: classifier('high', 'high rationale'),
              FAKE_ANTHROPIC_JSON_AFTER_FIRST: DEEP_REVIEW_WITH_FINDINGS,
            }),
          ).calls,
        ).at(-1)!,
      ),
    )
    expect(shown).toContain('### 🔒 Security gate · ⛔ Blocked · `high`')
    expect(shown).toContain('> [!CAUTION]')
    // The callout states the decision, so the table does not repeat it -- printed twice in a
    // row it read as a rendering bug. The deep review still has its row.
    expect(shown.split('Security-team approval required').length - 1).toBe(1)
    expect(shown).not.toContain('| **Decision** |')
    expect(shown).toContain('| **Deep review** |')
  })

  test('model text cannot close the collapsible sections early', () => {
    const shown = visible(
      bodyOf(
        writes(
          runGate(fresh({ FAKE_ANTHROPIC_JSON: classifier('low', 'before </details> <SUMMARY>x</summary> after') })).calls,
        ).at(-1)!,
      ),
    )
    const open = '<summary>Full assessment</summary>'
    const assessment = shown.slice(shown.indexOf(open) + open.length)
    expect(assessment).toContain('before  x after')
    // Nothing between the script's own <summary> and its closing </details> can open or close a
    // section: the injected tags were stripped.
    expect(assessment.slice(0, assessment.indexOf('</details>'))).not.toMatch(/<\/?(details|summary)/i)
  })

  test('an unassessed PR says "Assessment unavailable" exactly once, on every branch', () => {
    // The three unassessed descs carry no "Risk: <band> —" prefix, so the display strip does
    // nothing to them. A callout that added its own "Assessment unavailable." lead-in printed the
    // phrase twice. Covers all three branches so a future change to those strings fails here.
    const cases: Array<[string, Record<string, string>, string]> = [
      ['fail-open', { FAIL_OPEN_ON_UNAVAILABLE: '1' }, '> [!WARNING]'],
      ['fail-closed', { FAIL_OPEN_ON_UNAVAILABLE: '0' }, '> [!CAUTION]'],
      [
        'security-approved',
        {
          FAIL_OPEN_ON_UNAVAILABLE: '0',
          // On the CURRENT head: security_approved() only counts a sign-off made on the exact SHA.
          FAKE_REVIEWS_JSON: JSON.stringify([
            { commit_id: 'abc', id: 5, state: 'APPROVED', user: { login: 'sec-person', type: 'User' } },
          ]),
          SECURITY_APPROVERS: 'sec-person',
        },
        '> [!WARNING]',
      ],
    ]
    for (const [name, env, callout] of cases) {
      // No API key: the classifier never runs, so the band is "unknown".
      const shown = visible(bodyOf(writes(runGate(fresh({ ANTHROPIC_API_KEY: '', ...env })).calls).at(-1)!))
      expect({ name, callout: shown.includes(callout) }).toEqual({ name, callout: true })
      expect({ name, count: shown.split('Assessment unavailable').length - 1 }).toEqual({ name, count: 1 })
    }
  })

  describe("the gate's review is a pointer to the sticky comment", () => {
    // GitHub never changes a review's state, and the gate only submits a new one when its decision
    // changes -- so detail in a review goes stale on the next push, and an old "Approved" carrying
    // its own reasoning reads as current long after it was overtaken. The review now only states
    // the decision it was submitted for (band and commit included) and links to the sticky, which
    // holds the full assessment and is rewritten on every run.
    const reviewBody = (calls: FakeCall[]) =>
      calls
        .filter((c) => c.method === 'POST' && /\/pulls\/1\/reviews$/.test(c.url))
        .map((c) => (c.body?.body as string) ?? '')
        .at(-1)
    // No prior gate review: the harness default already carries an APPROVED one from the gate
    // bot, and the gate rightly submits nothing when its decision has not changed.
    const reviewing = (extra: Record<string, string> = {}) =>
      fresh({ FAKE_REVIEWS_JSON: '[]', GATE_REVIEWS: '1', SECURITY_GATE_APP_TOKEN: 'app-token', ...extra })
    const blocked = () =>
      runGate(
        reviewing({
          FAKE_ANTHROPIC_JSON: classifier('high', 'high rationale'),
          FAKE_ANTHROPIC_JSON_AFTER_FIRST: DEEP_REVIEW_WITH_FINDINGS,
        }),
      ).calls

    test('an approval is exactly one callout naming its band and commit, linking the sticky', () => {
      // Asserted on the WHOLE body, so detail creeping back into the review fails here.
      expect(reviewBody(runGate(reviewing()).calls)?.trim()).toBe(
        '> [!NOTE]\n> **✅ Approved** · `low` on `abc` — see the [full assessment in the security gate comment ↑](https://github.com/Uniswap/universe/pull/1#issuecomment-1)',
      )
    })

    test('a request for changes is a caution pointer; its findings and how to clear it are in the sticky', () => {
      const calls = blocked()
      const review = reviewBody(calls) as string
      expect(review.trim()).toStartWith('> [!CAUTION]\n> **⛔ Changes requested** · `high` on `abc` — see the [full assessment')
      for (const detail of ['Unbounded priority fee', '| Sev |', 'To clear this', 'Was this finding useful?']) {
        expect(review).not.toContain(detail)
      }
      const sticky = visible(stickyBody(calls))
      expect(sticky).toContain('<summary>Findings — 1 finding(s), 1 blocking</summary>')
      expect(sticky).toContain('Unbounded priority fee')
      expect(sticky).toContain('**To clear this:**')
    })

    test('links the EXISTING sticky on a PR that already has one', () => {
      const body = reviewBody(runGate(reviewing({ FAKE_COMMENTS_JSON: PRIOR_COMMENT })).calls)
      expect(body).toContain('#issuecomment-7)')
    })

    test('with no sticky yet, says where to look rather than linking to nothing', () => {
      // First-ever run with the classifier unavailable: no running state is posted, so the review
      // is submitted before the sticky exists.
      const body = reviewBody(
        runGate(reviewing({ ANTHROPIC_API_KEY: '', SECURITY_APPROVERS: 'sec-person',
          FAKE_REVIEWS_JSON: JSON.stringify([
            { commit_id: 'abc', id: 5, state: 'APPROVED', user: { login: 'sec-person', type: 'User' } },
          ]) })).calls,
      )
      expect(body).toBeDefined()
      expect(body).toContain('full assessment in the security gate comment on this PR')
      expect(body).not.toContain('#issuecomment-')
    })

    describe('findings survive a run that recovers the deep review instead of re-running it', () => {
      // An approval or `/gate re-run` on an unchanged head reuses the recorded verdict, so no deep
      // review runs and the table cannot be rebuilt. Now that the findings live ONLY in the sticky,
      // rewriting it without them would drop them from the PR entirely.
      const SECTION =
        '<!-- security-gate:findings -->\n<details>\n<summary>Findings — 1 finding(s), advisory</summary>\n\nCARRIED-FINDING\n\n</details>\n<!-- /security-gate:findings -->'
      const priorFor = (sha: string) =>
        JSON.stringify([
          { id: 7, user: { login: 'uniswap-security-gate[bot]' }, body:
            `<!-- security-gate:required risk=medium sha=${sha} team=0 deep=changes_required review=APPROVE dfp=1 -->\n### old\n\n${SECTION}\n` },
        ])
      // The verdict recorded for THIS head, so the band and the deep review are recovered.
      const recovered = (sha: string) =>
        runGate(
          fresh({
            FAKE_COMMENTS_JSON: priorFor(sha),
            FAKE_STATUSES_JSON: JSON.stringify([
              { context: 'security-gate',
                description: 'Risk: medium — passes, findings advisory · deep review noted (1 findings, 1 advisory).' },
            ]),
          }),
        )

      test('carried forward from a sticky written for this same head', () => {
        const r = recovered('abc')
        expect(r.stdout).toContain('deep-review: recovered verdict=changes_required')
        expect(stickyBody(r.calls)).toContain(SECTION)
      })

      test('NOT carried from a sticky written for an older head', () => {
        // Findings for older code must never be shown against new code.
        const sticky = stickyBody(recovered('0123456789abcdef0123456789abcdef01234567').calls)
        expect(sticky).toContain('<!-- security-gate:required')
        expect(sticky).not.toContain('CARRIED-FINDING')
      })
    })
  })

  describe('risk history is recorded from the first verdict', () => {
    // The history marker was EMPTY on every PR. `jq -e` on empty input exits 0 on jq 1.6 (Ubuntu
    // 22.04, the runners' version) but 4 on jq 1.7, so prior_history() printed "" instead of "[]"
    // and the append ran on nothing. These pass on jq 1.7 either way -- they bite on the runner's
    // jq 1.6, which is what CI's test job uses too.
    const historyOf = (b: string) => b.match(/<!-- security-gate:history (.*?) -->/)?.[1] ?? ''

    test('a PR with no history yet starts one', () => {
      const h = historyOf(bodyOf(writes(runGate(fresh()).calls).at(-1)!))
      expect(JSON.parse(h)).toMatchObject([{ risk: 'low', sha: 'abc' }])
    })

    test('a sticky left with an EMPTY history marker by the bug recovers on its next verdict', () => {
      // Exactly what every live PR carries today: `<!-- security-gate:history  -->`.
      const emptied = JSON.stringify([
        { id: 7, user: { login: 'uniswap-security-gate[bot]' }, body:
          '<!-- security-gate:required risk=low sha=0123456789abcdef0123456789abcdef01234567 team=0 deep=na review=APPROVE dfp=0 -->\n' +
          '<!-- security-gate:history  -->\n### old' },
      ])
      const h = historyOf(bodyOf(writes(runGate(fresh({ FAKE_COMMENTS_JSON: emptied })).calls).at(-1)!))
      expect(JSON.parse(h)).toMatchObject([{ risk: 'low' }])
    })

    test('a change in risk renders the Risk history table', () => {
      const prior = JSON.stringify([
        { id: 7, user: { login: 'uniswap-security-gate[bot]' }, body:
          '<!-- security-gate:required risk=trivial sha=0123456789abcdef0123456789abcdef01234567 team=0 deep=na review=APPROVE dfp=0 -->\n' +
          '<!-- security-gate:history [{"sha":"0123456","risk":"trivial","subject":"first"}] -->\n### old' },
      ])
      const shown = visible(
        bodyOf(
          writes(
            runGate(
              fresh({
                FAKE_ANTHROPIC_JSON: classifier('high', 'high rationale'),
                FAKE_ANTHROPIC_JSON_AFTER_FIRST: DEEP_REVIEW_WITH_FINDINGS,
                FAKE_COMMENTS_JSON: prior,
              }),
            ).calls,
          ).at(-1)!,
        ),
      )
      expect(shown).toContain('<summary>Risk history — 2 changes</summary>')
      expect(shown).toContain('| `abc` | `high` | from `trivial` |')
    })
  })

  test('no categories means no empty "Areas" label', () => {
    // With no categories $cats was a single space, which passed `[ -n ]` and rendered "Areas:"
    // followed by nothing -- in both the compact and the card layouts.
    for (const risk of ['low', 'high']) {
      const shown = visible(
        bodyOf(
          writes(
            runGate(
              fresh({
                FAKE_ANTHROPIC_JSON: classifier(risk, 'rationale'),
                FAKE_ANTHROPIC_JSON_AFTER_FIRST: DEEP_REVIEW_WITH_FINDINGS,
              }),
            ).calls,
          ).at(-1)!,
        ),
      )
      expect(shown).not.toContain('Areas')
    }
  })
})

describe('a PR with no diff against its base is trivial without the model', () => {
  // Committing a change and then reverting it -- or applying a suggestion that undoes the PR --
  // leaves a head that merges nothing. The file collector reads an empty list as an API anomaly
  // and fails closed, so such a PR showed "Assessment unavailable" and kept the gate's old
  // request for changes. It is judged here instead, but only on two signals bound to this head.
  const EMPTY_PR = { head: { sha: 'abc' }, base: { sha: 'def' }, changed_files: 0, additions: 0, deletions: 0 }
  const run = (extra: Record<string, string> = {}) =>
    runGate({
      EVENT_ACTION: 'synchronize',
      FAKE_STATUSES_JSON: '[]',
      FAKE_PR_JSON: JSON.stringify(EMPTY_PR),
      FAKE_COMPARE_JSON: JSON.stringify({ status: 'ahead', ahead_by: 2, files: [] }),
      // The request for changes the gate posted before the PR was emptied.
      FAKE_REVIEWS_JSON: JSON.stringify([
        { commit_id: 'old', id: 3, state: 'CHANGES_REQUESTED', user: { login: 'uniswap-security-gate[bot]', type: 'Bot' } },
      ]),
      GATE_REVIEWS: '1',
      SECURITY_GATE_APP_TOKEN: 'app-token',
      ...extra,
    })
  const status = (calls: FakeCall[]) =>
    calls.filter((c) => c.method === 'POST' && /\/statuses\/abc$/.test(c.url) && c.body?.context === 'security-gate').at(-1)?.body
  const modelCalled = (calls: FakeCall[]) => calls.some((c) => c.url.includes('api.anthropic.com'))

  test('passes as trivial, says why, and replaces the old request for changes with an approval', () => {
    const { calls, stdout } = run()
    expect(stdout).toContain('triage: empty diff against base — rated trivial without the classifier')
    expect(modelCalled(calls)).toBe(false)
    expect(status(calls)).toMatchObject({ state: 'success', description: 'Risk: trivial — passes (no security approval required).' })
    expect(stickyBody(calls)).toContain('This PR has no changes: its head (abc) has no diff against the base branch')
    const review = calls.filter((c) => c.method === 'POST' && /\/pulls\/1\/reviews$/.test(c.url)).at(-1)?.body
    expect(review?.event).toBe('APPROVE')
  })

  test('is judged even with the classifier unavailable', () => {
    expect(status(run({ ANTHROPIC_API_KEY: '' }).calls)?.description).toBe(
      'Risk: trivial — passes (no security approval required).',
    )
  })

  // Every way a signal can be missing or wrong falls back to the normal path, which reads the empty
  // file list as an anomaly and fails closed (fail-open is pinned off in these tests).
  const fallsBack: [string, Record<string, string>][] = [
    ['the compare lists a changed file', { FAKE_COMPARE_JSON: JSON.stringify({ files: [{ filename: 'a.ts' }] }) }],
    // On the runners' jq 1.6, `jq -e` passes on EMPTY input: an outage must not read as "no changes".
    ['the compare returns nothing', { FAKE_COMPARE_JSON: '' }],
    ['the compare has no files list', { FAKE_COMPARE_JSON: '{}' }],
    ['the PR head has moved on', { FAKE_PR_JSON: JSON.stringify({ ...EMPTY_PR, head: { sha: 'fff' } }) }],
    ['the PR reports a changed file', { FAKE_PR_JSON: JSON.stringify({ ...EMPTY_PR, changed_files: 1 }) }],
    ['the PR read returns nothing', { FAKE_PR_JSON: '' }],
    ['the PR has no base sha', { FAKE_PR_JSON: JSON.stringify({ ...EMPTY_PR, base: {} }) }],
  ]
  for (const [name, extra] of fallsBack) {
    test(`not trusted when ${name}`, () => {
      const { calls, stdout } = run(extra)
      expect(stdout).not.toContain('empty diff against base')
      expect(status(calls)).toMatchObject({
        state: 'failure',
        description: 'Assessment unavailable — security review required (fail-closed).',
      })
    })
  }
})

describe('the sticky leads with a one-sentence assessment', () => {
  // The full rationale is collapsed, so without a takeaway a reader had to expand it to learn
  // anything beyond the band. The classifier now returns a one-sentence summary, shown unfolded.
  const SUMMARY = 'Docs-only change to a private package; no security impact.'
  const classify = (risk: string, summary?: string) =>
    JSON.stringify({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            risk,
            route: 'human',
            categories: [],
            rationale: 'The long reasoning that stays collapsed.',
            ...(summary === undefined ? {} : { summary }),
          }),
        },
      ],
    })
  const run = (extra: Record<string, string> = {}) =>
    runGate({
      EVENT_ACTION: 'synchronize',
      FAKE_FILES_JSON: ONE_CHANGED_FILE,
      FAKE_STATUSES_JSON: '[]',
      FAKE_ANTHROPIC_JSON: classify('low', SUMMARY),
      ...extra,
    })
  const LINE = `**Assessment:** ${SUMMARY}`

  test('a passing PR shows it right under the decision, with the full reasoning still collapsed', () => {
    const sticky = stickyBody(run().calls)
    expect(sticky).toContain(`### 🔒 Security gate · ✅ Passes · \`low\`\n\nPasses (no security approval required).\n\n${LINE}\n`)
    expect(sticky).toContain('<summary>Full assessment</summary>\n\nThe long reasoning that stays collapsed.')
    expect(sticky.indexOf(LINE)).toBeLessThan(sticky.indexOf('<summary>Full assessment</summary>'))
  })

  test('a blocked PR shows it after the callout, before the table', () => {
    const sticky = stickyBody(
      run({
        FAKE_ANTHROPIC_JSON: classify('high', 'Lowers the human-approval floor to zero; bots alone could clear the gate.'),
        FAKE_ANTHROPIC_JSON_AFTER_FIRST: DEEP_REVIEW_WITH_FINDINGS,
      }).calls,
    )
    const callout = sticky.indexOf('> [!CAUTION]')
    const line = sticky.indexOf('**Assessment:** Lowers the human-approval floor to zero; bots alone could clear the gate.')
    expect(callout).toBeGreaterThan(-1)
    expect(line).toBeGreaterThan(callout)
    expect(line).toBeLessThan(sticky.indexOf('| **Deep review** |'))
  })

  test('is recorded in its own marker and survives a run that reuses the verdict', () => {
    // The band is pinned to the SHA, so the classifier does not run again for this head. Without
    // the marker, every later run would rewrite the sticky without the takeaway.
    const first = stickyBody(run().calls)
    expect(first).toContain(`<!-- security-gate:summary ${SUMMARY} -->`)
    const { calls, stdout } = run({
      FAKE_ANTHROPIC_JSON: '',
      FAKE_COMMENTS_JSON: JSON.stringify([{ id: 7, user: { login: 'uniswap-security-gate[bot]' }, body: first }]),
      FAKE_STATUSES_JSON: JSON.stringify([
        { context: 'security-gate', description: 'Risk: low — passes (no security approval required).' },
      ]),
    })
    expect(stdout).toContain('triage: reusing risk=low')
    expect(calls.some((c) => c.url.includes('api.anthropic.com'))).toBe(false)
    expect(stickyBody(calls)).toContain(LINE)
  })

  test('the running state carries the marker, so an interrupted run does not lose it', () => {
    const prior = stickyBody(run().calls)
    // A new push: fresh classification, so a running state is posted first.
    const { calls } = run({
      FAKE_COMMENTS_JSON: JSON.stringify([{ id: 7, user: { login: 'uniswap-security-gate[bot]' }, body: prior }]),
      FAKE_ANTHROPIC_JSON: classify('low', 'Second summary.'),
    })
    const running = calls.find(
      (c) => c.method === 'PATCH' && /\/issues\/comments\/7$/.test(c.url) && String(c.body?.body).includes('Running'),
    )
    expect(running).toBeDefined()
    expect(String(running?.body?.body)).toContain(`<!-- security-gate:summary ${SUMMARY} -->`)
    expect(stickyBody(calls)).toContain('**Assessment:** Second summary.')
  })

  test('absent from a sticky written before it existed: no empty label', () => {
    expect(stickyBody(run({ FAKE_ANTHROPIC_JSON: classify('low') }).calls)).not.toContain('**Assessment:**')
  })

  test('cannot break out of its marker or the card', () => {
    const sticky = stickyBody(
      run({ FAKE_ANTHROPIC_JSON: classify('low', 'ok --> </details><details><summary>fake\nsecond line') }).calls,
    )
    const marker = sticky.split('\n').find((l) => l.startsWith('<!-- security-gate:summary'))
    expect(marker).toBe('<!-- security-gate:summary ok - fake second line -->')
    const shown = sticky.split('\n').find((l) => l.startsWith('**Assessment:**'))
    expect(shown).toBe('**Assessment:** ok - fake second line')
  })

  test('is capped, so a model ignoring "one sentence" cannot flood the card', () => {
    const shown = stickyBody(run({ FAKE_ANTHROPIC_JSON: classify('low', 'x'.repeat(500)) }).calls)
      .split('\n')
      .find((l) => l.startsWith('**Assessment:**'))
    expect(shown).toBe(`**Assessment:** ${'x'.repeat(299)}…`)
  })

  test('the classifier is required to return it', () => {
    const req = run().calls.find((c) => c.url.includes('api.anthropic.com'))?.body
    expect(req?.output_config?.format?.schema?.required).toContain('summary')
    expect(String(req?.system)).toContain('summary: ONE plain sentence of at most 25 words')
  })

  test('an empty diff gets one too', () => {
    const sticky = stickyBody(
      run({
        FAKE_ANTHROPIC_JSON: '',
        FAKE_FILES_JSON: '[]',
        FAKE_PR_JSON: JSON.stringify({ head: { sha: 'abc' }, base: { sha: 'def' }, changed_files: 0, additions: 0, deletions: 0 }),
        FAKE_COMPARE_JSON: JSON.stringify({ files: [] }),
      }).calls,
    )
    expect(sticky).toContain('**Assessment:** No changes against the base branch, so there is nothing to review.')
  })
})

describe('the sticky footer describes the policy the gate actually enforces', () => {
  // Kept from universe's suite: a FOURTH place the policy is written down, after the status
  // description, the review body and the run log. #40789 made medium advisory in the first three
  // and missed this one, so a passing medium PR carried a footer saying it was "blocked until it
  // comes back clean".
  const source = readFileSync(SCRIPT_PATH, 'utf8')

  test('it does not claim medium blocks', () => {
    expect(source).not.toContain('medium gets a deep security review and is blocked')
  })

  test('it says medium findings are advisory', () => {
    expect(source).toMatch(/medium gets a deep security review whose findings are ADVISORY/)
  })
})
