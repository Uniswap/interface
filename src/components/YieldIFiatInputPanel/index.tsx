import React, { useContext } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { RowBetween } from '../Row'
import { darken } from 'polished'
import { TYPE } from '../../theme'
import { Text } from 'rebass'
import { Input as NumericalInput } from '../NumericalInput'

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

const LabelRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0.75rem 1rem 0 1rem;
`

const InputRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  padding: 0.75rem 0.5rem 0.75rem 1rem;
`

const Aligner = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

interface InputPanelProps {
  value: string
  onUserInput: (value: string) => void
  id: string
  label: string
  currency: string
}

export default function YieldFiatInputPanel({ id, label, value, onUserInput, currency }: InputPanelProps) {
  const theme = useContext(ThemeContext)
  return (
    <InputPanel id={id}>
      <Container hideInput={false}>
        <LabelRow>
          <RowBetween>
            <TYPE.body color={theme.text3} fontWeight={500} fontSize={14}>
              {label}
            </TYPE.body>
          </RowBetween>
        </LabelRow>
        <InputRow>
          <NumericalInput className="yield-amount-input" value={value} onUserInput={onUserInput} />
          <Aligner>
            <Text fontSize={[24]} fontWeight={500}>
              {currency}
            </Text>
          </Aligner>
        </InputRow>
      </Container>
    </InputPanel>
  )
}
