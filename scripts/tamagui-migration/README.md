# tamagui-migration scripts

Tooling supporting the Tamagui -> Tailwind (Mycelium) design-token migration. Grows with each migration task; see the tool list below.

## `drift-ledger.ts`

Independent verifier for color-token parity between the Tamagui theme (`packages/ui/src/theme/color/colors.ts`) and the Tailwind v4 shared palette (`packages/tailwind/css/theme.css`). Run with `bun scripts/tamagui-migration/drift-ledger.ts`; it writes `drift-ledger.json` (gitignored) with one entry per drifted token — `{ token, tamagui, tailwind, status }`, where `token` encodes the theme as `<name>.light` / `<name>.dark` and `status` distinguishes a `missing` Tailwind token from a `mismatch`ed value — and prints a table plus a final count split by status. An empty ledger means the two token sources agree on every color this tool tracks (see the file header for the exact scope and why some tokens are intentionally excluded).

Deliberate design-decision divergence is pinned in `INTENTIONAL_DRIFT` (token + both exact values + a justification string); pinned entries stay visible in the ledger with `status: "intentional"` but don't count as failures, and a pin goes stale (fails again) the moment either side moves off the recorded values. Pass `--check` to exit non-zero when the ledger contains any unpinned drift (CI-friendly once the baseline reaches 0). Note: the script imports the Tamagui theme through the workspace (`ui/src`, which transitively pulls in `@universe/environment`), so it only runs in a fully-installed workspace (`bun install` first) — it is not a standalone script.

## `review-queue.ts` (+ `review-queue/`)

Migration review queue generator (INFRA-3039). Queries GitHub for `is:open label:tamagui-migration` PRs in Uniswap/universe and emits `review-queue.json` plus the markdown rendered onto the ONE pinned Slack artifact in #proj-tamabyebye (canvas, or a pinned message fallback — never a new post). The bucketing/rendering core is pure and fixture-tested (`scripts/tamagui-migration/review-queue/`, run `bun test scripts/tamagui-migration/review-queue`); the CLI entry (`review-queue.ts`, dependency-free: node builtins + fetch) owns GitHub I/O. Refreshed by `.github/workflows/tamagui_review_queue.yml` — which always checks out `main` for execution (so PR-modified scripts never run with `SLACK_REVIEW_QUEUE_TOKEN`); until the generator lands on `main`, workflow runs are green no-ops that note "pending merge to main" in the run summary.

```
bun scripts/tamagui-migration/review-queue.ts --json review-queue.json --markdown review-queue.md
```

Flags: `--json <path>` / `--markdown <path>` write atomically (temp file + rename) — **any failure exits non-zero without touching an existing output file**; `--no-generated-at` pins `metadata.generatedAt`/`footer.updatedAt` to the epoch for byte-identical reruns (it is never `null`); `--apply-assignments` writes each `assignmentPlan` entry back as the PR's GitHub assignee via the **additive** `POST /issues/<n>/assignees` endpoint (existing assignees are never overwritten; every write is logged, failures go to the run summary without failing the run) — without the flag the plan is emitted in the JSON but nothing is written; no output flag prints the JSON to stdout. Env: `GITHUB_TOKEN` (required — missing token fails fast, which is how the workbench Vercel build falls back to its committed snapshot; `--apply-assignments` additionally needs `pull-requests: write` on it), `GITHUB_REPOSITORY` (default `Uniswap/universe`), `LINEAR_API_KEY` (optional — enables the Linear requester step; when unset that step is skipped with a run-summary note, and any Linear API failure is likewise logged to the run summary and skipped — never an error, never a failed refresh), `TEAM_REGISTRY`, `POD_BY_LOGIN` (see below).

### review-queue.json — STABLE INTERFACE for INFRA-2961

The dashboard panel (`labs/workbench/app/lib/review-queue-types.ts` on its PR) mirrors this schema. **Any breaking change (rename, removal, type change, bucket semantics change) requires a `schemaVersion` bump**; additive fields are fine without one.

Top level:

