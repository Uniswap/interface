import { useTranslation } from 'react-i18next'
import { NotFoundModal } from '~/components/NotFoundModal/NotFoundModal'

export function TokenNotFoundModal({ isOpen, closeModal }: { isOpen: boolean; closeModal: () => void }) {
  const { t } = useTranslation()

  return (
    <NotFoundModal
      isOpen={isOpen}
      closeModal={closeModal}
      title={t('token.notFound.title')}
      description={t('token.notFound.description')}
    />
  )
}
