/**
 * Run with `bun test config/oxlint-plugins/no-wallet-secrets-in-state.test.ts`
 *
 * Colocated tests for `universe-custom/no-wallet-secrets-in-state` (rule module:
 * no-wallet-secrets-in-state.js, registered by universe-custom.js — the harness lints
 * through that registration, i.e. the exact wiring CI uses). There is no ESLint
 * RuleTester in this repo, so these drive the real oxlint binary over generated fixtures.
 */
import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

const REPO_ROOT = join(import.meta.dir, '../..')
const PLUGIN_PATH = join(import.meta.dir, 'universe-custom.js')
const OXLINT_BIN = join(REPO_ROOT, 'node_modules/.bin/oxlint')

interface Diagnostic {
  message: string
}

let fixtureRoot: string

beforeAll(() => {
  fixtureRoot = mkdtempSync(join(tmpdir(), 'no-wallet-secrets-in-state-'))
})

afterAll(() => {
  rmSync(fixtureRoot, { recursive: true, force: true })
})

function lintFixture(source: string, fileName = 'Fixture.tsx'): Diagnostic[] {
  const dir = mkdtempSync(join(fixtureRoot, 'case-'))
  const filePath = join(dir, ...fileName.split('/'))
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, source)

  const configPath = join(dir, '.oxlintrc.json')
  writeFileSync(
    configPath,
    JSON.stringify({
      plugins: [],
      categories: { correctness: 'off' },
      jsPlugins: [PLUGIN_PATH],
      rules: { 'universe-custom/no-wallet-secrets-in-state': 'error' },
    }),
  )

  const result = Bun.spawnSync([OXLINT_BIN, '-c', configPath, '--format', 'json', filePath], {
    cwd: dir,
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const stdout = result.stdout.toString()
  // 0 = clean, 1 = diagnostics found; anything else means oxlint itself failed
  // (e.g. plugin load error), which would let negative cases pass vacuously.
  if (result.exitCode !== 0 && result.exitCode !== 1) {
    throw new Error(`oxlint exited with ${result.exitCode} (stderr: ${result.stderr.toString()})`)
  }
  let parsed: { diagnostics?: Diagnostic[] }
  try {
    parsed = JSON.parse(stdout) as { diagnostics?: Diagnostic[] }
  } catch (error) {
    throw new Error(`oxlint did not emit JSON (stderr: ${result.stderr.toString()})`, { cause: error })
  }
  return (parsed.diagnostics ?? []).filter((d) => /Wallet secret/.test(d.message))
}

describe('no-wallet-secrets-in-state', () => {
  test('fires on a UseMutationResult variables type naming a secret (the original unlock hook)', () => {
    const source = `
import { UseMutationResult, useMutation } from '@tanstack/react-query'
export function useUnlockWithPassword(): UseMutationResult<void, Error, { password: string }> {
  return useMutation({ mutationFn: unlockWallet })
}
`
    expect(lintFixture(source)).toHaveLength(1)
  })

  test('fires on an inline mutationFn whose first parameter is a secret (biometric setup)', () => {
    const source = `
import { useMutation } from '@tanstack/react-query'
export function useSetup() {
  return useMutation({ mutationFn: async (password: string) => { await setup(password) } })
}
`
    expect(lintFixture(source)).toHaveLength(1)
  })

  test('follows a same-file useEvent-wrapped const to its parameter (change password)', () => {
    const source = `
import { useMutation } from '@tanstack/react-query'
import { useEvent } from 'utilities/src/react/hooks'
export function useChange() {
  const changePassword = useEvent(async (newPassword: string) => { await Keyring.changePassword(newPassword) })
  return useMutation({ mutationFn: changePassword, retry: false })
}
`
    expect(lintFixture(source)).toHaveLength(1)
  })

  test('resolves a reused const name by scope, not by whichever declaration comes last', () => {
    const source = `
import { useMutation } from '@tanstack/react-query'
import { useEvent } from 'utilities/src/react/hooks'
export function useChange() {
  const submit = useEvent(async (newPassword: string) => { await Keyring.changePassword(newPassword) })
  return useMutation({ mutationFn: submit, retry: false })
}
export function useRename() {
  const submit = useEvent(async (address: string) => { await rename(address) })
  return useMutation({ mutationFn: submit })
}
`
    const diagnostics = lintFixture(source)
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.message).toContain("'newPassword'")
  })

  test('follows a mutationFn to a function declaration and leaves parameters and imports alone', () => {
    const source = `
import { useMutation } from '@tanstack/react-query'
import { importFromElsewhere } from './elsewhere'
function unlock(password: string) { return Keyring.unlock(password) }
export function useUnlock() {
  return useMutation({ mutationFn: unlock })
}
export function useImported() {
  return useMutation({ mutationFn: importFromElsewhere })
}
export function useFromParam(submit: (address: string) => Promise<void>) {
  return useMutation({ mutationFn: submit })
}
`
    const diagnostics = lintFixture(source)
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.message).toContain("'password'")
  })

  test('fires on destructured parameters and explicit useMutation generics', () => {
    const source = `
import { useMutation } from '@tanstack/react-query'
export function useA() {
  return useMutation({ mutationFn: async ({ mnemonic }: { mnemonic: string }) => importMnemonic(mnemonic) })
}
export function useB() {
  return useMutation<void, Error, { pin: string }>({ mutationFn: submitPin })
}
`
    expect(lintFixture(source)).toHaveLength(2)
  })

  test('fires on mutate / mutateAsync calls carrying a secret', () => {
    const source = `
export function Screen({ mutate, mutateAsync, password }) {
  return <button onClick={() => { mutate({ password }); void mutateAsync(password) }} />
}
`
    expect(lintFixture(source)).toHaveLength(2)
  })

  test('fires on redux payload types', () => {
    const source = `
import { createAction, PayloadAction } from '@reduxjs/toolkit'
export const importAccount = createAction<{ privateKey: string }>('wallet/importAccount')
export const reducers = {
  setPhrase: (state: object, action: PayloadAction<{ seedPhrase: string }>) => state,
}
`
    expect(lintFixture(source)).toHaveLength(2)
  })

  test('fires on qualified type references through namespace imports', () => {
    const source = `
import * as RTK from '@reduxjs/toolkit'
import * as ReactQuery from '@tanstack/react-query'
export const reducers = {
  setPhrase: (state: object, action: RTK.PayloadAction<{ mnemonic: string }>) => state,
}
export function useUnlock(): ReactQuery.UseMutationResult<void, Error, { password: string }> {
  return ReactQuery.useMutation({ mutationFn: unlockWallet })
}
`
    expect(lintFixture(source)).toHaveLength(2)
  })

  test('fires on query keys carrying a secret by identifier or by object key', () => {
    const source = `
import { useQuery } from '@tanstack/react-query'
export function useCheck(password: string, recoveryPhrase: string) {
  useQuery({ queryKey: ['check', password], queryFn: () => check(password) })
  return useQuery({ queryKey: ['verify', { recoveryPhrase }], queryFn: () => verify(recoveryPhrase) })
}
`
    expect(lintFixture(source)).toHaveLength(2)
  })

  test('stays silent on useSecretMutation, secret-free shapes, and look-alike names', () => {
    const source = `
import { useMutation } from '@tanstack/react-query'
import { useSecretMutation } from 'utilities/src/security/useSecretMutation'
export function useUnlock() {
  return useSecretMutation({ mutationFn: (password: string) => unlockWallet({ password }) })
}
export function useOtp() {
  return useMutation({ mutationFn: (code: string) => loginWithCode({ code }) })
}
export function useRemove() {
  return useMutation({ mutationFn: async ({ mnemonicId }: { mnemonicId: string }) => remove(mnemonicId) })
}
export function Screen({ mutate }) {
  return <button onClick={() => mutate({ address: '0xabc', mnemonicId: 'm1' })} />
}
`
    expect(lintFixture(source)).toHaveLength(0)
  })

  test('ignores test files, which legitimately drive mutations with secrets to assert the cache is clean', () => {
    const source = `
export function run(observer) {
  return observer.mutate({ password: 'hunter2' })
}
`
    expect(lintFixture(source, 'SharedQueryClient.test.ts')).toHaveLength(0)
  })
})