| field | meaning |
|---|---|
| `schemaVersion` | `1` |
| `metadata.tool` | generator path |
| `metadata.generatedAt` | ISO timestamp — ALWAYS a real timestamp string; `null` is reserved by the consumer as its own placeholder marker |
| `metadata.gitCommit` | commit the generator ran from (`GITHUB_SHA` or `git rev-parse HEAD`), else `null` |
| `metadata.label` | `tamagui-migration` |
| `buckets.*` | the five buckets below, each a FLAT array of rows (drafts grouping by requester happens client-side) |
| `footer.podCounts` | open (non-draft, non-excluded) PR count per pod vs `footer.throttle` (3-5) |
| `footer.updatedAt` | staleness stamp source |
| `footer.excludedDoNotMerge` | count of labeled PRs excluded entirely for carrying a `do not merge` label (additive field) |
| `assignmentPlan` | additive field, always present: `{number, login, source}` per unassigned PR whose requester resolved (any non-assignee source) — the assign-back worklist; PRs with an existing assignee never appear, `body`/`linear`-sourced entries require the login to be in TEAM_REGISTRY (fail closed when the registry is unset — titles and bodies are author-controlled), and `author`-sourced entries are dropped when the PR carries INFRA ids Linear did not resolve (so a degraded/skipped Linear run never persists the fallback) |
| `assignmentPlanExclusions` | additive field, always present: `{number, login, source, reason}` per requester resolved but deliberately kept out of the plan (registry spoof gate; author-tier fallback whose INFRA ids Linear skipped or failed to fetch — a Linear-healthy run may still attribute; or author-tier fallback whose INFRA ids Linear resolved to no mappable human — needs manual attribution); excluded PRs still render with their derived requester |

Per-PR row — required by the consumer: `number`, `title`, `url`, `requester`, `createdAt`. Also emitted: `requesterSource`, `updatedAt`, `author`, `baseRef`, `draft`, `checksState` (`success|failure|pending|neutral|unknown`), `reviewers` (human logins only, deduped), `ageDays` (floored whole days), `bucketReason`.

### Requester model

`requester` is the engineer who asked for the PR — a GitHub login string, or `null` when unattributed (surfaced as *needs manual requester assignment*, **never guessed**). Derivation order (`requesterSource`): `assignee` → `body` (a "requested by <name>" line; handles `Requested by **@login**` and the ccr-slack-attribution `_Requested by **Display Name** ·_` form — **both are TEAM_REGISTRY-gated**: display names resolve through registry entries carrying a `name`, and a bare `@login` counts only when the login is in the registry. The PR body is author-controlled, so a body-line login outside TEAM_REGISTRY is **ignored entirely** — it never renders as the requester, never weakens the independent-approval bar, and never enters the assign-back plan; derivation falls through to the later tiers instead) → `linear` (the assignee of the Linear issue named by an INFRA-xxxx identifier — title ids always count, body ids only when introduced by a closing/attribution keyword like `Fixes INFRA-xxxx`, tolerating punctuation or a markdown link between keyword and id: `Fixes: INFRA-xxxx` and `Fixes [INFRA-xxxx](url)` attribute too; bare body mentions and linear.app cross-reference URLs never attribute; needs `LINEAR_API_KEY`) → `author` when the author is human → `unattributed`. An unresolvable body line (unknown display name or non-registry login) carries no signal — derivation falls through to the later tiers (the Linear step, then the human-author fallback) rather than suppressing them. Bot assignees are skipped the same way: the assignee tier takes the first *human* assignee. The merge bar is **one human approval from someone who is not the requester**; the requester's own approval never satisfies it, and opening the PR (leaving draft) is the requester's sign-off.

**Linear sub-rule (assignee-if-human else creator)**: dispatch-created issues are assigned to the BOT account with the requesting engineer as *creator*, so when the Linear issue's assignee is a bot (a Linear app user, or the dispatch bot `thebotfather@uniswap.org` — a plain member account the `app` flag cannot detect, hence the documented `LINEAR_BOT_EMAILS` list in the script) or missing, resolution falls back to the issue's creator when human. Linear users map to GitHub logins via the small documented `GITHUB_LOGIN_BY_LINEAR_EMAIL` map in `review-queue.ts` (entries verified via Linear's `User.gitHubUserId` against the repo's assignable users); a human with no map entry is logged to the run summary as unmapped — the PR stays unattributed rather than guessed.

