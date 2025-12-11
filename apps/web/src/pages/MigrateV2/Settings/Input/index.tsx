import Row from 'components/deprecated/Row'
import { deprecatedStyled } from 'lib/styled-components'

export const Input = deprecatedStyled.input`
  width: 100%;
  display: flex;
  flex: 1;
  font-size: 16px;
  border: 0;
  outline: none;
  background: transparent;
  text-align: right;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
  ::placeholder {
    color: ${({ theme }) => theme.neutral3};
  }
`

export const InputContainer = deprecatedStyled(Row)<{ error?: boolean }>`
  padding: 8px 16px;
  border-radius: 12px;
  width: auto;
  min-width: 100px;
  flex: 1;
  input {
    color: ${({ theme, error }) => (error ? theme.critical : theme.neutral1)};
  }
  border: 1px solid ${({ theme, error }) => (error ? theme.critical : theme.surface2)};
  ${({ theme, error }) =>
    error
      ? `
        border: 1px solid ${theme.critical};
        :focus-within {
          border-color: ${theme.deprecated_accentFailureSoft};
        }
      `
      : `
        border: 1px solid ${theme.surface3};
        :focus-within {
          border-color: ${theme.accent2};
        }
      `}
`
