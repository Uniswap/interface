import React, { useState, useEffect } from 'react'
import classnames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useWeb3Context } from 'web3-react'

import { isAddress } from '../../utils'
import { useDebounce } from '../../hooks'
// import QrCode from '../QrCode' // commented out pending further review

import './address-input-panel.scss'

export default function AddressInputPanel({ title, initialInput = '', onChange = () => {}, onError = () => {} }) {
  const { t } = useTranslation()

  const { library } = useWeb3Context()

  const [input, setInput] = useState(initialInput)
  const debouncedInput = useDebounce(input, 150)

  const [data, setData] = useState({ address: undefined, name: undefined })
  const [error, setError] = useState(false)

  // keep data and errors in sync
  useEffect(() => {
    onChange({ address: data.address, name: data.name })
  }, [onChange, data.address, data.name])
  useEffect(() => {
    onError(error)
  }, [onError, error])

  // run parser on debounced input
  useEffect(() => {
    let stale = false

    if (isAddress(debouncedInput)) {
      library.lookupAddress(debouncedInput).then(name => {
        if (!stale) {
          // if an ENS name exists, set it as the destination
          if (name) {
            setInput(name)
          } else {
            setData({ address: debouncedInput, name: '' })
            setError(null)
          }
        }
      })
    } else {
      if (debouncedInput !== '') {
        try {
          library.resolveName(debouncedInput).then(address => {
            if (!stale) {
              // if the debounced input name resolves to an address
              if (address) {
                setData({ address: address, name: debouncedInput })
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
    }

    return () => {
      stale = true
    }
  }, [debouncedInput, library, onChange, onError])

  function onInput(event) {
    if (data.address !== undefined || data.name !== undefined) {
      setData({ address: undefined, name: undefined })
    }
    if (error !== undefined) {
      setError()
    }
    const input = event.target.value
    const checksummedInput = isAddress(input)
    setInput(checksummedInput || input)
  }

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
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              className={classnames('address-input-panel__input', {
                'address-input-panel__input--error': input !== '' && error
              })}
              placeholder="0x1234..."
              onChange={onInput}
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
