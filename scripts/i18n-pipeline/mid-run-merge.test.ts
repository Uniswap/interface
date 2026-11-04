import { beforeEach, describe, expect, it } from 'bun:test'
/**
 * The translation PR merging while a run is translating. Runs the workflow's
 * own `Commit translations to the translation branch` and `Open or update the
 * translation PR` scripts — extracted from the YAML, not copied — against
 * scratch git repos with a local bare repo standing in for GitHub and a stub
 * `gh` on PATH. Those steps stay inline bash on purpose (the commit step holds
 * the PAT and the signing key and runs nothing but git), so this is the seam
 * that exercises them.
 *
 * The failure being pinned: the run committed on top of the merged PR's old
 * history and opened a new PR on it, which could never merge cleanly again
 * because main carries the same batch as a squash commit.
 */
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const WORKFLOW = '.github/workflows/i18n_generate_translations.yml'
const BRANCH = 'ci/i18n-generate-translations'
const DIR = 'packages/uniswap/src/i18n/locales/translations'
const LOCALE = `${DIR}/es-ES.json`
const REPO = 'test/repo'
const TIMEOUT_MS = 30_000

interface Step {
  name: string
  run: string
  env: Record<string, string>
}

function step(name: string): Step {
  const doc = Bun.YAML.parse(readFileSync(WORKFLOW, 'utf8')) as {
    env: Record<string, string>
    jobs: Record<string, { steps: Array<{ name?: string; run?: string; env?: Record<string, string> }> }>
  }
  const found = Object.values(doc.jobs)
    .flatMap((job) => job.steps)
    .find((s) => s.name === name)
  if (!found?.run) {
    throw new Error(`step not found in ${WORKFLOW}: ${name}`)
  }
  // Literal env only (the hook guards); every `${{ }}` value is the test's to supply.
  const env = Object.fromEntries(
    Object.entries(found.env ?? {})
      .filter(([, v]) => !String(v).includes('${{'))
      .map(([k, v]) => [k, String(v)]),
  )
  return { name, run: found.run, env: { ...doc.env, ...env } }
}

let tmp: string
let remote: string
let seed: string
let globalConfig: string

function sh(cwd: string, cmd: string[], extraEnv: Record<string, string> = {}): string {
  const res = Bun.spawnSync(cmd, {
    cwd,
    env: {
      PATH: process.env.PATH ?? '',
      HOME: tmp,
      GIT_CONFIG_GLOBAL: globalConfig,
      GIT_CONFIG_NOSYSTEM: '1',
      ...extraEnv,
    },
    stdout: 'pipe',
    stderr: 'pipe',
  })
  if (res.exitCode !== 0) {
    throw new Error(`${cmd.join(' ')} failed in ${cwd}: ${new TextDecoder().decode(res.stderr)}`)
  }
  return new TextDecoder().decode(res.stdout).trim()
}

const git = (cwd: string, ...args: string[]): string => sh(cwd, ['git', ...args])

/** One key per line so independent additions merge the way real locale files do. */
function writeLocale(repo: string, entries: Record<string, string>): void {
  mkdirSync(join(repo, DIR), { recursive: true })
  writeFileSync(join(repo, LOCALE), `${JSON.stringify(entries, null, 2)}\n`)
}

function commitLocale(entries: Record<string, string>, message: string): string {
  writeLocale(seed, entries)
  git(seed, 'add', '-A')
  git(seed, 'commit', '-q', '-m', message)
  return git(seed, 'rev-parse', 'HEAD')
}

const remoteSha = (ref: string): string => sh(tmp, ['git', '--git-dir', remote, 'rev-parse', '--verify', '-q', ref])
const remoteLocale = (ref: string): Record<string, string> =>
  JSON.parse(sh(tmp, ['git', '--git-dir', remote, 'show', `${ref}:${LOCALE}`])) as Record<string, string>
const isAncestor = (ancestor: string, ref: string): boolean =>
  Bun.spawnSync(['git', '--git-dir', remote, 'merge-base', '--is-ancestor', ancestor, ref], {
    env: { PATH: process.env.PATH ?? '', GIT_CONFIG_NOSYSTEM: '1' },
  }).exitCode === 0

function parseOutputs(file: string): Record<string, string> {
  return Object.fromEntries(
    readFileSync(file, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]),
  )
}

interface RunResult {
  exitCode: number
  log: string
  outputs: Record<string, string>
}

