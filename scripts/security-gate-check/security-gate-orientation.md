# Security gate orientation

What this codebase is, so the gate can judge severity accurately. Read from the protected
default branch and appended to the gate's prompts; a pull request cannot supply its own copy.

**This is not a suppression list.** It never tells the gate to skip anything. For accepted risk —
patterns that look like findings and are not — see `security-gate-context.md` alongside this file.

Keep entries durable. Anything that changes in a sprint does not belong here; it will be stale
before anyone notices, and a stale orientation misleads more than an absent one.

## Adding to this file

**You do not need to be on the security team to write here, and you should not wait for someone
who is.** You know what a change to your own service actually does; the gate only sees a diff.
That gap is what this file exists to close, and the people who can close it are the people who
own the code.

Merging needs a Security-team review, because this text is fed to the model on a privileged run.
Treat that as a wording check, not a debate about your architecture — if an entry describes your
own system, you are the authority on it.

### What helps most

The gate reads a unified diff and nothing else. It is decent at spotting what a change *looks*
like and poor at knowing what it *means here*. Useful entries close that gap:

- **Escalation** — "a change to X reads as routine and is not, because Y." **This is the
  direction the file is thinnest in and the one only you can supply.** Everything currently
  written here helps the gate calm down; almost nothing tells it when to worry more.
- **Invariants** — something that must always hold and that a diff can quietly break.
- **Blast radius** — what a service or flow can actually reach: funds, keys, user data, other
  tenants, another team's system.
- **Sanctioned paths** — "all X goes through Y." This is what lets the gate tell a correct use
  from a bypass, which it otherwise cannot do from a diff.

### What to leave out

- **Anything that tells the gate not to report something.** That is a suppression, it belongs in
  `security-gate-context.md`, and that file requires provenance — a PR, an incident, or a named
  decision. CI rejects mute wording here.
- **Facts that drift** — counts, versions, current flag states, who is on call. A number that
  goes stale is worse than no number, because nothing flags it.
- **Restating the diff.** The gate can read the diff. It cannot read your head.

### Template

```
### <area> — <owning team>

- **<what to watch for>.** <What it reaches or breaks, concretely. Where it lives.>
```

### Examples

Useful, because the mechanism is named and is invisible in a diff:

> - **Anything touching the payout recipient in `x/fees.ts` moves real funds.** It reads as a
>   config change; the value is used unvalidated as the destination address.

Not useful, because there is nothing to act on:

> - **Be careful in the swap package.**

Do not write this — it is a mute, and it belongs in the accepted-risk file with evidence:

> - **Findings in `x/` are usually false positives, so skip them.**

## What this repo is

A monorepo for Uniswap's client surfaces. It handles **user funds and key material**, so
severity anchors higher here than in a typical web codebase: unauthorized signing, key exposure,
approval/allowance manipulation and transaction-parameter tampering are the outcomes that matter
most.

Apps: `web`, `mobile`, `extension`, `dev-portal`, `mission-control`, `cli`.

Two of those have a reachability worth knowing, because it is not guessable from the code:

- **`apps/dev-portal` is externally reachable.** It is the self-serve portal where third parties
  obtain API keys — the same keys the backend's Entry Gateway later trusts as
  `ApiKeyTier.DEV_PORTAL` / `THIRD_PARTY`. So it is both internet-facing *and* a
  credential-issuance surface: authentication, authorization, IDOR and tenancy checks here carry
  full weight. Dev and staging deployments of it also exist; a weakness in one of those is still
  a real deployment, not a test fixture.
- **`apps/mission-control` is an internal tool for Uniswap employees** (confirmed by the
  platform owners; the backend service behind it is documented as VPN-only). Not reachable by
  the anonymous internet. That narrows *who* can reach a flaw — it does not make a flaw acceptable:
  every employee can reach it, and so can anyone who phishes one. Authorization gaps, injection
  and session handling matter here as they would anywhere; only the "exposed to the whole
  internet" framing is inapplicable.

## Trust boundaries

The single most useful thing to know, because it is invisible in a diff:

| path | runs where | implication |
| --- | --- | --- |
| `apps/web/src/**` | user's browser | ships publicly; anything reachable here is readable by anyone |
| `apps/web/functions/**` | **AWS ECS (Node), server-side** | receives secrets at runtime as environment variables — never as committed literals; a leak here crosses a real boundary |
| `apps/extension/**` | browser extension | host permissions and content scripts; extension-specific escalation applies |
| `apps/mobile/**` | user's device | native, with device-local storage |
| `.github/workflows/**` | privileged CI | repository-level credentials |

For secrets specifically, the axis is **literal vs binding**, not which directory it sits in.

