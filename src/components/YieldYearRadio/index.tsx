import React from 'react'
import styled from 'styled-components'
import { darken, lighten } from 'polished'

const InputPanel = styled.div<{ hideInput?: boolean }>`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  z-index: 1;
`

const Container = styled.div<{ hideInput: boolean }>`
  background-color: ${({ theme }) => theme.bg1};
`

const InputRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  padding: 0.75rem 0;
  display: flex;
  justify-content: space-around;
  > * + * {
    margin-left: 10px;
  }
`

interface RadioProps {
  id: string
  value: string
  defaultChecked?: boolean
  name: string
  children?: React.ReactNode
  onUserInput: (value: string) => void
}

const YearButtonComponent = ({ children, id, onUserInput, ...rest }: RadioProps) => {
  return (
    <>
      <input
        type="radio"
        id={id}
        {...rest}
        onChange={event => {
          onUserInput(event.target.value)
        }}
      />
      <label htmlFor={id}>{children}</label>
    </>
  )
}

const YearButton = styled(YearButtonComponent)`
  z-index: 100;
  margin: 0;
  padding: 0;
  width: 0;
  height: 0;
  visibility: hidden;

  :checked + label {
    background-color: ${({ theme }) => theme.primary2};
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.1);
  }

  :first-child + label {
    margin-left: 0;
  }

  + label {
    border-radius: 12px;
    border: 1px solid ${({ theme }) => theme.primary2};
    box-shadow: 0 0 0 1pt ${({ theme }) => lighten(0.7, theme.primary1)};
    color: ${({ theme }) => darken(0.2, theme.primary1)};
    cursor: pointer;
    flex: 1 1 auto;
    font-size: 0.8rem;
    padding: 0.5rem;
    text-align: center;
    width: 0;
  }

  + label:hover,
  + label:focus {
    background-color: ${({ theme }) => theme.primary2};
  }
`

interface InputPanelProps {
  value: string
  onUserInput: (value: string) => void
  id: string
}

export default function YieldYearRadio({ id, value, onUserInput }: InputPanelProps) {
  const yearRadioName = 'yield-year'
  return (
    <InputPanel id={id}>
      <Container hideInput={false}>
        <InputRow>
          <YearButton
            id="one-yield-year"
            name={yearRadioName}
            value="1"
            onUserInput={onUserInput}
            defaultChecked={value === '1'}
          >
            1 Year
          </YearButton>
          <YearButton
            id="two-yield-year"
            name={yearRadioName}
            value="2"
            onUserInput={onUserInput}
            defaultChecked={value === '2'}
          >
            2 Years
          </YearButton>
          <YearButton
            id="three-yield-year"
            name={yearRadioName}
            value="3"
            onUserInput={onUserInput}
            defaultChecked={value === '3'}
          >
            3 Years
          </YearButton>
          <YearButton
            id="four-yield-year"
            name={yearRadioName}
            value="4"
            onUserInput={onUserInput}
            defaultChecked={value === '4'}
          >
            4 Years
          </YearButton>
        </InputRow>
      </Container>
    </InputPanel>
  )
}
