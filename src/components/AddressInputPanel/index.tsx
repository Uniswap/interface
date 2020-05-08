import React, { useState, useEffect } from 'react'
import styled from 'styled-components'

// import QR from '../../assets/svg/QR.svg'
import { isAddress } from '../../utils'
import { useWeb3React, useDebounce } from '../../hooks'

const InputPanel = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  border-radius: 1.25rem;
  background-color: ${({ theme }) => theme.bg1};
  z-index: 1;
  width: 100%;
  height: 60px;
`

const ContainerRow = styled.div<{ error: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 1.25rem;
  height: 60px;
  border: 1px solid ${({ error, theme }) => (error ? theme.red1 : theme.bg3)};
  background-color: ${({ theme }) => theme.bg1};
`

const InputContainer = styled.div`
  flex: 1;
`

const InputRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  padding: 0.75rem;
`

const Input = styled.input<{ error: boolean }>`
  font-size: 1rem;
  outline: none;
  border: none;
  flex: 1 1 auto;
  width: 0;
  background-color: ${({ theme }) => theme.bg1};
  font-size: 20px;
  color: ${({ error, theme }) => (error ? theme.red1 : theme.blue1)};
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;

  ::placeholder {
    color: ${({ theme }) => theme.text4};
  }
`

// const QRWrapper = styled.div`
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   border: 1px solid ${({ theme }) => theme.bg3};
//   background: #fbfbfb;
//   padding: 4px;
//   border-radius: 8px;
// `

export default function AddressInputPanel({ initialInput = '', onChange, onError }) {
  const { library } = useWeb3React()

  const [input, setInput] = useState(initialInput ? initialInput : '')

  const debouncedInput = useDebounce(input, 150)

  const [data, setData] = useState({ address: undefined, name: undefined })
  const [error, setError] = useState<boolean>(false)

  // keep data and errors in sync
  useEffect(() => {
    onChange({ address: data.address, name: data.name })
  }, [onChange, data.address, data.name])

  useEffect(() => {
    onError(error, input)
  }, [onError, error, input])

  // run parser on debounced input
  useEffect(() => {
    let stale = false
    if (isAddress(debouncedInput)) {
      try {
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
            if (!stale) {
              setData({ address: debouncedInput, name: '' })
              setError(null)
            }
          })
      } catch {
        setData({ address: debouncedInput, name: '' })
        setError(null)
      }
    } else {
      if (debouncedInput !== '') {
        try {
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
              if (!stale) {
                setError(true)
              }
            })
        } catch {
          setError(true)
        }
      } else if (debouncedInput === '') {
        setError(true)
      }
    }

    return () => {
      stale = true
    }
  }, [debouncedInput, library, onChange, onError])

  function onInput(event) {
    if (event.target.value === '') {
      setData({ address: undefined, name: undefined })
    }

    if (data.address !== undefined || data.name !== undefined) {
      setData({ address: undefined, name: undefined })
    }
    if (error !== undefined) {
      setError(true)
    }
    const input = event.target.value
    const checksummedInput = isAddress(input)

    setInput(checksummedInput || input)
  }

  return (
    <InputPanel>
      <ContainerRow error={input !== '' && error}>
        <InputContainer>
          <InputRow>
            <Input
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              placeholder="Recipient Address"
              error={input !== '' && error}
              onChange={onInput}
              value={input}
            />
            {/* <QRWrapper>
              <img src={QR} alt="" />
            </QRWrapper> */}
          </InputRow>
        </InputContainer>
      </ContainerRow>
    </InputPanel>
  )
}
