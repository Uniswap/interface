import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
// @vitest-environment jsdom
/**
 * Behavior contract for the network-selector compat (INFRA-3021 dropdown
 * set): the legacy `NetworkFilterV2.web` runtime semantics on the
 * popover-compat + option-list-compat composition — controlled open/close,
 * the displayed-chain arithmetic, selection closing the popover, search
 * clear-on-close, tier sections — plus the structural improvements that must
 * hold (NO hand-rolled viewport clamp listeners, positioner-driven
 * max-height, telemetry adapter seam).
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps, ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import {
  NETWORK_SELECTOR_LIST_MAX_HEIGHT_CLASS_NAME,
  NetworkSelectorCompat,
} from '../../../../mycelium/src/network-selector-compat'
import { NETWORK_SELECTOR_PARITY_EXCLUSIONS } from './exclusions'

afterEach(cleanup)

const TRIGGER_TESTID = 'tokens-network-filter-trigger'
const INPUT_SELECTOR = '[data-slot="option-list-search-input"]'
const ROW_SELECTOR = '[data-slot="option-row-compat"]'
const POSITIONER_SELECTOR = '[data-slot="adaptive-popover-positioner"]'

const CHAIN_LABELS: Record<number, { label: string; keywords: string[] }> = {
  1: { label: 'Ethereum', keywords: ['ethereum'] },
  10: { label: 'Optimism', keywords: ['optimism'] },
  42161: { label: 'Arbitrum', keywords: ['arbitrum'] },
}

function getChainDisplay(chainId: number): { label: string; keywords: string[]; logo: ReactNode } {
  const entry = CHAIN_LABELS[chainId] ?? { label: `Chain ${chainId}`, keywords: [] }
  return { ...entry, logo: <i data-testid={`chain-logo-${chainId}`} /> }
}

type SelectorProps = Partial<ComponentProps<typeof NetworkSelectorCompat>>

function renderSelector(props: SelectorProps = {}): ReturnType<typeof render> {
  return render(
    <NetworkSelectorCompat
      chainIds={[1, 10, 42161]}
      selectedChain={null}
      includeAllNetworks
      getChainDisplay={getChainDisplay}
      onPressChain={() => undefined}
      {...props}
    />,
  )
}

function openSelector(): void {
  fireEvent.click(screen.getByTestId(TRIGGER_TESTID))
}

function visibleRowLabels(): string[] {
  return [...document.querySelectorAll(ROW_SELECTOR)].map((row) => row.textContent)
}

describe('NetworkSelectorCompat — open/close + content (NetworkFilterV2 parity)', () => {
  it('renders only the trigger while closed, and the searchable list when opened', () => {
    renderSelector()
    expect(document.querySelector(INPUT_SELECTOR)).toBeNull()
    openSelector()
    expect(document.querySelector(INPUT_SELECTOR)).toBeTruthy()
    expect(visibleRowLabels()).toEqual(['All networks', 'Ethereum', 'Optimism', 'Arbitrum'])
  })

  it('omits the All-networks row when includeAllNetworks is not set', () => {
    renderSelector({ includeAllNetworks: undefined })
    openSelector()
    expect(visibleRowLabels()).toEqual(['Ethereum', 'Optimism', 'Arbitrum'])
  })

  it('selecting a chain calls onPressChain and closes; the All-networks row passes null', () => {
    const onPressChain = vi.fn()
    renderSelector({ onPressChain })
    openSelector()
    fireEvent.click(screen.getByText('Optimism'))
    expect(onPressChain).toHaveBeenCalledWith(10)
    expect(document.querySelector(INPUT_SELECTOR)).toBeNull()
    openSelector()
    fireEvent.click(screen.getByText('All networks'))
    expect(onPressChain).toHaveBeenCalledWith(null)
  })

  it('marks the selected chain row (checkmark) and rotates the trigger chevron while open', () => {
    renderSelector({ selectedChain: 10 })
    const chevron = document.querySelector('[data-slot="trigger-chevron"]') as HTMLElement
    expect(chevron).toBeTruthy()
    const closedClassName = chevron.getAttribute('class') ?? ''
    openSelector()
    const openClassName =
      (document.querySelector('[data-slot="trigger-chevron"]') as HTMLElement).getAttribute('class') ?? ''
    expect(openClassName).not.toBe(closedClassName)
    const selectedRow = screen.getByText('Optimism').closest('[data-slot="option-row-compat"]') as HTMLElement
    expect(selectedRow.querySelector('[data-slot="option-row-check"]')).toBeTruthy()
    expect(selectedRow.getAttribute('aria-selected')).toBe('true')
  })

  it('search filters the chains and the query clears on close (legacy clear-on-close)', () => {
    renderSelector()
    openSelector()
    const input = document.querySelector(INPUT_SELECTOR) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'arb' } })
    expect(visibleRowLabels()).toEqual(['Arbitrum'])
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(document.querySelector(INPUT_SELECTOR)).toBeNull()
    openSelector()
    expect(visibleRowLabels()).toEqual(['All networks', 'Ethereum', 'Optimism', 'Arbitrum'])
  })

  it('renders tier sections from tieredOptions with their headers', () => {
    renderSelector({
      tieredOptions: {
        withBalances: [{ chainId: 10, label: 'Optimism', balanceUSD: 42 }],
        otherNetworks: [
          { chainId: 1, label: 'Ethereum', balanceUSD: 0 },
          { chainId: 42161, label: 'Arbitrum', balanceUSD: 0 },
        ],
      },
    })
    openSelector()
    const headers = [...document.querySelectorAll('[data-slot="option-list-section-header"]')].map((h) => h.textContent)
    expect(headers).toEqual(['Your balances', 'Other networks'])
    expect(visibleRowLabels()).toEqual(['All networks', 'Optimism', 'Ethereum', 'Arbitrum'])
  })

  it('displays the trigger logo for selectedChain ?? (includeAllNetworks ? null : defaultChainId)', () => {
    renderSelector({ selectedChain: 42161 })
    expect(screen.getByTestId('chain-logo-42161')).toBeTruthy()
    cleanup()
    renderSelector({ includeAllNetworks: undefined, defaultChainId: 1 })
    expect(screen.getByTestId('chain-logo-1')).toBeTruthy()
    cleanup()
    // All-networks display state: no single-chain logo.
    renderSelector()
    expect(screen.queryByTestId('chain-logo-1')).toBeNull()
  })

  it('renders the trigger tooltip label as title + aria-label (gated tooltip stand-in, ledgered)', () => {
    renderSelector({ selectedChain: 1, triggerTooltipLabel: 'Ethereum' })
    const trigger = screen.getByTestId(TRIGGER_TESTID)
    expect(trigger.getAttribute('title')).toBe('Ethereum')
    expect(trigger.getAttribute('aria-label')).toBe('Ethereum')
  })
})

describe('NetworkSelectorCompat — the clamp replacement (the #36826 bug-class killer)', () => {
  it('the compat sources hand-roll NO viewport measurement or breakpoint logic (positioner owns it)', () => {
    // The Base UI positioner legitimately tracks scroll/resize to stay
    // anchored (the very behavior whose hand-rolled version regressed in the
    // legacy stack); what must never come back is COMPONENT-level viewport
    // math — measuring, breakpoint guessing, or clamp listeners.
    const mycelium = join(dirname(fileURLToPath(import.meta.url)), '../../../../mycelium/src')
    for (const source of [
      'network-selector-compat/NetworkSelectorCompat.tsx',
      'network-selector-compat/compile.ts',
      'option-list-compat/SearchableOptionList.tsx',
    ]) {
      const contents = readFileSync(join(mycelium, source), 'utf8')
      for (const forbidden of [
        'addEventListener',
        'getBoundingClientRect',
        'matchMedia',
        'innerHeight',
        'innerWidth',
      ]) {
        expect(contents, `${source} must not hand-roll viewport logic (${forbidden})`).not.toContain(forbidden)
      }
    }
  })

  it('the list is clamped by the positioner-provided --available-height variable, not a JS measurement', () => {
    renderSelector()
    openSelector()
    expect(NETWORK_SELECTOR_LIST_MAX_HEIGHT_CLASS_NAME).toContain('--available-height')
    const clamped = document.querySelector(`[data-slot="option-list-scroll"]`) as HTMLElement
    expect(clamped.className).toContain(NETWORK_SELECTOR_LIST_MAX_HEIGHT_CLASS_NAME)
    // The popup mounts inside the Base UI positioner (collision avoidance on).
    expect(document.querySelector(POSITIONER_SELECTOR)).toBeTruthy()
  })
})

describe('NetworkSelectorCompat — telemetry adapter seam', () => {
  it('reports opened/closed transitions and selection with previousChainId', () => {
    const telemetryAdapter = {
      onSelectorOpened: vi.fn(),
      onSelectorClosed: vi.fn(),
      onNetworkSelected: vi.fn(),
    }
    renderSelector({ selectedChain: 1, telemetryAdapter })
    openSelector()
    expect(telemetryAdapter.onSelectorOpened).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByText('Arbitrum'))
    expect(telemetryAdapter.onNetworkSelected).toHaveBeenCalledWith({ chainId: 42161, previousChainId: 1 })
    expect(telemetryAdapter.onSelectorClosed).toHaveBeenCalledTimes(1)
  })
})

describe('network-selector-compat platform legs — export parity', () => {
  it('the native leg exports every runtime symbol the web leg exports (bundler-resolution parity)', async () => {
    const [nativeLeg, webLeg] = await Promise.all([
      import('../../../../mycelium/src/network-selector-compat/index.native'),
      import('../../../../mycelium/src/network-selector-compat/index.web'),
    ])
    expect(Object.keys(nativeLeg).sort()).toEqual(Object.keys(webLeg).sort())
    expect(() => (nativeLeg.NetworkSelectorCompat as () => never)()).toThrow(/web-only/)
  })
})

describe('network-selector exclusions ledger', () => {
  it('stays non-empty and documented (no silent deltas)', () => {
    expect(NETWORK_SELECTOR_PARITY_EXCLUSIONS.length).toBeGreaterThan(0)
    for (const exclusion of NETWORK_SELECTOR_PARITY_EXCLUSIONS) {
      expect(exclusion.reason.length).toBeGreaterThan(20)
      expect(exclusion.standIn.length).toBeGreaterThan(20)
    }
  })

  it('flags the gated sheet deferral and the clamp replacement prominently', () => {
    expect(NETWORK_SELECTOR_PARITY_EXCLUSIONS.some((e) => e.area.includes('GATED DEFERRAL'))).toBe(true)
    expect(NETWORK_SELECTOR_PARITY_EXCLUSIONS.some((e) => e.area.includes('#36826'))).toBe(true)
  })
})
