import { isExtensionApp } from '@universe/environment'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { NetworkCostEditor } from 'uniswap/src/features/gas/components/NetworkCostEditor/NetworkCostEditor'
import type { NetworkCostEditorModalProps } from 'uniswap/src/features/gas/components/NetworkCostEditor/NetworkCostEditorModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function NetworkCostEditorModal({ isOpen, ...editorProps }: NetworkCostEditorModalProps): JSX.Element {
  return (
    <Modal
      alignment={isExtensionApp ? 'top' : 'center'}
      isModalOpen={isOpen}
      maxWidth={420}
      name={ModalName.NetworkCostEditor}
      padding="$none"
      onClose={editorProps.onCancel}
    >
      <NetworkCostEditor {...editorProps} />
    </Modal>
  )
}
