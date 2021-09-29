import React from 'react'
import { useTranslation } from 'react-i18next'

import Modal from '../Modal'

const ChangeNetworkModal: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Modal isOpen={true} onDismiss={() => null} maxHeight={24} minHeight={24}>
      <div style={{ width: '100%', margin: '16px' }}>
        <div>
          <span>{t('unsupportedNetwork')}</span>
        </div>
        <hr style={{ marginBottom: '28px' }} />
        <div>
          <span>{t('unsupportedNetworkDesc')}</span>
        </div>
      </div>
    </Modal>
  )
}

export default ChangeNetworkModal
