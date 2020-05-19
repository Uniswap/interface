import React, { useState, useEffect, useContext } from 'react'
import styled, { ThemeContext } from 'styled-components'

import { isAddress } from '../../utils'
import { useActiveWeb3React, useDebounce } from '../../hooks'
import { Link, TYPE } from '../../theme'
import { AutoColumn } from '../Column'
import { RowBetween } from '../Row'
import { getEtherscanLink } from '../../utils'

const InputPanel = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  border-radius: 1.25rem;
  background-color: ${({ theme }) => theme.bg1};
  z-index: 1;
  width: 100%;
`

const ContainerRow = styled.div<{ error: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 1.25rem;
  border: 1px solid ${({ error, theme }) => (error ? theme.red1 : theme.bg2)};
  background-color: ${({ theme }) => theme.bg1};
`

const InputContainer = styled.div`
  flex: 1;
  padding: 1rem;
`

const Input = styled.input<{ error?: boolean }>`
  font-size: 1.25rem;
  outline: none;
  border: none;
  flex: 1 1 auto;
  width: 0;
  background-color: ${({ theme }) => theme.bg1};
  color: ${({ error, theme }) => (error ? theme.red1 : theme.primary1)};
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  width: 100%;
  ::placeholder {
    color: ${({ theme }) => theme.text4};
  }
  padding: 0px;
  -webkit-appearance: textfield;

  ::-webkit-search-decoration {
    -webkit-appearance: none;
  }

  ::-webkit-outer-spin-button,
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }

  ::placeholder {
    color: ${({ theme }) => theme.text4};
  }
`

export default function AddressInputPanel({
  initialInput = '',
  onChange,
  onError
}: {
  initialInput?: string
  onChange: (val: { address: string; name?: string }) => void
  onError: (error: boolean, input: string) => void
}) {
  const { chainId, library } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  const [input, setInput] = useState(initialInput ? initialInput : '')
  const debouncedInput = useDebounce(input, 200)

  const [data, setData] = useState<{ address: string; name: string }>({ address: undefined, name: undefined })
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
    // if the input is an address, try to look up its name
    if (isAddress(debouncedInput)) {
      library
        .lookupAddress(debouncedInput)
        .then(name => {
          if (stale) return
          // if an ENS name exists, set it as the destination
          if (name) {
            setInput(name)
          } else {
            setData({ address: debouncedInput, name: '' })
            setError(null)
          }
        })
        .catch(() => {
          if (stale) return
          setData({ address: debouncedInput, name: '' })
          setError(null)
        })
    }
    // otherwise try to look up the address of the input, treated as an ENS name
    else {
      if (debouncedInput !== '') {
        library
          .resolveName(debouncedInput)
          .then(address => {
            if (stale) return
            // if the debounced input name resolves to an address
            if (address) {
              setData({ address: address, name: debouncedInput })
              setError(null)
            } else {
              setError(true)
            }
          })
          .catch(() => {
            if (stale) return
            setError(true)
          })
      } else if (debouncedInput === '') {
        setError(true)
      }
    }

    return () => {
      stale = true
    }
  }, [debouncedInput, library])

  function onInput(event) {
    setData({ address: undefined, name: undefined })
    setError(false)
    const input = event.target.value
    const checksummedInput = isAddress(input.replace(/\s/g, '')) // delete whitespace
    setInput(checksummedInput || input)
  }

  return (
    <InputPanel>
      <ContainerRow error={input !== '' && error}>
        <InputContainer>
          <AutoColumn gap="md">
            <RowBetween>
              <TYPE.black color={theme.text2} fontWeight={500} fontSize={14}>
                Recipient
              </TYPE.black>
              {data.address && (
                <Link
                  href={getEtherscanLink(chainId, data.name || data.address, 'address')}
                  style={{ fontSize: '14px' }}
                >
                  (View on Etherscan)
                </Link>
              )}
            </RowBetween>
            <Input
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              placeholder="Wallet Address or ENS name"
              error={input !== '' && error}
              onChange={onInput}
              value={input}
            />
          </AutoColumn>
        </InputContainer>
      </ContainerRow>
    </InputPanel>
  )
}
