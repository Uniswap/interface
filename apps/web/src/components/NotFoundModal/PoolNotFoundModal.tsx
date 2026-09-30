import { useTranslation } from 'react-i18next'
import { NotFoundModal } from '~/components/NotFoundModal/NotFoundModal'

export function PoolNotFoundModal({ isOpen, closeModal }: { isOpen: boolean; closeModal: () => void }) {
  const { t } = useTranslation()

  return (
    <NotFoundModal
      isOpen={isOpen}
      closeModal={closeModal}
      title={t('pool.notFound.title')}
      description={t('pool.notFound.description')}
    />
  )
}