function runStep(s: Step, cwd: string, env: Record<string, string>, pathPrefix = ''): RunResult {
  expect(s.run, `${s.name} must take its inputs from env, not inline expressions`).not.toContain('${{')
  const output = join(tmp, `output-${Math.random().toString(36).slice(2)}`)
  writeFileSync(output, '')
  const script = join(tmp, 'step.sh')
  writeFileSync(script, s.run)
  const runnerTemp = mkdtempSync(join(tmp, 'runner-'))
  // GitHub's default shell for `run:` on Linux.
  const res = Bun.spawnSync(['bash', '--noprofile', '--norc', '-eo', 'pipefail', script], {
    cwd,
    env: {
      PATH: `${pathPrefix}${process.env.PATH ?? ''}`,
      HOME: tmp,
      GIT_CONFIG_GLOBAL: globalConfig,
      GIT_CONFIG_NOSYSTEM: '1',
      GITHUB_REPOSITORY: REPO,
      GITHUB_OUTPUT: output,
      RUNNER_TEMP: runnerTemp,
      ...s.env,
      ...env,
    },
    stdout: 'pipe',
    stderr: 'pipe',
  })
  return {
    exitCode: res.exitCode,
    log: new TextDecoder().decode(res.stdout) + new TextDecoder().decode(res.stderr),
    outputs: parseOutputs(output),
  }
}

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'i18n-mid-run-merge-'))
  remote = join(tmp, 'remote.git')
  seed = join(tmp, 'seed')
  globalConfig = join(tmp, 'gitconfig')
  const signer = join(tmp, 'fake-gpg')
  writeFileSync(
    signer,
    [
      '#!/usr/bin/env bash',
      'cat >/dev/null',
      "echo '[GNUPG:] SIG_CREATED D 1 8 00 0 0' >&2",
      "printf -- '-----BEGIN PGP SIGNATURE-----\\n\\nstub\\n-----END PGP SIGNATURE-----\\n'",
      '',
    ].join('\n'),
  )
  chmodSync(signer, 0o755)
  writeFileSync(
    globalConfig,
    [
      '[user]',
      '\tname = Test',
      '\temail = test@example.com',
      '[init]',
      '\tdefaultBranch = main',
      // Signed like production (the GPG import sets commit.gpgsign), by a stub signer.
      '[commit]',
      '\tgpgsign = true',
      '[gpg]',
      `\tprogram = ${signer}`,
      // The step pushes to https://github.com/<repo>.git; point that at the bare repo.
      `[url "file://${remote}"]`,
      `\tinsteadOf = https://github.com/${REPO}.git`,
      '',
    ].join('\n'),
  )
  sh(tmp, ['git', 'init', '-q', '--bare', remote])
  sh(tmp, ['git', 'init', '-q', seed])
  git(seed, 'remote', 'add', 'origin', remote)
})

/**
 * main has `a`; the open PR's branch adds `b`. The job checks out main with
 * the branch's locale data restored and then translates `c` — the working
 * tree the commit step sees. Returns the job checkout and the batch commit.
 */
function startRun(): { job: string; batch: string } {
  commitLocale({ a: 'A' }, 'base')
  git(seed, 'push', '-q', 'origin', 'main')
  git(seed, 'checkout', '-q', '-b', BRANCH)
  const batch = commitLocale({ a: 'A', b: 'B' }, 'chore(i18n): translate new strings via AI pipeline')
  git(seed, 'push', '-q', 'origin', BRANCH)
  git(seed, 'checkout', '-q', 'main')

  const job = join(tmp, 'job')
  sh(tmp, ['git', 'clone', '-q', remote, job])
  writeLocale(job, { a: 'A', b: 'B', c: 'C' })
  return { job, batch }
}

/** The PR is squash-merged: main gains the batch's content as a new commit. */
function squashMerge(): string {
  const sha = commitLocale({ a: 'A', b: 'B' }, 'chore(i18n): translate new strings (#1)')
  git(seed, 'push', '-q', 'origin', 'main')
  return sha
}

const commitStep = (): Step => step('Commit translations to the translation branch')
const prStep = (): Step => step('Open or update the translation PR')

