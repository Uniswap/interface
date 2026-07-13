import type { ReactNode } from 'react'
import { AnimateTransition } from 'ui/src'
import { MultichainContextMenuAddressSubview } from 'uniswap/src/components/MultichainTokenDetails/MultichainContextMenuAddressSubview'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'

interface MultichainAddressTransitionPanelProps {
  /** Main view (page 0) — e.g. menu actions or hover-card content. */
  children: ReactNode
  /** 0 shows `children`, 1 shows the per-chain address list — pair with {@link useMultichainAddressViewState}. */
  viewIndex: number
  animationType: 'forward' | 'backward'
  orderedEntries: MultichainTokenEntry[]
  /** Per-chain copy; `chainId` identifies which row was copied (matches {@link MultichainAddressList}). */
  onCopyAddress: (address: string, chainId: UniverseChainId) => void | Promise<void>
  onBack: () => void
  title: string
  /** Skip the bordered/fixed-width card chrome on the addresses panel — use when the parent surface (e.g. a popover) already supplies it. */
  bare?: boolean
  /** Override the addresses panel's size. Only meaningful with `bare`; non-bare uses the standard menu layout constants. */
  width?: number
  maxHeight?: number
}

/**
 * Shared transition between a main view and a per-chain address list, used by multichain
 * token context menus and TokenHoverCard. Owns the `AnimateTransition` wiring; callers own
 * the main view and the copy/clipboard/analytics logic.
 */
export function MultichainAddressTransitionPanel({
  children,
  viewIndex,
  animationType,
  orderedEntries,
  onCopyAddress,
  onBack,
  title,
  bare,
  width,
  maxHeight,
}: MultichainAddressTransitionPanelProps): JSX.Element {
  return (
    <AnimateTransition currentIndex={viewIndex} animationType={animationType} animation="200ms">
      {children}
      <MultichainContextMenuAddressSubview
        orderedEntries={orderedEntries}
        title={title}
        bare={bare}
        width={width}
        maxHeight={maxHeight}
        onCopyAddress={onCopyAddress}
        onBack={onBack}
      />
    </AnimateTransition>
  )
}
