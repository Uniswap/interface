/**
 * HookSwap Terminal — B11 command palette (data-bound container).
 *
 * Pixel-perfect ⌘K palette (design handoff screen B11). The PRESENTATION lives in
 * `./CommandPalette` (search header, filter tabs, grouped token/action rows, footer
 * hint bar); THIS file is the controlled DATA CONTAINER that feeds it real data and
 * wires the actions. The parent (TerminalChrome) owns `open`/`onClose` and the
 * ⌘K / search-field click that toggles them — this component is pure UI + data.
 *
 * DATA POLICY (no mock data — handoff hard rule):
 *   • Trending tokens — LIVE from the app's real Explore token list (`useListTokens`,
 *     the SAME hook the B3 Markets screen uses). Name, real token logo, mono price
 *     (`convertFiatAmountFormatted`), 24h % change, and the 1d price-history sparkline
 *     all come straight from the token stats. While the query is in flight the palette
 *     shows its honest loading skeleton; an empty result shows the honest empty state.
 *   • Quick actions — navigate to the real Terminal screens from the nav registry
 *     (`terminalTradeNav` / `terminalAccountNav`) via react-router.
 *
 * HookSwap ships v2 + v3 only — there is NO "Hooks" tab and no hook results (LOCKED
 * decision; hooks are removed from the UI entirely).
 */
import type { MultichainToken } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { ExploreContextProvider } from '~/features/Explore/state'
import { ExploreTablesFilterStoreContextProvider } from '~/features/Explore/state/exploreTablesFilterStore'
import { useListTokens } from '~/features/Explore/state/listTokens/useListTokens'
import { serializeSwapAddressesToURLParameters } from '~/pages/Swap/Swap/state/tradeQueryParams'
import {
  CommandPalette,
  type CommandPaletteActionItem,
  type CommandPaletteChange,
  type CommandPaletteGroup,
  type CommandPaletteTab,
  type CommandPaletteTokenItem,
} from '~/terminal/components/CommandPalette'
import { NavIcon } from '~/terminal/components/NavIcon'
import type { TrendDirection } from '~/terminal/components/SparklineCell'
import { terminalAccountNav, terminalTradeNav, type TerminalNavIcon } from '~/terminal/config/screens'
import { terminalColors } from '~/terminal/theme/tokens'

/* ------------------------------------------------------------------ config */

type PaletteTabId = 'all' | 'tokens' | 'pools' | 'actions'

/** Filter tabs — NO "Hooks" tab (hooks removed from the UI entirely). */
const PALETTE_TABS: ReadonlyArray<CommandPaletteTab & { id: PaletteTabId }> = [
  { id: 'all', label: 'All' },
  { id: 'tokens', label: 'Tokens' },
  { id: 'pools', label: 'Pools' },
  { id: 'actions', label: 'Actions' },
]

/** Quick-action nav targets, in rail order (TRADE then ACCOUNT). */
const NAV_ACTIONS = [...terminalTradeNav, ...terminalAccountNav]

/** Visual mnemonic chips (discoverability only; the parent wires any real keys).
 *  Partial — only the primary nav targets have a mnemonic; the rest render none. */
const ACTION_HINTS: Partial<Record<TerminalNavIcon, string>> = {
  swap: 'S',
  markets: 'M',
  pools: 'L',
  portfolio: 'P',
  activity: 'A',
}

/** How many trending tokens to show (6 at rest, up to 8 while searching). */
const TRENDING_LIMIT_DEFAULT = 6
const TRENDING_LIMIT_SEARCH = 8

/* ------------------------------------------------------------------ helpers */

/** Signed percent, 1 decimal: 14.6 → "+14.6%", -3.4 → "-3.4%". */
function formatSignedPct(value: number): string {
  return `${value >= 0 ? '+' : '-'}${Math.abs(value).toFixed(1)}%`
}

function directionOf(change: number): TrendDirection {
  if (change > 0) {
    return 'up'
  }
  if (change < 0) {
    return 'down'
  }
  return 'flat'
}

/** 26px round real token logo (from `logoUrl`); omitted → palette renders a neutral circle. */
function TokenLogo({ url }: { url: string }): JSX.Element {
  return (
    <span
      style={{
        width: 26,
        height: 26,
        borderRadius: '50%',
        background: `#fff center/cover no-repeat url(${JSON.stringify(url)})`,
        border: `1px solid ${terminalColors.line2}`,
        flexShrink: 0,
        display: 'inline-block',
      }}
    />
  )
}

/* --------------------------------------------------------------- container */

/**
 * Controlled B11 command palette. The parent owns open/close (⌘K + top-bar search
 * click). The live token query only mounts while `open` is true, so nothing fetches
 * in the background when the palette is closed.
 */