describe('commit step: continuing an open PR', () => {
  it(
    'rebuilds the batch on main when the PR squash-merged mid-run',
    () => {
      const { job, batch } = startRun()
      const merged = squashMerge()

      const res = runStep(commitStep(), job, { EXISTING_PR: '1', COMMIT_MEMORY: 'false', SERVICE_ACCOUNT_PAT: 'x' })

      expect(res.exitCode, res.log).toBe(0)
      expect(res.outputs).toMatchObject({ pushed: 'true', rebuilt: 'true' })
      const tip = remoteSha(`refs/heads/${BRANCH}`)
      expect(res.outputs.sha).toBe(tip)
      // One commit on top of the merged main, none of the old branch history.
      expect(remoteSha(`${tip}^`)).toBe(merged)
      expect(isAncestor(batch, tip)).toBe(false)
      expect(remoteLocale(tip)).toEqual({ a: 'A', b: 'B', c: 'C' })
      expect(sh(tmp, ['git', '--git-dir', remote, 'cat-file', 'commit', tip])).toContain('gpgsig')
    },
    TIMEOUT_MS,
  )

  it(
    'recreates the branch from main when the merge also deleted it',
    () => {
      const { job, batch } = startRun()
      const merged = squashMerge()
      git(seed, 'push', '-q', 'origin', '--delete', BRANCH)

      const res = runStep(commitStep(), job, { EXISTING_PR: '1', COMMIT_MEMORY: 'false', SERVICE_ACCOUNT_PAT: 'x' })

      expect(res.exitCode, res.log).toBe(0)
      expect(res.outputs).toMatchObject({ pushed: 'true', rebuilt: 'true' })
      const tip = remoteSha(`refs/heads/${BRANCH}`)
      expect(remoteSha(`${tip}^`)).toBe(merged)
      expect(isAncestor(batch, tip)).toBe(false)
    },
    TIMEOUT_MS,
  )

  it(
    'pushes nothing when everything it translated is already on main',
    () => {
      const { job } = startRun()
      // `c` reached the branch by hand mid-run, and the PR merged with it.
      git(seed, 'checkout', '-q', BRANCH)
      commitLocale({ a: 'A', b: 'B', c: 'C' }, 'fix: translate c by hand')
      git(seed, 'push', '-q', 'origin', BRANCH)
      git(seed, 'checkout', '-q', 'main')
      commitLocale({ a: 'A', b: 'B', c: 'C' }, 'chore(i18n): translate new strings (#1)')
      git(seed, 'push', '-q', 'origin', 'main')
      const before = remoteSha(`refs/heads/${BRANCH}`)

      const res = runStep(commitStep(), job, { EXISTING_PR: '1', COMMIT_MEMORY: 'false', SERVICE_ACCOUNT_PAT: 'x' })

      expect(res.exitCode, res.log).toBe(0)
      expect(res.outputs.pushed).toBe('false')
      expect(remoteSha(`refs/heads/${BRANCH}`)).toBe(before)
    },
    TIMEOUT_MS,
  )

  it(
    'still fast-forwards the branch while the PR is open',
    () => {
      const { job, batch } = startRun()

      const res = runStep(commitStep(), job, { EXISTING_PR: '1', COMMIT_MEMORY: 'false', SERVICE_ACCOUNT_PAT: 'x' })

      expect(res.exitCode, res.log).toBe(0)
      expect(res.outputs.pushed).toBe('true')
      expect(res.outputs.rebuilt).toBeUndefined()
      const tip = remoteSha(`refs/heads/${BRANCH}`)
      expect(isAncestor(batch, tip)).toBe(true)
      expect(remoteLocale(tip)).toEqual({ a: 'A', b: 'B', c: 'C' })
    },
    TIMEOUT_MS,
  )

  it(
    'keeps a commit someone pushed to the open PR mid-run',
    () => {
      const { job } = startRun()
      git(seed, 'checkout', '-q', BRANCH)
      writeFileSync(join(seed, 'HUMAN.md'), 'hand fix\n')
      git(seed, 'add', 'HUMAN.md')
      git(seed, 'commit', '-q', '-m', 'fix: by hand')
      const human = git(seed, 'rev-parse', 'HEAD')
      git(seed, 'push', '-q', 'origin', BRANCH)
      git(seed, 'checkout', '-q', 'main')

      const res = runStep(commitStep(), job, { EXISTING_PR: '1', COMMIT_MEMORY: 'false', SERVICE_ACCOUNT_PAT: 'x' })

      expect(res.exitCode, res.log).toBe(0)
      expect(res.outputs.rebuilt).toBeUndefined()
      expect(isAncestor(human, remoteSha(`refs/heads/${BRANCH}`))).toBe(true)
    },
    TIMEOUT_MS,
  )
})

