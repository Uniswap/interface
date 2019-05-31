import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { useWeb3Context } from 'web3-react'
import { lighten } from 'polished'

import { isAddress } from '../../utils'
import { useDebounce } from '../../hooks'

const InputPanel = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  box-shadow: 0 4px 8px 0 ${({ theme }) => lighten(0.9, theme.royalBlue)};
  position: relative;
  border-radius: 1.25rem;
  background-color: ${({ theme }) => theme.white};
  z-index: 1;
`

const ContainerRow = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 1.25rem;
  box-shadow: 0 0 0 0.5px ${({ error, theme }) => (error ? theme.salmonRed : theme.mercuryGray)};
  background-color: ${({ theme }) => theme.white};
  transition: box-shadow 200ms ease-in-out;
`

const InputContainer = styled.div`
  flex: 1;
`

const LabelRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  color: ${({ theme }) => theme.doveGray};
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0.75rem 1rem;
`

const LabelContainer = styled.div`
  flex: 1 1 auto;
  width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`

const InputRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  padding: 0.25rem 0.85rem 0.75rem;
`

const Input = styled.input`
  font-size: 1rem;
  outline: none;
  border: none;
  flex: 1 1 auto;
  width: 0;
  color: ${({ error, theme }) => (error ? theme.salmonRed : theme.royalBlue)};
  transition: color 200ms ease-in-out;
  overflow: hidden;
  text-overflow: ellipsis;

  ::placeholder {
    color: ${({ theme }) => theme.chaliceGray};
  }
`

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
      library
        .lookupAddress(debouncedInput)
        .then(name => {
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
        .catch(() => {
          setData({ address: debouncedInput, name: '' })
          setError(null)
        })
    } else {
      if (debouncedInput !== '') {
        library
          .resolveName(debouncedInput)
          .then(address => {
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
          .catch(() => {
            setError(true)
          })
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
    <InputPanel>
      <ContainerRow error={input !== '' && error}>
        <InputContainer>
          <LabelRow>
            <LabelContainer>
              <span>{title || t('recipientAddress')}</span>
            </LabelContainer>
          </LabelRow>
          <InputRow>
            <Input
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              placeholder="0x1234..."
              error={input !== '' && error}
              onChange={onInput}
              value={input}
            />
          </InputRow>
        </InputContainer>
      </ContainerRow>
    </InputPanel>
  )
}
