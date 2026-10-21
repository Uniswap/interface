import { useCallback } from 'react'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { useOpenReceiveModal } from 'src/features/modals/hooks/useOpenReceiveModal'
import { CexTransferInfoModal as CexTransferInfoModalContent } from 'uniswap/src/features/fiatOnRamp/CexTransferInfoModal'

export function CexTransferInfoModal(): JSX.Element {
  const { onClose } = useReactNavigationModal()
  const openReceiveModal = useOpenReceiveModal()

  const onPressReceive = useCallback(() => {
    onClose()
    openReceiveModal()
  }, [onClose, openReceiveModal])

  return <CexTransferInfoModalContent isOpen onClose={onClose} onPressReceive={onPressReceive} />
}