export function TerminalCommandPalette({ open, onClose }: { open: boolean; onClose: () => void }): JSX.Element | null {
  if (!open) {
    return null
  }
  // The token list needs the same Explore providers the /explore + Markets screen use.
  return (
    <ExploreContextProvider>
      <ExploreTablesFilterStoreContextProvider>
        <PaletteBody onClose={onClose} />
      </ExploreTablesFilterStoreContextProvider>
    </ExploreContextProvider>
  )
}

function PaletteBody({ onClose }: { onClose: () => void }): JSX.Element {
  const navigate = useNavigate()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<PaletteTabId>('all')

  // Real token list — same source as the B3 Markets screen (volume-ranked).
  const { topTokens, isLoading: tokensLoading } = useListTokens(undefined)

  const goToSwap = useMemo(
    () =>
      (token: MultichainToken): void => {
        const chainToken = token.chainTokens[0]
        let path = '/swap'
        if (chainToken) {
          try {
            path += serializeSwapAddressesToURLParameters({
              outputTokenAddress: chainToken.address || undefined,
              chainId: chainToken.chainId as UniverseChainId,
            })
          } catch {
            // Unknown/unsupported chain id — fall back to the plain swap screen.
            path = '/swap'
          }
        }
        navigate(path)
        onClose()
      },
    [navigate, onClose],
  )

  const q = query.trim().toLowerCase()

  // --- Trending tokens (live) ------------------------------------------------
  const tokenItems = useMemo<CommandPaletteTokenItem[]>(() => {
    const matched = topTokens.filter((token) => {
      if (!q) {
        return true
      }
      return token.name.toLowerCase().includes(q) || token.symbol.toLowerCase().includes(q)
    })
    const limit = q ? TRENDING_LIMIT_SEARCH : TRENDING_LIMIT_DEFAULT

    return matched.slice(0, limit).map((token, index): CommandPaletteTokenItem => {
      const stats = token.stats
      const price = stats?.price
      const priceLabel =
        price !== undefined && price > 0 ? convertFiatAmountFormatted(price, NumberType.FiatTokenPrice) : '—'

      const change1d = stats?.priceChange1d
      const change: CommandPaletteChange | undefined =
        change1d !== undefined ? { label: formatSignedPct(change1d), direction: directionOf(change1d) } : undefined

      const history = stats?.priceHistory1d
      const sparkline = history && history.length >= 2 ? history.map((point) => point.value) : undefined

      const logoUrl = token.logoUrl || undefined

      return {
        kind: 'token',
        id: token.multichainId || `${token.symbol}-${index}`,
        icon: logoUrl ? <TokenLogo url={logoUrl} /> : undefined,
        name: token.name || token.symbol,
        symbol: token.symbol || undefined,
        price: priceLabel,
        change,
        sparkline,
        actionLabel: 'Swap',
        onAction: () => goToSwap(token),
        onSelect: () => goToSwap(token),
      }
    })
  }, [topTokens, q, convertFiatAmountFormatted, goToSwap])

  // --- Quick actions ---------------------------------------------------------
  const actionItems = useMemo<CommandPaletteActionItem[]>(() => {
    return NAV_ACTIONS.filter((nav) => !q || nav.label.toLowerCase().includes(q)).map(
      (nav): CommandPaletteActionItem => ({
        kind: 'action',
        id: `nav-${nav.id}`,
        icon: <NavIcon name={nav.icon} stroke={terminalColors.greenDeep} size={15} />,
        label: nav.label,
        hint: ACTION_HINTS[nav.icon],
        onSelect: () => {
          navigate(nav.path)
          onClose()
        },
      }),
    )
  }, [q, navigate, onClose])

  // --- Assemble groups per active tab ---------------------------------------
  const showTokens = activeTab === 'all' || activeTab === 'tokens'
  const showActions = activeTab === 'all' || activeTab === 'actions'

  const groups = useMemo<CommandPaletteGroup[]>(() => {
    const next: CommandPaletteGroup[] = []
    if (showTokens && tokenItems.length > 0) {
      next.push({ id: 'trending', label: 'Trending tokens', items: tokenItems })
    }
    if (showActions && actionItems.length > 0) {
      next.push({ id: 'quick-actions', label: 'Quick actions', items: actionItems })
    }
    return next
  }, [showTokens, showActions, tokenItems, actionItems])

  // Loading only matters when a token-bearing tab has nothing to show yet.
  const loading = showTokens && tokensLoading && tokenItems.length === 0

  const emptyMessage =
    activeTab === 'pools' ? 'Pool search isn’t available in the palette yet.' : undefined

  return (
    <CommandPalette
      open
      onClose={onClose}
      query={query}
      onQueryChange={setQuery}
      placeholder="Search tokens and actions…"
      tabs={PALETTE_TABS}
      activeTabId={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as PaletteTabId)}
      groups={groups}
      loading={loading}
      emptyMessage={emptyMessage}
    />
  )
}
