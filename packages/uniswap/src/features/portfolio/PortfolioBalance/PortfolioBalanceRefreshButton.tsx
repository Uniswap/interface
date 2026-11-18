import { PlatformSplitStubError } from 'utilities/src/errors'

/**
 * The portfolio header's refresh button.
 *
 * Platform-split because the web implementation is `RefreshButtonCompat` from
 * `@universe/mycelium/refresh-button-compat`, whose native leg is a deliberate
 * throwing stub (INFRA-3489). A static import of it from a non-suffixed file in
 * this dual-bundled package would resolve that stub into the native bundle, so
 * the import has to live behind a `.web` leg — which is also what the
 * `universe-custom/no-throwing-stub-imports` gate requires. Web bundlers
 * (`apps/web` vite, `apps/extension` wxt/esbuild) and the package's own vitest
 * config all resolve `.web.tsx` ahead of this file.
 */
export interface PortfolioBalanceRefreshButtonProps {
  /** Refetches the portfolio balance. */
  onPress: () => void
  /** Whether a refresh is in progress: blocks presses and freezes the icon's hover color. */
  isLoading: boolean
  /** Blocks the press handler and hides the button entirely. */
  disabled?: boolean
}

export function PortfolioBalanceRefreshButton(_: PortfolioBalanceRefreshButtonProps): JSX.Element {
  throw new PlatformSplitStubError('PortfolioBalanceRefreshButton')
}
