/**
 * Unit tests for the review-queue CLI's non-network helpers (INFRA-3039).
 *
 * Importing `../review-queue.ts` is safe: `main()` is guarded by
 * `import.meta.main`, so the GitHub fetch path never runs under `bun test`.
 * Run with `bun test scripts/tamagui-migration`.
 */
import { describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  fetchLinearAssigneeByIssue,
  isLinearBot,
  parseArgs,
  parsePodByLogin,
  parseTeamRegistry,
  pickClosedBasePr,
  resolveLinearIssueLogin,
  toActor,
  toChecksRollup,
  writeAtomic,
} from '../review-queue.ts'

describe('parseArgs', () => {
  test('no flags: defaults', () => {
    expect(parseArgs([])).toEqual({ noGeneratedAt: false, applyAssignments: false, help: false })
  })

  test('output paths and --no-generated-at parse together', () => {
    expect(parseArgs(['--json', 'queue.json', '--markdown', 'queue.md', '--no-generated-at'])).toEqual({
      json: 'queue.json',
      markdown: 'queue.md',
      noGeneratedAt: true,
      applyAssignments: false,
      help: false,
    })
  })

  test('--apply-assignments sets applyAssignments', () => {
    expect(parseArgs(['--apply-assignments']).applyAssignments).toBe(true)
  })

  test.each(['--help', '-h'])('%s sets help', (flag) => {
    expect(parseArgs([flag]).help).toBe(true)
  })

  test('--json with no value throws (main exits 1)', () => {
    expect(() => parseArgs(['--json'])).toThrow('--json requires a path argument')
  })

  test('--markdown followed by another flag counts as a missing value', () => {
    expect(() => parseArgs(['--markdown', '--json'])).toThrow('--markdown requires a path argument')
  })

  test('unknown flag throws', () => {
    expect(() => parseArgs(['--bogus'])).toThrow('unknown flag: --bogus')
  })
})

