import styled from 'styled-components'
import { Spinner } from '../../theme'
import { AutoColumn } from '../Column'
import { AutoRow, RowBetween, RowFixed } from '../Row'

export const TokenModalInfo = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  padding: 1rem 1rem;
  margin: 0.25rem 0.5rem;
  justify-content: center;
  user-select: none;
  min-height: 200px;
`

export const ItemList = styled.div`
  flex-grow: 1;
  height: 254px;
  overflow-y: scroll;
  -webkit-overflow-scrolling: touch;
`

export const FadedSpan = styled(RowFixed)`
  color: ${({ theme }) => theme.primary1};
  font-size: 14px;
`

export const GreySpan = styled.span`
  color: ${({ theme }) => theme.text3};
  font-weight: 400;
`

export const SpinnerWrapper = styled(Spinner)`
  margin: 0 0.25rem 0 0.25rem;
  color: ${({ theme }) => theme.text4};
  opacity: 0.6;
`

export const Input = styled.input`
  position: relative;
  display: flex;
  padding: 16px;
  align-items: center;
  width: 100%;
  white-space: nowrap;
  background: none;
  border: none;
  outline: none;
  border-radius: 20px;
  color: ${({ theme }) => theme.text1};
  border-style: solid;
  border: 1px solid ${({ theme }) => theme.bg3};
  -webkit-appearance: none;

  font-size: 18px;

  ::placeholder {
    color: ${({ theme }) => theme.text3};
  }
`

export const FilterWrapper = styled(RowFixed)`
  padding: 8px;
  background-color: ${({ selected, theme }) => selected && theme.bg2};
  color: ${({ selected, theme }) => (selected ? theme.text1 : theme.text2)};
  border-radius: 8px;
  user-select: none;
  & > * {
    user-select: none;
  }
  :hover {
    cursor: pointer;
  }
`

export const PaddedColumn = styled(AutoColumn)`
  padding: 20px;
  padding-bottom: 12px;
`

const PaddedItem = styled(RowBetween)`
  padding: 4px 20px;
  height: 56px;
`

export const MenuItem = styled(PaddedItem)`
  cursor: ${({ disabled }) => !disabled && 'pointer'};
  pointer-events: ${({ disabled }) => disabled && 'none'};
  :hover {
    background-color: ${({ theme, disabled }) => !disabled && theme.bg2};
  }
  opacity: ${({ disabled, selected }) => (disabled || selected ? 0.5 : 1)};
`

export const BaseWrapper = styled(AutoRow)<{ disable?: boolean }>`
  border: 1px solid ${({ theme, disable }) => (disable ? 'transparent' : theme.bg3)};
  padding: 0 6px;
  border-radius: 10px;
  width: 120px;

  :hover {
    cursor: ${({ disable }) => !disable && 'pointer'};
    background-color: ${({ theme, disable }) => !disable && theme.bg2};
  }

  background-color: ${({ theme, disable }) => disable && theme.bg3};
  opacity: ${({ disable }) => disable && '0.4'};
`
