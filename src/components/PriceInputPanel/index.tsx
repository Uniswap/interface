import React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { TYPE } from '../../theme'
import { Input as NumericalInput } from '../NumericalInput'

const InputRow = styled.div<{ selected: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  padding: ${({ selected }) => (selected ? '0.75rem 0.5rem 0.75rem 1rem' : '0.75rem 0.75rem 0.75rem 1rem')};
`

const InputPanel = styled.div<{ hideInput?: boolean }>`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  border-radius: ${({ hideInput }) => (hideInput ? '8px' : '20px')};
  background-color: ${({ theme }) => theme.bg2};
  z-index: 1;
`

const Container = styled.div<{ hideInput: boolean }>`
  border-radius: ${({ hideInput }) => (hideInput ? '8px' : '20px')};
  border: 1px solid ${({ theme }) => theme.bg2};
  background-color: ${({ theme }) => theme.bg1};
`

interface PriceInputPanelProps {
  value: string
  placeholder?: string
  onUserInput: (value: string) => void
  disableCurrencySelect?: boolean
  hideInput?: boolean
  id: string
}

export default function PriceInputPanel({
  value,
  placeholder,
  onUserInput,
  disableCurrencySelect = false,
  hideInput = false,
  id,
}: PriceInputPanelProps) {
  const { t } = useTranslation()

  return (
    <InputPanel id={id}>
      <Container hideInput={hideInput}>
        <InputRow style={hideInput ? { padding: '0', borderRadius: '8px' } : {}} selected={disableCurrencySelect}>
          {!hideInput && (
            <>
              <TYPE.body>{t('price')}</TYPE.body>
              <NumericalInput
                style={{ textAlign: 'right' }}
                value={value}
                onUserInput={(val) => {
                  onUserInput(val)
                }}
                placeholder={placeholder}
              />
            </>
          )}
        </InputRow>
      </Container>
    </InputPanel>
  )
}