describe('commit step: fresh batch (no open PR)', () => {
  it(
    'resets a branch whose batch is already on main',
    () => {
      const { job } = startRun()
      const merged = squashMerge()
      git(job, 'checkout', '-q', '--', '.')
      git(job, 'fetch', '-q', 'origin')
      git(job, 'merge', '-q', '--ff-only', 'origin/main')
      writeLocale(job, { a: 'A', b: 'B', c: 'C' })

      const res = runStep(commitStep(), job, { EXISTING_PR: '', COMMIT_MEMORY: 'false', SERVICE_ACCOUNT_PAT: 'x' })

      expect(res.exitCode, res.log).toBe(0)
      expect(remoteSha(`refs/heads/${BRANCH}^`)).toBe(merged)
    },
    TIMEOUT_MS,
  )

  it(
    'refuses to reset a branch carrying content main lacks',
    () => {
      const { job } = startRun()
      const before = remoteSha(`refs/heads/${BRANCH}`)

      const res = runStep(commitStep(), job, { EXISTING_PR: '', COMMIT_MEMORY: 'false', SERVICE_ACCOUNT_PAT: 'x' })

      expect(res.exitCode).toBe(1)
      expect(res.log).toContain('Refusing to reset it')
      expect(remoteSha(`refs/heads/${BRANCH}`)).toBe(before)
    },
    TIMEOUT_MS,
  )
})

describe('PR step: the continued PR is no longer open', () => {
  /** A `gh` that answers the step's calls from env and logs every invocation. */
  function stubGh(): { bin: string; calls: () => string[] } {
    const bin = join(tmp, 'bin')
    mkdirSync(bin, { recursive: true })
    const log = join(tmp, 'gh-calls')
    writeFileSync(log, '')
    writeFileSync(
      join(bin, 'gh'),
      [
        '#!/usr/bin/env bash',
        `printf '%s\\n' "$*" >> '${log}'`,
        'case "$1 $2" in',
        '  "pr list") printf "%s\\n" "${STUB_OPEN_NOW:-}" ;;',
        '  "pr view") printf "%s\\n" "$STUB_OLD_STATE" ;;',
        `  "pr create") echo https://github.com/${REPO}/pull/99 ;;`,
        'esac',
        '',
      ].join('\n'),
    )
    chmodSync(join(bin, 'gh'), 0o755)
    return { bin: `${bin}:`, calls: () => readFileSync(log, 'utf8').split('\n').filter(Boolean) }
  }

  const prEnv = (env: Record<string, string>): Record<string, string> => ({
    GH_TOKEN: 'x',
    EXISTING_PR: '1',
    REBUILT: '',
    BATCH_SHA: 'abc1234',
    ASSIGNEE: '',
    STUB_OPEN_NOW: '',
    STUB_OLD_STATE: 'MERGED',
    ...env,
  })

  it('opens a new PR for a batch the commit step rebuilt on main', () => {
    const gh = stubGh()
    const res = runStep(prStep(), tmp, prEnv({ REBUILT: 'true' }), gh.bin)
    expect(res.exitCode, res.log).toBe(0)
    expect(res.outputs.number).toBe('99')
    expect(gh.calls().some((c) => c.startsWith('pr create'))).toBe(true)
  })

  it('refuses to open a PR on history the merged PR already put on main', () => {
    const gh = stubGh()
    const res = runStep(prStep(), tmp, prEnv({}), gh.bin)
    expect(res.exitCode).toBe(1)
    expect(res.log).toContain('Not opening a PR on it')
    expect(res.log).toContain('abc1234')
    expect(gh.calls().some((c) => c.startsWith('pr create'))).toBe(false)
  })

  it('fails closed when the old PR state cannot be read', () => {
    const gh = stubGh()
    writeFileSync(join(tmp, 'bin', 'gh'), '#!/usr/bin/env bash\n[ "$1 $2" = "pr view" ] && exit 1\nexit 0\n')
    const res = runStep(prStep(), tmp, prEnv({}), gh.bin)
    expect(res.exitCode).toBe(1)
    expect(res.log).toContain('state could not be read')
  })

  it('reopens a batch whose PR was closed without merging', () => {
    const gh = stubGh()
    const res = runStep(prStep(), tmp, prEnv({ STUB_OLD_STATE: 'CLOSED' }), gh.bin)
    expect(res.exitCode, res.log).toBe(0)
    expect(gh.calls().some((c) => c.startsWith('pr create'))).toBe(true)
  })

  it('edits the PR when it is still open', () => {
    const gh = stubGh()
    const res = runStep(prStep(), tmp, prEnv({ STUB_OPEN_NOW: '1' }), gh.bin)
    expect(res.exitCode, res.log).toBe(0)
    expect(res.outputs.number).toBe('1')
    expect(gh.calls().some((c) => c.startsWith('pr create'))).toBe(false)
    expect(gh.calls().some((c) => c.startsWith('pr view'))).toBe(false)
  })
})
