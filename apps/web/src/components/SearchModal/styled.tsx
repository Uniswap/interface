import { RowBetween } from 'components/deprecated/Row'
import { deprecatedStyled } from 'lib/styled-components'

export const MenuItem = deprecatedStyled(RowBetween)<{ dim?: boolean }>`
  padding: 4px 20px;
  height: 60px;
  display: grid;
  grid-template-columns: auto minmax(auto, 1fr) auto minmax(0, 72px);
  grid-gap: 16px;
  cursor: ${({ disabled }) => !disabled && 'pointer'};
  pointer-events: ${({ disabled }) => disabled && 'none'};
  &:hover {
    background-color: ${({ theme }) => theme.deprecated_hoverDefault};
  }
  opacity: ${({ disabled, selected, dim }) => (dim || disabled || selected ? 0.4 : 1)};
`

export const SearchInput = deprecatedStyled.input`
  padding: 16px;
  padding-left: 40px;
  height: 40px;
  align-items: center;
  width: 100%;
  white-space: nowrap;
  background-color: ${({ theme }) => theme.surface2};
  border: none;
  outline: none;
  border-radius: 12px;
  color: ${({ theme }) => theme.neutral1};
  border-style: solid;
  border: 1px solid ${({ theme }) => theme.surface3};
  -webkit-appearance: none;
  font-weight: 485;

  font-size: 16px;

  ::placeholder {
    color: ${({ theme }) => theme.neutral3};
    font-size: 16px;
  }
  transition: border 100ms;
  :focus {
    border: 1px solid ${({ theme }) => theme.surface3};
    background-color: ${({ theme }) => theme.surface2};
    outline: none;
  }
`