**Assign-back**: every real workflow run passes `--apply-assignments`, writing each resolved requester back as the PR's GitHub assignee (additive endpoint — an existing assignee is never overwritten), so the queue converges on `assignee` as the source of truth. Only PRs resolving nowhere stay flagged in the canvas.

### Buckets (lifecycle order) and the trap rules

1. `draftsByRequester` — draft PRs (each requester's pipeline awaiting their pre-open pass).
2. `needsIndependentReview` — open, no APPROVED review from a human who is not the requester. The programmatic share-out list; rows render the requester so everyone else knows they qualify.
3. `changesRequested` — a human reviewer's latest review is CHANGES_REQUESTED (also: approved but checks failing — both are back with the session/author).
4. `readyToMerge` — non-requester human approval + checks clean + base is main or the base PR merged.
5. `stackWaiting` — meets 4 except the base branch is another open PR's head, the base PR can't be verified merged, or checks are still pending.

Trap rules (each pinned by a red-first fixture): **bot reviews count for nothing anywhere** — an APPROVED from github-actions/claude/graphite apps never satisfies the bar, and a bot review after a human CHANGES_REQUESTED never flips it; **consumed team review requests carry no signal** — GitHub deletes a team request once a member reviews, so no bucket decision reads `requestedReviewers`; **PENDING (unsubmitted draft) reviews count for nothing** — they carry a null `submittedAt` and are dropped before any bucket or reviewer-list decision (and can never crash the run).

Two hard exclusions (no bucket, no footer pod count):

- `gtmq_*` (Graphite merge-queue) heads are excluded from the queue entirely.
- PRs carrying a `do not merge` label (matched case-insensitively — label casing varies in the wild) are excluded entirely; the footer reports the count (`footer.excludedDoNotMerge`, rendered as `_N utility PR(s) excluded (do not merge)_` when > 0).

**Graphite closed-unmerged caveat**: a base PR reading CLOSED with `merged: false` may be a fast-forward-merge artifact (#35388/#36755 precedent). The queue never calls such a base merged *or* open — the child lands in `stackWaiting` with a "base PR closed unmerged (possible Graphite fast-forward) — verify" reason. When several closed PRs share the base's head branch (Graphite leaves closed-unmerged siblings), resolution prefers a **merged** PR over a more recently updated closed one, so a late comment on a sibling can never flip a merged base to "verify" (or vice versa).

**N+1 note**: closed-base resolution costs one GraphQL round-trip per distinct unresolved base ref — fine at the current ~32 labeled PRs; revisit (batch refs into one aliased query) if stacks multiply.

### Rendering + pods

The markdown renders the five sections in lifecycle order; reviewer/requester mentions resolve via the `TEAM_REGISTRY` repo variable (githubLogin→slackUserId → canvas mention embed `![](@U…)` — canvases do not understand chat-mrkdwn `<@U…>` and show it as raw text; fallback plain `@login`). The footer shows per-pod open-PR counts vs the 3-5 throttle — the pod map comes from the `POD_BY_LOGIN` variable (JSON `{githubLogin: pod}`, logins matched case-insensitively); unmapped logins count under `unknown-pod`, and pods are **never** derived from (consumable) team review requests — plus the "updated HH:MM UTC" stamp and refresh instructions.

### Refresh tiers (one workflow_dispatch)

1. Slack Workflow Builder button → `POST /repos/Uniswap/universe/actions/workflows/tamagui_review_queue.yml/dispatches` with a fine-grained actions-write-only token.
2. "@Claude refresh the migration review queue" in #proj-tamabyebye → the session runs `gh workflow run tamagui_review_queue.yml`.
3. `gh workflow run tamagui_review_queue.yml` / Actions UI. (Plus `pull_request`/`pull_request_review` events on labeled PRs and an hourly weekday cron.)

**Interim manual refresh (until #37206 merges)**: `workflow_dispatch` and the cron only activate once the workflow file is on `main`, so until then re-render by re-running the latest existing run: `gh run rerun <last-run-id>` (find it with `gh run list --workflow tamagui_review_queue.yml --limit 1`).

### One-time setup (escalate to Charlie, don't work around)

- Store the dedicated `migration-review-queue` Slack app's token (scopes: `canvases:write` + `chat:write` only) as the `SLACK_REVIEW_QUEUE_TOKEN` repo secret, and invite that bot to #proj-tamabyebye. The pre-existing `SLACK_BOT_TOKEN` (the read-only users-lookup app, `users:read` only) is **not** used by this workflow — it has neither write scope. Until the secret exists, the render step logs "SLACK_REVIEW_QUEUE_TOKEN not configured yet — skipping Slack render" and exits green.
- Create the canvas in #proj-tamabyebye, pin it, set its ID as the `REVIEW_QUEUE_CANVAS_ID` repo variable.
- If `canvases.edit` ever returns `missing_scope`, the workflow falls back to `chat.update` on a pinned bot message — post that one message once (as the `migration-review-queue` app), pin it, set `REVIEW_QUEUE_MESSAGE_TS` (+ `REVIEW_QUEUE_CHANNEL_ID` if not #proj-tamabyebye's C0BK3TWCWMU). With neither variable set the workflow writes setup instructions to the run summary and exits green.
- Store a Linear API key as the `LINEAR_API_KEY` repo secret to enable the Linear requester step (optional — without it the generator skips the step with a run-summary note and stays green).
- Create the Workflow Builder button with a fine-grained actions-write token (may need workspace perms; fallback is documented in the Linear spec).
- Have the labeling agent backfill PR assignees as requesters on existing tagged PRs (unattributed rows in the canvas are the worklist). The workflow's assign-back (`--apply-assignments`, with `pull-requests: write` — checkout stays pinned to `main` so PR code never runs with that token) keeps new PRs converged after the backfill.

## `generate-tamagui-baseline.ts`

Generates `config/oxlint-plugins/tamagui-baseline.json`, the grandfathered allowlist for the `universe-custom/no-tamagui-styling` oxlint rule (INFRA-2958). Run plain with `bun scripts/tamagui-migration/generate-tamagui-baseline.ts` to rewrite the baseline (e.g. after moving grandfathered code); pass `--check` to verify it is not stale (exits non-zero on drift). Paths in `config/oxlint-plugins/tamagui-migration-exempt-paths.json` are excluded from the scan.

## `tamagui-census.ts`

Frontier census + convertibility JSON (INFRA-2351): scans `apps/` + `packages/` for `tamagui` / `@tamagui/*` / `ui/src` imports and emits a schema-versioned JSON inventory (per-file import kinds, platform split, usage counts, hotspots, convertibility tiers) plus a markdown snapshot — the data source for the frontier dashboard, icon wave, and batch ticket generator. Run with `bun census:tamagui` (or `bun scripts/tamagui-migration/tamagui-census.ts`); pass `--json <path>` / `--summary <path>` to write files and `--no-generated-at` for byte-identical reruns. The `Tamagui census` workflow uploads both as an artifact on every push to `main`. Dependency-free; see the file header for methodology and versioning rules.

## `codemod/`

Conversion codemod (INFRA-2957): whole-import-statement swaps from `ui/src` to `@universe/mycelium`; anything partial — mixed statements, `styled(`, `animation=`, `$group-*`, spreads, re-exports, dynamic imports — routes the file to the manual lane untouched. Ships with an input/expected fixture suite (`bun test scripts/tamagui-migration`). See `codemod/README.md`.

## `ratchet/`

Converted-directory ratchet (INFRA-2957): `ratchet/ratchet.json` lists converted directories; the dangerfile fails any PR that reintroduces a `ui/src` or `tamagui` import under one. Add a directory in the same PR that converts it. See `ratchet/README.md`.
