import React, { useState, useEffect, useContext } from 'react'
import styled, { ThemeContext } from 'styled-components'

// import QR from '../../assets/svg/QR.svg'
import { isAddress } from '../../utils'
import { useWeb3React, useDebounce } from '../../hooks'
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

// const QRWrapper = styled.div`
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   border: 1px solid ${({ theme }) => theme.bg3};
//   background: #fbfbfb;
//   padding: 4px;
//   border-radius: 8px;
// `

export default function AddressInputPanel({
  initialInput = '',
  onChange,
  onError
}: {
  initialInput?: string
  onChange: (val: { address: string; name?: string }) => void
  onError: (error: boolean, input: string) => void
}) {
  const { chainId, library } = useWeb3React()
  const theme = useContext(ThemeContext)

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
          <AutoColumn gap="md">
            <RowBetween>
              <TYPE.black color={theme.text2} fontWeight={500} fontSize={14}>
                Recipient
              </TYPE.black>

              {data.name ? (
                <Link href={getEtherscanLink(chainId, data.name, 'address')} style={{ fontSize: '14px' }}>
                  (View on Etherscan)
                </Link>
              ) : (
                <Link href={getEtherscanLink(chainId, data.address, 'address')} style={{ fontSize: '14px' }}>
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
            {/* <QRWrapper>
              <img src={QR} alt="" />
            </QRWrapper> */}
          </AutoColumn>
        </InputContainer>
      </ContainerRow>
    </InputPanel>
  )
}
