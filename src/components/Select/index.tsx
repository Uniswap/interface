import React, { useContext } from 'react'
import { isArray } from 'util'
import styled, { ThemeContext } from 'styled-components'
import { darken } from 'polished'
import { useTranslation } from 'react-i18next'
import { RowBetween } from '../Row'
import { TYPE } from '../../theme'

const LabelRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  color: ${({ theme }) => theme.text1};
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0.75rem 1rem 0 1rem;
  span:hover {
    cursor: pointer;
    color: ${({ theme }) => darken(0.2, theme.text2)};
  }
`

const InputPanel = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.bg2};
  z-index: 1;
`

const Container = styled.div`
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.bg2};
  background-color: ${({ theme }) => theme.bg1};
`

const InputRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  padding: 0.75rem 0.5rem 0.75rem 1rem;
`
const StyledSelect = styled.select`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  white-space: nowrap;
  background: none;
  border: none;
  outline: none;
  color: ${({ theme }) => theme.text1};
  border-style: none;
  border: none;

  font-size: 18px;

  transition: border 100ms;
  background-color: white;
`
interface SelectProps {
  id?: string
  label: string
  defaultValue?: string
  options: Record<string, string> | string[]
  onChange: (value: string) => void
}
export default function Select(props: SelectProps) {
  const { t } = useTranslation()
  const theme = useContext(ThemeContext)
  const { options, id, label, onChange, defaultValue } = props
  return (
    <InputPanel id={id} theme={theme}>
      <Container theme={theme}>
        <LabelRow>
          <RowBetween>
            <TYPE.body color={theme.text2} fontWeight={500} fontSize={14}>
              {t(label)}
            </TYPE.body>
          </RowBetween>
        </LabelRow>
        <InputRow>
          <StyledSelect theme={theme} onChange={e => onChange(e.target.value)} defaultValue={defaultValue}>
            {isArray(options)
              ? options.map((value, index) => (
                  <option key={index} value={value}>
                    {t(value)}
                  </option>
                ))
              : Object.entries(options).map(([key, value]) => (
                  <option key={key} value={value}>
                    {t(value)}
                  </option>
                ))}
          </StyledSelect>
        </InputRow>
      </Container>
    </InputPanel>
  )
}
