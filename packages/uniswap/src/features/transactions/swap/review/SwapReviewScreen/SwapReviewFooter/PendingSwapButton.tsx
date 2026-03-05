import type { Warning } from 'uniswap/src/components/modals/WarningModal/types'

export interface PendingSwapButtonProps {
  disabled: boolean
  onSubmit: () => void
  warning?: Warning
}

/**
 * Platform-specific implementations:
 * - Web: Uses CSS transitions (PendingSwapButton.web.tsx)
 * - Native: Uses react-native-reanimated (PendingSwapButton.native.tsx)
 */
export function PendingSwapButton(_props: PendingSwapButtonProps): JSX.Element {
  throw new Error('PendingSwapButton: Implemented in `.native.tsx` and `.web.tsx` files')
}