describe('writeAtomic', () => {
  const scratch = (): string => mkdtempSync(join(tmpdir(), 'review-queue-writeatomic-'))

  test('renames into place on success, leaving no temp file', () => {
    const dir = scratch()
    try {
      const path = join(dir, 'out.json')
      writeAtomic(path, '{"ok":true}')
      expect(readFileSync(path, 'utf8')).toBe('{"ok":true}')
      expect(readdirSync(dir)).toEqual(['out.json'])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('replaces an existing file on success', () => {
    const dir = scratch()
    try {
      const path = join(dir, 'out.json')
      writeFileSync(path, 'old')
      writeAtomic(path, 'new')
      expect(readFileSync(path, 'utf8')).toBe('new')
      expect(readdirSync(dir)).toEqual(['out.json'])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('on failure the existing output is untouched and the temp file is cleaned up', () => {
    const dir = scratch()
    try {
      // Destination is a non-empty directory: the temp write succeeds but the
      // rename fails, exercising the cleanup + rethrow path.
      const path = join(dir, 'out.json')
      mkdirSync(path)
      writeFileSync(join(path, 'existing.json'), 'precious')
      expect(() => writeAtomic(path, 'clobber')).toThrow()
      expect(readFileSync(join(path, 'existing.json'), 'utf8')).toBe('precious')
      expect(existsSync(`${path}.tmp.${process.pid}`)).toBe(false)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('parseTeamRegistry', () => {
  test('undefined env yields empty maps', () => {
    expect(parseTeamRegistry(undefined)).toEqual({ slackIdByLogin: {}, loginByName: {}, registryLogins: [] })
  })

  test('valid entries map login (exact + lowercased), display name, and the registry login list', () => {
    const raw = JSON.stringify([
      { githubLogin: 'CharlieVance', slackUserId: 'U123', name: 'Charlie Vance' },
      { githubLogin: 'alice', slackUserId: 'U456' },
    ])
    expect(parseTeamRegistry(raw)).toEqual({
      slackIdByLogin: { CharlieVance: 'U123', charlievance: 'U123', alice: 'U456' },
      loginByName: { 'charlie vance': 'CharlieVance' },
      registryLogins: ['CharlieVance', 'alice'],
    })
  })

  test('entries missing slackUserId or githubLogin skip the maps; a login-only entry still gates assign-back', () => {
    const raw = JSON.stringify([{ githubLogin: 'bob' }, { slackUserId: 'U789' }])
    expect(parseTeamRegistry(raw)).toEqual({ slackIdByLogin: {}, loginByName: {}, registryLogins: ['bob'] })
  })

  test('invalid JSON throws', () => {
    expect(() => parseTeamRegistry('not json')).toThrow()
  })

  test('non-array JSON throws the shape error', () => {
    expect(() => parseTeamRegistry('{"githubLogin":"alice"}')).toThrow('TEAM_REGISTRY must be a JSON array')
  })
})

describe('parsePodByLogin', () => {
  test('undefined env yields an empty map', () => {
    expect(parsePodByLogin(undefined)).toEqual({})
  })

  test('valid object parses', () => {
    expect(parsePodByLogin('{"alice":"swap-fe","bob":"wallet-fe"}')).toEqual({ alice: 'swap-fe', bob: 'wallet-fe' })
  })

  test('invalid JSON throws', () => {
    expect(() => parsePodByLogin('{oops')).toThrow()
  })

  test('array JSON throws the shape error', () => {
    expect(() => parsePodByLogin('["alice"]')).toThrow('POD_BY_LOGIN must be a JSON object')
  })
})

describe('pickClosedBasePr (closed-base resolution prefers a merged node)', () => {
  test('a merged PR wins over a more recently updated closed-unmerged sibling', () => {
    // Nodes arrive UPDATED_AT DESC: a late comment on a closed Graphite
    // sibling must not make the merged base resolve merged:false.
    expect(
      pickClosedBasePr([
        { number: 36755, merged: false },
        { number: 35388, merged: true },
      ]),
    ).toEqual({ number: 35388, merged: true })
  })

  test('the first merged node wins when several merged', () => {
    expect(
      pickClosedBasePr([
        { number: 3, merged: false },
        { number: 2, merged: true },
        { number: 1, merged: true },
      ]),
    ).toEqual({ number: 2, merged: true })
  })

  test('no merged node: falls back to the most recently updated closed PR', () => {
    expect(
      pickClosedBasePr([
        { number: 9, merged: false },
        { number: 8, merged: false },
      ]),
    ).toEqual({ number: 9, merged: false })
  })

  test('no nodes yields undefined (base stays unresolved -> stackWaiting verify)', () => {
    expect(pickClosedBasePr([])).toBeUndefined()
  })
})

describe('toChecksRollup', () => {
  test.each([
    ['SUCCESS', 'success'],
    ['FAILURE', 'failure'],
    ['ERROR', 'failure'],
    ['PENDING', 'pending'],
    ['EXPECTED', 'pending'],
  ] as const)('%s -> %s', (state, rollup) => {
    expect(toChecksRollup(state)).toBe(rollup)
  })

  test('missing rollup (no CI on the head commit) is unknown', () => {
    expect(toChecksRollup(undefined)).toBe('unknown')
  })

  test('unrecognized state is unknown', () => {
    expect(toChecksRollup('SOMETHING_NEW')).toBe('unknown')
  })
})

describe('isLinearBot', () => {
  test('app/agent users are bots', () => {
    expect(isLinearBot({ name: 'Some Agent', email: 'agent@linear.app', app: true })).toBe(true)
  })

  test('the dispatch bot is a plain member (app false) but still detected via the documented list', () => {
    expect(isLinearBot({ name: 'thebotfather@uniswap.org', email: 'thebotfather@uniswap.org', app: false })).toBe(true)
  })

  test('a regular engineer is not a bot', () => {
    expect(isLinearBot({ name: 'Charlie Bachmeier', email: 'charlie.bachmeier@uniswap.org', app: false })).toBe(false)
  })
})

describe('resolveLinearIssueLogin (assignee-if-human else creator)', () => {
  const charlie = { name: 'Charlie Bachmeier', email: 'charlie.bachmeier@uniswap.org', app: false }
  const rossy = { name: 'JM Rossy', email: 'jm.rossy@uniswap.org', app: false }
  const bot = { name: 'thebotfather@uniswap.org', email: 'thebotfather@uniswap.org', app: false }

  test('a human assignee wins over the creator', () => {
    expect(resolveLinearIssueLogin({ assignee: rossy, creator: charlie })).toBe('jmrossy')
  })

  test('a BOT assignee falls back to the human creator (dispatch-created issues)', () => {
    expect(resolveLinearIssueLogin({ assignee: bot, creator: charlie })).toBe('cbachmeier')
  })

  test('no assignee falls back to the human creator', () => {
    expect(resolveLinearIssueLogin({ assignee: null, creator: charlie })).toBe('cbachmeier')
  })

  test('bot creator and no human assignee resolves to null', () => {
    expect(resolveLinearIssueLogin({ assignee: null, creator: bot })).toBeNull()
  })

  test('an unmapped human is recorded by name only — the email never reaches the world-readable summary', () => {
    const unmapped = new Set<string>()
    const stranger = { name: 'New Person', email: 'new.person@uniswap.org', app: false }
    expect(resolveLinearIssueLogin({ assignee: stranger, creator: charlie }, unmapped)).toBeNull()
    expect([...unmapped]).toEqual(['New Person'])
  })
})

describe('fetchLinearAssigneeByIssue (per-batch failure containment)', () => {
  // 26 ids = two batches at LINEAR_BATCH_SIZE 25: INFRA-1000..1024, then INFRA-1025.
  const ids = Array.from({ length: 26 }, (_, index) => `INFRA-${1000 + index}`)

  test('a failed batch is skipped and logged; the other batch keeps its results — never throws', async () => {
    const originalFetch = globalThis.fetch
    const originalConsoleError = console.error
    const stderrLines: string[] = []
    try {
      console.error = (...args: unknown[]): void => {
        stderrLines.push(args.map(String).join(' '))
      }
      globalThis.fetch = (async (_url: unknown, init?: { body?: unknown }): Promise<Response> => {
        const body = String(init?.body)
        if (body.includes('INFRA-1000')) {
          // First batch: one deleted/typo'd id nulls `data` for the whole
          // batch (Linear's `issue(id:)` is non-nullable).
          return new Response(JSON.stringify({ data: null, errors: [{ message: 'Entity not found: Issue' }] }), {
            status: 200,
          })
        }
        return new Response(
          JSON.stringify({
            data: {
              i0: {
                identifier: 'INFRA-1025',
                assignee: { name: 'Charlie Bachmeier', email: 'charlie.bachmeier@uniswap.org', app: false },
                creator: null,
              },
            },
          }),
          { status: 200 },
        )
      }) as typeof fetch
      const result = await fetchLinearAssigneeByIssue('lin_api_test', ids, new Set())
      expect(result).toEqual({ 'INFRA-1025': 'cbachmeier' })
      expect(stderrLines.join('\n')).toContain('INFRA-1000..INFRA-1024')
    } finally {
      globalThis.fetch = originalFetch
      console.error = originalConsoleError
    }
  })
})

describe('toActor', () => {
  test('null author (deleted account) becomes ghost User', () => {
    expect(toActor(null)).toEqual({ login: 'ghost', type: 'User' })
  })

  test('Bot typename is detected', () => {
    expect(toActor({ login: 'claude', __typename: 'Bot' })).toEqual({ login: 'claude', type: 'Bot' })
  })

  test('User typename stays User', () => {
    expect(toActor({ login: 'alice', __typename: 'User' })).toEqual({ login: 'alice', type: 'User' })
  })

  test('other typenames (Mannequin, EnterpriseUserAccount) fall back to User', () => {
    expect(toActor({ login: 'someone', __typename: 'Mannequin' })).toEqual({ login: 'someone', type: 'User' })
  })
})
