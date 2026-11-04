/**
 * Run with `bun test config/oxlint-plugins/import-boundaries.test.ts`
 *
 * Tests for the `swap-ui-views` and `transactions-ui-*` boundaries
 * (universe-custom/import-boundary, config in import-boundaries.json). There is no ESLint RuleTester in this
 * repo, so these drive the real oxlint binary over generated fixtures whose
 * physical paths carry the boundary's markers — the exact wiring CI uses,
 * including the AND-marker matching ("swap tree" AND "/views/").
 */
import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

const REPO_ROOT = join(import.meta.dir, '../..')
const PLUGIN_PATH = join(import.meta.dir, 'universe-custom.js')
const OXLINT_BIN = join(REPO_ROOT, 'node_modules/.bin/oxlint')

const SWAP_VIEWS_DIR = 'packages/uniswap/src/features/transactions/swap/review/views'
const SWAP_ADAPTER_DIR = 'packages/uniswap/src/features/transactions/swap/review'

interface Diagnostic {
  message: string
}

let fixtureRoot: string

beforeAll(() => {
  fixtureRoot = mkdtempSync(join(tmpdir(), 'import-boundaries-'))
})

afterAll(() => {
  rmSync(fixtureRoot, { recursive: true, force: true })
})

function lintFixture({
  source,
  fileDir,
  fileName = 'Fixture.tsx',
  messagePattern = /Swap views/,
}: {
  source: string
  /** Repo-relative directory the fixture pretends to live in (becomes part of the physical path). */
  fileDir: string
  fileName?: string
  /** Keeps only the diagnostics of the boundary under test. */
  messagePattern?: RegExp
}): Diagnostic[] {
  const dir = mkdtempSync(join(fixtureRoot, 'case-'))
  const filePath = join(dir, fileDir, fileName)
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, source)

  const configPath = join(dir, '.oxlintrc.json')
  writeFileSync(
    configPath,
    JSON.stringify({
      plugins: [],
      categories: { correctness: 'off' },
      jsPlugins: [PLUGIN_PATH],
      rules: { 'universe-custom/import-boundary': 'error' },
    }),
  )

  const result = Bun.spawnSync([OXLINT_BIN, '-c', configPath, '--format', 'json', filePath], {
    cwd: dir,
    stdout: 'pipe',
    stderr: 'pipe',
  })
  // 0 = clean, 1 = diagnostics found; anything else means oxlint itself failed
  // (e.g. plugin load error), which would let negative cases pass vacuously.
  if (result.exitCode !== 0 && result.exitCode !== 1) {
    throw new Error(`oxlint exited with ${result.exitCode} (stderr: ${result.stderr.toString()})`)
  }
  let parsed: { diagnostics?: Diagnostic[] }
  try {
    parsed = JSON.parse(result.stdout.toString()) as { diagnostics?: Diagnostic[] }
  } catch (error) {
    throw new Error(`oxlint did not emit JSON (stderr: ${result.stderr.toString()})`, { cause: error })
  }
  return (parsed.diagnostics ?? []).filter((d) => messagePattern.test(d.message))
}

