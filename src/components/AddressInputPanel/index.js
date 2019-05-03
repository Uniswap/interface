import React, { useState, useEffect } from 'react'
import classnames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useWeb3Context } from 'web3-react'

// import QrCode from '../QrCode' // commented out pending further review

import './address-input-panel.scss'
import { isAddress } from '../../utils'

export default function AddressInputPanel({ title, onChange = () => {}, onError = () => {} }) {
  const { t } = useTranslation()

  const { library } = useWeb3Context()

  const [input, setInput] = useState('')
  const [data, setData] = useState({ address: undefined, name: undefined })
  const [error, setError] = useState(false)

  // keep stuff in sync
  useEffect(() => {
    onChange({ address: data.address, name: data.name })
  }, [onChange, data.address, data.name])
  useEffect(() => {
    onError(error)
  }, [onError, error])

  useEffect(() => {
    let stale = false

    if (isAddress(input)) {
      library.lookupAddress(input).then(name => {
        if (!stale) {
          // if an ENS name exists, set it as the destination
          if (name) {
            setInput(name)
          } else {
            setData({ address: input, name: '' })
            setError(null)
          }
        }
      })
    } else {
      try {
        library.resolveName(input).then(address => {
          if (!stale) {
            // if the input name resolves to an address
            if (address) {
              setData({ address: address, name: input })
              setError(null)
            } else {
              setError(true)
            }
          }
        })
      } catch {
        setError(true)
      }
    }

    return () => {
      stale = true
      setData({ address: undefined, name: undefined })
      setError()
    }
  }, [input, library, onChange, onError])

  return (
    <div className="currency-input-panel">
      <div
        className={classnames('currency-input-panel__container address-input-panel__recipient-row', {
          'currency-input-panel__container--error': input !== '' && error
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
                'address-input-panel__input--error': input !== '' && error
              })}
              placeholder="0x1234..."
              onChange={e => setInput(e.target.value)}
              value={input}
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
