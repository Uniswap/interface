import { ExplorerDataType, getExplorerLink } from '../../utils/getExplorerLink'
import { ExternalLink, TYPE } from '../../theme'
import { ReactNode, useCallback, useContext, useState } from 'react'
import { Trans, t } from '@lingui/macro'
import styled, { ThemeContext } from 'styled-components/macro'

import { AutoColumn } from '../Column'
import { RowBetween } from '../Row'
import Select from 'react-select'
import { useActiveWeb3React } from '../../hooks/web3'
import { useAddressManager } from 'components/AddressManager'
import useENS from '../../hooks/useENS'

const SelectItem = styled(Select)`
  color:#222 !important;
  z-index: 1000;
  > 
`


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
  transition: border-color 300ms ${({ error }) => (error ? 'step-end' : 'step-start')},
    color 500ms ${({ error }) => (error ? 'step-end' : 'step-start')};
  background-color: ${({ theme }) => theme.bg1};
`

const InputContainer = styled.div`
  flex: 1;
  padding: 1rem;
`

const Input = styled.input<{ error?: boolean }>`
  font-size: 1rem;
  outline: none;
  border: none;
  flex: 1 1 auto;
  width: 0;
  background-color: ${({ theme }) => theme.bg0};
  transition: color 300ms ${({ error }) => (error ? 'step-end' : 'step-start')};
  color: ${({ error, theme }) => (error ? theme.red1 : theme.text1)};
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  width: 100%;
  ::placeholder {
    color: ${({ theme }) => theme.text4};
  }
  padding: 5px;
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
  id,
  className = 'recipient-address-input',
  label,
  placeholder,
  value,
  onChange,
}: {
  id?: string
  className?: string
  label?: ReactNode
  placeholder?: string
  // the typed string value
  value: string
  // triggers whenever the typed value changes
  onChange: (value: string) => void
}) {
  const { chainId } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  const { address, loading, name } = useENS(value)

  const handleInput = useCallback(
    (event) => {
      const input = event.target.value
      const withoutSpaces = input.replace(/\s+/g, '')
      onChange(withoutSpaces)
    },
    [onChange]
  )

  const error = Boolean(value?.length > 0 && !loading && !address)

  const [addresses,] = useAddressManager()
  const [useManual, setUseManual] = useState(false)
  function styleFn(provided: any, state: any) {
    return { ...provided, color: theme.text1, background: theme.bg0 };
  }
  const styles = {
    singleValue: {
      color: theme.text1,
      background: theme.bg0
    }
  }

  return (
    <InputPanel id={id}>
      <ContainerRow error={error}>
        <InputContainer>
          <AutoColumn gap="md">
            <RowBetween>
              <TYPE.black color={theme.text2} fontWeight={500} fontSize={14}>
                {label ?? <Trans>Recipient</Trans>}
                {addresses.length > 0 && <small>
                  <TYPE.link onClick={() => {
                    setUseManual(!useManual)
                  }}>{useManual ? 'Switch to Select' : 'Switch to Input'}</TYPE.link>
                </small>}
              </TYPE.black>

              {address && chainId && (
                <ExternalLink
                  href={getExplorerLink(chainId, name ?? address, ExplorerDataType.ADDRESS)}
                  style={{ fontSize: '14px' }}
                >
                  <Trans>(View on Explorer)</Trans>
                </ExternalLink>
              )}
            </RowBetween>
            {Boolean(addresses.length == 0 || useManual) && <Input
              className={className}
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              placeholder={placeholder ?? t`Wallet Address or ENS name`}
              error={error}
              pattern="^(0x[a-fA-F0-9]{40})$"
              onChange={handleInput}
              value={value}
            />}

            {Boolean(addresses.length > 0 && !useManual) && (
              <SelectItem theme={theme} options={addresses} onChange={(e: any) => onChange(e.value as any)} value={addresses.find((item) => item.value?.toLowerCase() === value?.toLowerCase())} />
            )}
          </AutoColumn>
        </InputContainer>
      </ContainerRow>
    </InputPanel>
  )
}
