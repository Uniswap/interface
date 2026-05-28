import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { NetworkCostPickerModal } from 'uniswap/src/features/gas/components/NetworkCostPickerModal'

export function NetworkCostPickerModalScreen(): JSX.Element {
  const { onClose } = useReactNavigationModal()
  return <NetworkCostPickerModal isOpen onClose={onClose} />
}
