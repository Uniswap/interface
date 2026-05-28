import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { PlatformSplitStubError } from 'utilities/src/errors'

export interface MultichainAddressSheetProps {
  isOpen: boolean
  chains: MultichainTokenEntry[]
  onClose: () => void
}

export function MultichainAddressSheet(_: MultichainAddressSheetProps): JSX.Element | null {
  throw new PlatformSplitStubError('MultichainAddressSheet')
}