describe('swap-ui-views boundary', () => {
  test('MUST FIRE: a view importing analytics', () => {
    const diagnostics = lintFixture({
      fileDir: SWAP_VIEWS_DIR,
      source: `
import { Trace } from 'uniswap/src/features/telemetry/Trace'

export function SwapDetailsView(): JSX.Element {
  return <Trace logPress />
}
`,
    })
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.message).toContain('POLICIES.md')
  })

  test('MUST FIRE: a view reading a swap store', () => {
    const diagnostics = lintFixture({
      fileDir: SWAP_VIEWS_DIR,
      source: `
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'

export function AmountView(): string {
  return useSwapFormStore((s) => s.exactAmountToken)
}
`,
    })
    expect(diagnostics).toHaveLength(1)
  })

  test('MUST FIRE: a view importing a modal shell, a flag hook, or react-query', () => {
    for (const importLine of [
      `import { Modal } from 'uniswap/src/components/modals/Modal'`,
      `import { useFeatureFlag } from '@universe/gating'`,
      `import { useQuery } from '@tanstack/react-query'`,
      `import { useDispatch } from 'react-redux'`,
    ]) {
      const diagnostics = lintFixture({
        fileDir: SWAP_VIEWS_DIR,
        source: `${importLine}\nexport const x = 1\n`,
      })
      expect(`${importLine}: ${diagnostics.length}`).toBe(`${importLine}: 1`)
    }
  })

  test('MUST FIRE: a dynamic import of a denied module from a view', () => {
    const diagnostics = lintFixture({
      fileDir: SWAP_VIEWS_DIR,
      source: `
export async function load(): Promise<unknown> {
  return import('uniswap/src/features/telemetry/send')
}
`,
    })
    expect(diagnostics).toHaveLength(1)
  })

  test('must NOT fire: presentational imports and type-only uniswap imports are legal in views', () => {
    const diagnostics = lintFixture({
      fileDir: SWAP_VIEWS_DIR,
      source: `
import { useState } from 'react'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'

export function SwapDetailsView({ info }: { info: DerivedSwapInfo }): number {
  const [n] = useState(0)
  return n
}
`,
    })
    expect(diagnostics).toHaveLength(0)
  })

  test('must NOT fire: adapters outside views/ keep their store reads', () => {
    const diagnostics = lintFixture({
      fileDir: SWAP_ADAPTER_DIR,
      source: `
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'

export function useAmount(): string {
  return useSwapFormStore((s) => s.exactAmountToken)
}
`,
    })
    expect(diagnostics).toHaveLength(0)
  })

  test('must NOT fire: a views/ directory outside the swap tree (AND-marker semantics)', () => {
    const diagnostics = lintFixture({
      fileDir: 'packages/uniswap/src/features/portfolio/views',
      source: `
import { Trace } from 'uniswap/src/features/telemetry/Trace'

export function PortfolioView(): JSX.Element {
  return <Trace logPress />
}
`,
    })
    expect(diagnostics).toHaveLength(0)
  })
})

describe('wallet-no-feature-imports boundary', () => {
  const WALLET_DIR = 'apps/web/src/features/wallet/components'
  const WALLET_MESSAGE = /features\/wallet` may not import other features/

  test('MUST FIRE: the wallet feature importing another feature', () => {
    for (const importLine of [
      `import { useUserHasAvailableClaim } from '~/features/claim/hooks'`,
      `import { Thing } from 'features/notifications/WebNotificationToastWrapper'`,
      `import { earn } from '~/features/earn'`,
    ]) {
      const diagnostics = lintFixture({
        fileDir: WALLET_DIR,
        source: `${importLine}\nexport const x = 1\n`,
        messagePattern: WALLET_MESSAGE,
      })
      expect(`${importLine}: ${diagnostics.length}`).toBe(`${importLine}: 1`)
    }
  })

  test('MUST FIRE: a dynamic import of another feature from the wallet feature', () => {
    const diagnostics = lintFixture({
      fileDir: WALLET_DIR,
      source: `
export async function load(): Promise<unknown> {
  return import('~/features/claim/hooks')
}
`,
      messagePattern: WALLET_MESSAGE,
    })
    expect(diagnostics).toHaveLength(1)
  })

  test('must NOT fire: the wallet feature importing itself (exemptImportPrefixes)', () => {
    for (const importLine of [
      `import { useConnectWallet } from '~/features/wallet/hooks/useConnectWallet'`,
      `import { x } from 'features/wallet/components/WalletModal/WalletModal'`,
      `import { y } from '~/features/wallet'`,
    ]) {
      const diagnostics = lintFixture({
        fileDir: WALLET_DIR,
        source: `${importLine}\nexport const x = 1\n`,
        messagePattern: WALLET_MESSAGE,
      })
      expect(`${importLine}: ${diagnostics.length}`).toBe(`${importLine}: 0`)
    }
  })

  test('must NOT fire: other features importing the wallet feature', () => {
    const diagnostics = lintFixture({
      fileDir: 'apps/web/src/features/earn',
      source: `
import { useConnectWallet } from '~/features/wallet/hooks/useConnectWallet'
import { useUserHasAvailableClaim } from '~/features/claim/hooks'
export const x = [useConnectWallet, useUserHasAvailableClaim]
`,
      messagePattern: WALLET_MESSAGE,
    })
    expect(diagnostics).toHaveLength(0)
  })

  test('must NOT fire: a folder whose name only starts with "wallet"', () => {
    const diagnostics = lintFixture({
      fileDir: 'apps/web/src/features/walletConnect',
      source: `import { useUserHasAvailableClaim } from '~/features/claim/hooks'\nexport const x = 1\n`,
      messagePattern: WALLET_MESSAGE,
    })
    expect(diagnostics).toHaveLength(0)
  })
})

describe('web-state-import-denylist boundary', () => {
  const STATE_DIR = 'apps/web/src/state/sagas/transactions'
  const STATE_MESSAGE = /src\/state` must not import from/

  test('MUST FIRE: state importing a page, a feature, a component, a hook or the app shell', () => {
    for (const importLine of [
      `import { useOneClickSwapSetting } from '~/pages/Swap/Swap/settings/OneClickSwap'`,
      `import { paths } from '~/pages'`,
      `import { useConnectWallet } from '~/features/wallet/hooks/useConnectWallet'`,
      `import { Portal } from '~/components/Popups/Portal'`,
      `import { usePrevious } from '~/hooks/usePrevious'`,
      `import { Body } from '~/app/layout/Body'`,
    ]) {
      const diagnostics = lintFixture({
        fileDir: STATE_DIR,
        source: `${importLine}\nexport const x = 1\n`,
        messagePattern: STATE_MESSAGE,
      })
      expect(`${importLine}: ${diagnostics.length}`).toBe(`${importLine}: 1`)
    }
  })

  test('must NOT fire: state importing state, connection or utils', () => {
    const diagnostics = lintFixture({
      fileDir: STATE_DIR,
      source: `
import { useOneClickSwapSetting } from '~/state/oneClickSwap/hooks'
import { useAccount } from '~/connection/hooks/useAccount'
import { popupRegistry } from '~/utils/popups/registry'
export const x = [useOneClickSwapSetting, useAccount, popupRegistry]
`,
      messagePattern: STATE_MESSAGE,
    })
    expect(diagnostics).toHaveLength(0)
  })
})

