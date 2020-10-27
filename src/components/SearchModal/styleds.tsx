import { transparentize } from 'polished'
import styled from 'styled-components'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'

export const ModalInfo = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  padding: 1rem 1rem;
  margin: 0.25rem 0.5rem;
  justify-content: center;
  flex: 1;
  user-select: none;
`

export const FadedSpan = styled(RowFixed)`
  color: ${({ theme }) => theme.primary1};
  font-size: 14px;
`

export const PaddedColumn = styled(AutoColumn)`
  padding: 20px;
  padding-bottom: 12px;
`

export const MenuItem = styled(RowBetween)`
  padding: 4px 20px;
  height: 56px;
  display: grid;
  grid-template-columns: auto minmax(auto, 1fr) auto minmax(0, 72px);
  grid-gap: 8px;
  cursor: ${({ disabled }) => !disabled && 'pointer'};
  pointer-events: ${({ disabled }) => disabled && 'none'};
  :hover {
    background-color: ${({ theme, disabled }) => !disabled && theme.bg2};
  }
  opacity: ${({ disabled, selected }) => (disabled || selected ? 0.5 : 1)};
`

export const SearchInput = styled.input`
  position: relative;
  display: flex;
  padding: 16px 12px;
  align-items: center;
  width: 100%;
  height: 44px;
  white-space: nowrap;
  background: ${({ theme }) => transparentize(0.75, theme.purpleBase)};
  border: 1px solid;
  border-image-slice: 1;
  border-width: 1px;
  border-image-source: linear-gradient(180deg, rgba(41, 38, 67, 0) 0%, rgba(41, 38, 67, 0.65) 100%);
  /* FIXME: not working */
  border-radius: 8px;
  outline: none;
  color: ${({ theme }) => theme.white};
  -webkit-appearance: none;

  font-size: 16px;

  ::placeholder {
    color: ${({ theme }) => theme.purple5};
  }
`
export const Separator = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${({ theme }) => transparentize(.5, theme.purple5)};
`

export const SeparatorDark = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${({ theme }) => theme.bg3};
`
