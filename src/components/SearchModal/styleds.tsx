import { transparentize } from 'polished'
import styled from 'styled-components'
import { AutoColumn } from '../Column'
import { RowBetween } from '../Row'
import { Flex } from 'rebass'
import border8pxRadius from '../../assets/images/border-8px-radius.png'

export const ModalInfo = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  padding: 1rem 1rem;
  margin: 0.25rem 0.5rem;
  justify-content: center;
  flex: 1;
  user-select: none;
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

export const TokenPickerItem = styled(Flex)`
  padding: 20px 0;
  height: 56px;
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
  padding: 0px 8px;
  align-items: center;
  width: 100%;
  height: 44px;
  white-space: nowrap;
  background: ${({ theme }) => transparentize(0.75, theme.purpleBase)};
  border: 8px solid transparent;
  border-radius: 8px;
  border-image: url(${border8pxRadius}) 8;
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
  background-color: ${({ theme }) => transparentize(0.5, theme.purple5)};
`
export const TokenListContainer = styled(Flex)`
  min-height: 560px;
  max-height: 560px;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    min-height: 448px;
    max-height: 448px;
  `}
  ${({ theme }) => theme.mediaWidth.upToMedium`
    min-height: 280px;
    max-height: 280px;
  `}
`
