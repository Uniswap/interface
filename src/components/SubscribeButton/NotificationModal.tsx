import Modal from 'components/Modal'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useNotificationModalToggle } from 'state/application/hooks'

import NotificationPreference from './NotificationPreference'

export default function NotificationModal() {
  const toggleModal = useNotificationModalToggle()
  const isOpen = useModalOpen(ApplicationModal.NOTIFICATION_SUBSCRIPTION)

  return (
    <Modal isOpen={isOpen} onDismiss={toggleModal} minHeight={false} maxWidth={450}>
      <NotificationPreference isOpen={isOpen} toggleModal={toggleModal} />
    </Modal>
  )
}
