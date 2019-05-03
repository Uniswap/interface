import React, { useState, useEffect } from 'react'
import classnames from 'classnames'
import { useTranslation } from 'react-i18next'

// import QrCode from '../QrCode' // commented out pending further review

import './address-input-panel.scss'
import { isAddress } from '../../utils'
import { useWeb3Context } from 'web3-react'

export default function AddressInputPanel({ title, onChange = () => {}, errorMessage }) {
  const { t } = useTranslation()

  const { library } = useWeb3Context()

  const [input, setInput] = useState('')
  const [display, setDisplay] = useState('')

  useEffect(() => {
    let stale = false

    if (isAddress(input)) {
      library.lookupAddress(input).then(name => {
        if (!stale) {
          if (name) {
            setInput(name)
          }
          onChange(input, name)
        }
      })
    } else {
      try {
        library.resolveName(input).then(address => {
          if (address && !stale) {
            onChange(address, input)
          } else {
            onChange(input)
          }
        })
      } catch {}
    }

    return () => {
      stale = true
    }
  }, [input, library, onChange])

  console.log('rendering!')

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
              placeholder="0x1234... or ENS name"
              onChange={e => setInput(e.target.value)}
              value={display || input}
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
