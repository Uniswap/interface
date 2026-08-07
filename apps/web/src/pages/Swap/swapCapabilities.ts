import type { EmbedView } from '~/pages/Swap/embedContext'

/**
 * Single source of truth for what the swap surface exposes per embed {@link EmbedView}, so the
 * strip points (App.tsx chrome gate, SwapPage header/chart/tab-url-syncing) can't drift.
 * 'full' turns everything on; 'swap' (`/embed?view=swap`) is the stripped swap-only surface.
 */
export interface SwapCapabilities {
  /** Render the app chrome (top Header + AppChrome drawers/popups). */
  appChrome: boolean
  /** Render the swap form header (tab SegmentedControl + settings button). */
  header: boolean
  /** Render the slide-out chart card + toggle. */
  chart: boolean
  /** Sync the selected tab to the URL (client-side nav between /swap /limit /buy /sell). */
  syncTabToUrl: boolean
}

export function getSwapCapabilities(view: EmbedView): SwapCapabilities {
  const isSwapOnly = view === 'swap'
  return {
    appChrome: !isSwapOnly,
    header: !isSwapOnly,
    chart: !isSwapOnly,
    syncTabToUrl: !isSwapOnly,
  }
}
