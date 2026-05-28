import type { NetworkCostEditorProps } from 'uniswap/src/features/gas/components/NetworkCostEditor/NetworkCostEditor'
import { PlatformSplitStubError } from 'utilities/src/errors'

export interface NetworkCostEditorModalProps extends NetworkCostEditorProps {
  isOpen: boolean
}

/**
 * Platform-adaptive shell that renders `NetworkCostEditor` inside a modal.
 * - Mobile: bottom sheet
 * - Web/extension: centered modal
 *
 * Closes via Cancel (onCancel) or Save (onSave); the parent owns `isOpen`.
 */
export function NetworkCostEditorModal(_props: NetworkCostEditorModalProps): JSX.Element {
  throw new PlatformSplitStubError('NetworkCostEditorModal')
}
