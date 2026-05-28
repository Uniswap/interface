import NotFoundModal from 'components/NotFoundModal/NotFoundModal'
import { useModalState } from 'hooks/useModalState'
import { useTranslation } from 'react-i18next'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

function PoolNotFoundModal() {
  const { t } = useTranslation()
  const { isOpen, closeModal } = useModalState(ModalName.PoolNotFound)

  return (
    <NotFoundModal
      isOpen={isOpen}
      closeModal={closeModal}
      title={t('pool.notFound.title')}
      description={t('pool.notFound.description')}
    />
  )
}

export default PoolNotFoundModal