const TUI = 'packages/transactions-ui/src'
const TUI_MESSAGE = /transactions-ui/

describe('transactions-ui boundaries', () => {
  test('MUST FIRE: a view importing uniswap/src, even as a type', () => {
    const diagnostics = lintFixture({
      fileDir: `${TUI}/common/DetailRow`,
      messagePattern: TUI_MESSAGE,
      source: `
import type { Warning } from 'uniswap/src/components/modals/WarningModal/types'

export function View({ warning }: { warning: Warning }): string {
  return warning.type
}
`,
    })
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.message).toContain('presentational')
  })

  test('MUST FIRE: common/ importing a product folder', () => {
    for (const product of ['swap/Rate/RateRatio', 'lp/Range/RangeRow']) {
      const diagnostics = lintFixture({
        fileDir: `${TUI}/common/DetailRow`,
        messagePattern: TUI_MESSAGE,
        source: `import { X } from '@universe/transactions-ui/src/${product}'\nexport const y = X\n`,
      })
      expect(`${product}: ${diagnostics.length}`).toBe(`${product}: 1`)
      expect(diagnostics[0]?.message).toContain('common/ is shared')
    }
  })

  test('MUST FIRE: a product folder importing another product folder', () => {
    const diagnostics = lintFixture({
      fileDir: `${TUI}/swap/Rate`,
      messagePattern: TUI_MESSAGE,
      source: `import { X } from '@universe/transactions-ui/src/lp/Range/RangeRow'\nexport const y = X\n`,
    })
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.message).toContain('never import each other')
  })

  test('must NOT fire: product folders import common/, common/ imports itself', () => {
    for (const [fileDir, target] of [
      [`${TUI}/swap/Rate`, 'common/DetailRow/DetailRow'],
      [`${TUI}/common/GasRow`, 'common/DetailRow/DetailRow'],
      [`${TUI}/swap/Rate`, 'swap/Slippage/SlippageRow'],
    ] as const) {
      const diagnostics = lintFixture({
        fileDir,
        messagePattern: TUI_MESSAGE,
        source: `import { X } from '@universe/transactions-ui/src/${target}'\nexport const y = X\n`,
      })
      expect(`${fileDir} -> ${target}: ${diagnostics.length}`).toBe(`${fileDir} -> ${target}: 0`)
    }
  })

  test('must NOT fire: adapters in packages/uniswap import the barrel and keep their store reads', () => {
    const diagnostics = lintFixture({
      fileDir: SWAP_ADAPTER_DIR,
      messagePattern: TUI_MESSAGE,
      source: `
import { DetailRow } from '@universe/transactions-ui'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'

export const parts = [DetailRow, useSwapFormStore]
`,
    })
    expect(diagnostics).toHaveLength(0)
  })
})
