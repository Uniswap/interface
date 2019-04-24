import React from 'react'
import classnames from 'classnames'
import { useTranslation } from 'react-i18next'

// import QrCode from '../QrCode' // commented out pending further review

import './address-input-panel.scss'

export default function AddressInputPanel({ title, onChange = () => {}, value = '', errorMessage }) {
  const { t } = useTranslation()

  return (
    <div className="currency-input-panel">
      <div
        className={classnames('currency-input-panel__container address-input-panel__recipient-row', {
          'currency-input-panel__container--error': errorMessage
        })}
      >
        <div className="address-input-panel__input-container">
          <div className="currency-input-panel__label-row">
            <div className="currency-input-panel__label-container">
              <span className="currency-input-panel__label">{title || t('recipientAddress')}</span>
            </div>
          </div>
          <div className="currency-input-panel__input-row">
            <input
              type="text"
              className={classnames('address-input-panel__input', {
                'address-input-panel__input--error': errorMessage
              })}
              placeholder="0x1234..."
              onChange={e => onChange(e.target.value)}
              value={value}
            />
          </div>
        </div>
        {/* commented out pending further review
        <div className="address-input-panel__qr-container">
          <QrCode onValueReceived={value => onChange(value)} />
        </div>
        */}
      </div>
    </div>
  )
}
