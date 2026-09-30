/**
 * Run with `bun test scripts/security-gate-check/security-gate-check.test.ts`.
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

const WORKFLOW = Bun.YAML.parse(WORKFLOW_SOURCE) as WorkflowConfig
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

const LOW_CLASSIFIER_RESPONSE = JSON.stringify({
  content: [
    {
      type: 'text',
      text: JSON.stringify({ risk: 'low', route: 'auto', categories: [], rationale: 'Low risk.' }),
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
  *"/orgs/Uniswap/teams/security/members?per_page=100")
    printf '%s' "\${FAKE_TEAM_MEMBERS_JSON:-[]}" ;;
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
  *"/graphql"*)
    # The gate reads review threads and resolves superseded ones over GraphQL. A resolve
    # mutation always succeeds; a read returns whatever the case under test supplied.
    if printf '%s' "$body" | grep -q resolveReviewThread; then
      printf '%s' '{"data":{"resolveReviewThread":{"thread":{"id":"T"}}}}'
    else
      printf '%s' "\${FAKE_THREADS_JSON:-}"
    fi ;;
  *"api.anthropic.com"*)
    # The triage classifier and the deep review are two calls to the same endpoint, so a case
    # that needs them to differ supplies the second response separately.
    anthropic_count="$(grep -c 'api.anthropic.com' "$FAKE_GH_LOG")"
    if [ -n "\${FAKE_ANTHROPIC_JSON_AFTER_FIRST:-}" ] && [ "$anthropic_count" -gt 1 ]; then
      printf '%s' "$FAKE_ANTHROPIC_JSON_AFTER_FIRST"
    else
      printf '%s' "\${FAKE_ANTHROPIC_JSON:-{\"content\":[]}}"
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
  // build-once guard, so a shared temp dir lets one test's state satisfy the next one's guard.
  // Locally RUNNER_TEMP is unset and the script falls back to `mktemp -d`, which isolates runs
  // by accident; in CI Actions sets it, every test shares one memo keyed on the same
  // REPO/PR/RUN_ID, and the first resolution result is served to all the others.
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
      FAKE_BLOB_JSON: '{}',
      FAKE_TREE_JSON: '{"message":"Not Found"}',
      FAKE_THREADS_JSON: '',
      FAKE_COMMENTS_JSON: '[]',
      FAKE_FILES_JSON: '[]',
      FAKE_GH_LOG: logPath,
      FAKE_PR_JSON: JSON.stringify({ head: { sha: 'abc' } }),
      FAKE_REQUESTED_JSON: JSON.stringify({ users: [], teams: [] }),
      FAKE_REQUESTED_JSON_AFTER_FIRST: '',
      FAKE_REVIEWS_JSON: JSON.stringify(APPROVED_REVIEWS),
      FAKE_REVIEWS_JSON_AFTER_FIRST: '',
      FAKE_REVIEWS_PAGE_2_JSON: '[]',
      FAKE_STATUSES_JSON: JSON.stringify([
        { context: 'security-gate', description: 'Risk: low — passes (no security approval required).' },
      ]),
      FAKE_TEAM_MEMBERS_JSON: '[]',
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

  test('queues review-state changes behind the PR gate without cancelling it', () => {
    // Asserted by containment: the group must key on the PR, and on a workflow_run event the
    // number lives elsewhere in the payload. A group that resolves empty would put every PR in
    // one bucket and let them cancel each other.
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

  test('a not-security finding is dropped and never reaches the PR', () => {
    const { calls, stdout } = run([
      finding('not-security', 'Reliability: nack loop on retry'),
      finding('injection', 'Command injection via unescaped arg'),
    ])
    expect(stdout).toContain('dropped 1 non-security finding(s) of 2')
    expect(stdout).toContain('findings=1')
    const body = calls
      .filter((call) => call.method === 'POST' && /\/pulls\/1\/reviews$/.test(call.url))
      .map((call) => call.body?.body as string)
      .at(-1)
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
      // Universe's wire format. The advisory wording ('noted' / 'N advisory') arrives with the
      // medium-advisory policy; the parser learns it in the same change that starts writing it.
      FAKE_STATUSES_JSON: priorStatus('Risk: medium — blocked · deep review requested changes (3 findings, 2 blocking).'),
    })
    expect(stdout).toContain('recovered verdict=changes_required findings=3')
    expect(stdout).not.toContain('api.anthropic.com')
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
    // nothing. Asserted on the review body, which is the durable channel — inline anchoring
    // needs the diff-anchors file and is exercised separately.
    const { calls, stdout } = runGate(medium())
    expect(stdout).toMatch(/findings=[1-9]/)
    const body = calls
      .filter((call) => call.method === 'POST' && /\/pulls\/1\/reviews$/.test(call.url))
      .map((call) => call.body?.body as string)
      .at(-1)
    expect(body).toContain('passes, findings advisory')
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

  test('the review body says a finding severity is not the PR band', () => {
    const { calls } = runGate({
      EVENT_ACTION: 'synchronize',
      FAKE_ANTHROPIC_JSON: MEDIUM_CLASSIFIER_RESPONSE,
      FAKE_ANTHROPIC_JSON_AFTER_FIRST: DEEP_REVIEW_WITH_FINDINGS,
      FAKE_FILES_JSON: ONE_CHANGED_FILE,
      FAKE_STATUSES_JSON: '[]',
      GATE_REVIEWS: '1',
      SECURITY_GATE_APP_TOKEN: 'app-token',
    })
    const body = calls
      .filter((call) => call.method === 'POST' && /\/pulls\/1\/reviews$/.test(call.url))
      .map((call) => call.body?.body as string)
      .at(-1)
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

describe('the sticky comment does not contradict itself on medium', () => {
  const sticky = (calls: FakeCall[]) =>
    calls
      .filter((call) => call.method === 'POST' && /\/issues\/(1\/comments|comments\/)/.test(call.url))
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
    expect(visible).toContain('Deep review:')
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
    expect(String(checkout?.with?.['sparse-checkout'])).toContain(
      'scripts/security-gate-check/security-gate-context.md',
    )
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
      expect(prompt).toContain('Trust boundaries')
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
    expect(prompt).not.toContain('Trust boundaries')
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

  test('secrets guidance keys on literal vs binding, not on directory', () => {
    // The first version of this file said a hardcoded credential in apps/web/src/ is exposure
    // while "the same string in apps/web/functions/ may be a normal server-side secret
    // reference", and told the gate to "judge by side of the boundary, not by the string". That
    // is a location-conditional excuse for the secrets category -- the SOFT form of suppression,
    // which the "do not report" check above does not catch, in the one file that must never
    // carry either form. It was also wrong: being server-side protects values supplied at
    // runtime, not values committed to the repository, and a literal in git is readable
    // org-wide and permanent regardless of which directory holds it.
    const text = readFileSync(ORIENT_PATH, 'utf8')
    expect(text).toContain('literal vs binding')
    expect(text).toMatch(/literal.{0,40}is a finding wherever it appears/s)
    expect(text).not.toMatch(/normal server-side secret reference/)
    expect(text).not.toMatch(/not by the string/)
  })
})

describe('the feedback tip rides on findings, not on every review', () => {
  // The tip points at the INLINE comments rather than the review body: one thread per finding is
  // the only granularity at which a reaction means anything, and a 👎 on a summary carrying four
  // findings tells the aggregator nothing about which one was wrong.
  const source = readFileSync(SCRIPT_PATH, 'utf8')

  test('the tip is emitted only when inline comments were attached', () => {
    // Asserted against the source rather than a run: no test in this repo (or backend's) drives
    // build_inline_comments to a non-zero count, so there is no fixture that anchors a finding to
    // a diff line. The guard is what matters -- a tip on a review with no inline threads points
    // at nothing to react to.
    const guarded = /if \[ "\$ncom" -gt 0 \]; then\n\s*printf[^\n]*Was this finding useful?/
    expect(source).toMatch(guarded)
  })

  test('a clean low-risk review does not carry it', () => {
    // No deep review runs below the DEEP_REVIEW_RISKS band, so ncom is 0 and the tip is absent.
    const body = runGate({
      EVENT_ACTION: 'synchronize',
      FAKE_ANTHROPIC_JSON: LOW_CLASSIFIER_RESPONSE,
      FAKE_FILES_JSON: ONE_CHANGED_FILE,
      FAKE_STATUSES_JSON: '[]',
      GATE_REVIEWS: '1',
      SECURITY_GATE_APP_TOKEN: 'app-token',
    })
      .calls.filter((call) => call.method === 'POST' && /\/pulls\/1\/reviews$/.test(call.url))
      .map((call) => call.body?.body as string)
      .filter(Boolean)
      .at(-1)
    expect(body ?? '').not.toContain('Was this finding useful?')
  })
})

describe('the sticky footer describes the policy the gate actually enforces', () => {
  // A FOURTH place the policy is written down, after the status description, the review body
  // and the run log. #40789 made medium advisory in the first three and missed this one, so a
  // passing medium PR carried a footer saying it was "blocked until it comes back clean".
  const source = readFileSync(SCRIPT_PATH, 'utf8')

  test('it does not claim medium blocks', () => {
    expect(source).not.toContain('medium gets a deep security review and is blocked')
  })

  test('it says medium findings are advisory', () => {
    expect(source).toMatch(/medium gets a deep security review whose findings are ADVISORY/)
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
    const { calls, stdout } = runGate(declaring(5, [GA, SG, H(3, 'alice')], { MIN_REVIEWS_ENABLED: '0' }))
    expect(stdout).toContain('decl=none')
    expect(calls.some((call) => call.url.includes('/git/trees/'))).toBe(false)
    expect(statusFor(calls, 'review-integrity')).toMatchObject({ state: 'success' })
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
    const source = readFileSync(SCRIPT_PATH, 'utf8')
    expect(source).toContain('security-gate-min-reviews-$(printf')
    expect(source).toContain('${GITHUB_RUN_ID:-0}')
  })

  test('only exact CODEOWNERS basenames are discovered', () => {
    // endswith("CODEOWNERS") also matches tradingCODEOWNERS, whose derived prefix could win the
    // longest-prefix contest from a non-authoritative file.
    const source = readFileSync(SCRIPT_PATH, 'utf8')
    expect(source).toContain('select((.path=="CODEOWNERS") or (.path|endswith("/CODEOWNERS")))')
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
    expect(source).toContain('The risk band comes from the change as a whole, not from the highest finding below')
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
