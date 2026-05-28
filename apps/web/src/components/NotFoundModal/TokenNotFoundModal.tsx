import NotFoundModal from 'components/NotFoundModal/NotFoundModal'
import { useModalState } from 'hooks/useModalState'
import { useTranslation } from 'react-i18next'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

function TokenNotFoundModal() {
  const { t } = useTranslation()
  const { isOpen, closeModal } = useModalState(ModalName.TokenNotFound)

  return (
    <NotFoundModal
      isOpen={isOpen}
      closeModal={closeModal}
      title={t('token.notFound.title')}
      description={t('token.notFound.description')}
    />
  )
}

export default TokenNotFoundModal