- A committed credential **literal** is a finding wherever it appears, `functions/` included.
  A literal in git is readable by anyone who can read this repository, stays in history
  permanently, and is replicated to every clone and CI cache. That holds whatever the repository's
  visibility is today, which is the point: a rule written against current visibility stops being
  true the moment visibility changes, and nothing would flag it. Being server-side protects values
  supplied at runtime; it does nothing for a value written into the repository.
- A **binding** (`env.FOO`, `process.env.FOO`) is the normal and correct pattern in
  `apps/web/functions/`. The same binding under `apps/web/src/` deserves a look, because the
  build inlines its value into the bundle that ships to browsers — a secret can leak there
  without any literal ever being committed.

## Highest-sensitivity packages

- `packages/cryptography` — the deliberate central home for algorithm and primitive choices
  (RNG and hash selection specifically). A change that bypasses this package to use crypto
  directly is more significant than the diff usually looks.
- `packages/embedded-wallet` — passkey/WebAuthn ceremonies, signing, device sessions,
  PIN/OAuth recovery crypto, authenticator management, EIP-7702 delegation.
- `packages/wallet`, `packages/sessions`, `packages/compliance`, `packages/privacy`.

## Security controls that already exist

Named so the gate knows they are present, and so a change that *weakens* one is recognised as
security-relevant rather than cosmetic. Their absence from an unrelated diff is not a finding.

- **CSP** — `apps/web/public/csp.json` (and `staging-csp.json`), rendered into the `<meta http-equiv="Content-Security-Policy">` tag by `apps/web/vite/vite.plugins.ts`.
- **Clickjacking** — `apps/web/functions/frameProtection.ts` sets `frame-ancestors` as an HTTP
  header (it cannot be enforced via a `<meta>` tag). It carries an explicit
  `ALLOWED_FRAME_ANCESTORS` allowlist: **adding an origin there relaxes clickjacking protection
  for that origin** and is a deliberate tradeoff worth flagging.
- **Iframe detection** — `apps/web/src/utils/isIFramed.ts`.

## Areas

Per-area knowledge from the teams that own the code. Empty sections are an invitation, not an
omission — add yours. The teams below are the ones CODEOWNERS shows owning significant surface;
the list is a starting point, not a restriction.

### Swap — @uniswap/swap-fe

*(nothing yet)*

### Consumer engagement — @uniswap/consumer-engagement-fe

*(nothing yet)*

### Extension — owning team

*(nothing yet. The trust-boundary table above notes only that extension-specific escalation
applies; what that means in practice — host permissions, content-script reach, what the extension
can do that the web app cannot — is worth writing down by someone who works on it.)*

### Wallet and embedded wallet

*(nothing yet. `packages/embedded-wallet` is listed above as highest-sensitivity, but the entry
says what it contains, not which changes to it are dangerous.)*

### Dev portal — @uniswap/dev-portal-admins

*(nothing yet. Noted above as externally reachable and credential-issuing; the specific flows
where a mistake widens or leaks a key are not written down.)*

### CI runners and Datadog IaC — @Uniswap/SRE

- **A `runs-on:` label with `pool=` moves the job onto a RunsOn runner in Uniswap's AWS.** That
  runner holds an instance role reachable through IMDS and has VPC Lattice reach into internal
  service networks; GitHub-hosted runners have neither, and the role and egress allowlist are
  defined in `Uniswap/backend` (`packages/infra/aws/runs-on/`).
- **The shared Nx cache is writable only from trusted refs, and the action — not IAM — is what
  enforces that.** `universe-nx-cache-gha-role-prod` is trusted for every branch and PR
  (`repo:Uniswap/universe:*`) with put and delete on the bucket, so the only thing keeping an
  ordinary PR read-only is the mode resolved in `.github/actions/nx_remote_cache/action.yml`.
  Anything that widens that write path — an explicit `mode: read-write`, a new branch pattern
  treated as trusted, or code that runs before the cache key is computed — is a poisoning route
  into every later build, and the action's own comment cites CVE-2025-36852 as why.
- **Deploy workflows assume AWS roles by OIDC from a dedicated RunsOn deploy pool.** A change to
  the role selection or the `if:` conditions in front of it changes which account a PR-triggered
  run can reach.
- **Merging under `packages/datadog-cloud/` deploys to the prod Datadog org on push to `main`**
  with the org Datadog API and App keys from ESC. Monitor stacks are filtered to `*-prod`, but
  dashboard stacks are discovered with a bare `ls` and deploy unfiltered, so a non-`-prod`
  dashboard stack still ships. Monitors page only via an `ep:` tag resolved from ESC, and
  `disablePaging`/`disableSlack` on a prod stack silence a team's alerts with no failing check.

## CI

Exactly three workflows use `pull_request_target`, and all three are deliberate:
`security-gate-check.yml`, `check_pr_title.yml`, `monorepo_cherry_pick_on_label.yml`. A **new**
`pull_request_target` workflow, or one of these gaining a checkout of PR head code, is a
genuine privilege-escalation finding and should be treated as such.
