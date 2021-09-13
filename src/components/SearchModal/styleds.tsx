import { transparentize } from 'polished'
import styled, { ThemeContext } from 'styled-components'
import { AutoColumn } from '../Column'
import { RowBetween } from '../Row'
import { ButtonProps, Flex } from 'rebass'
import border8pxRadius from '../../assets/images/border-8px-radius.png'
import React, { useContext } from 'react'
import { ChevronLeft, Search } from 'react-feather'
import { ButtonInvisbile } from '../Button'

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
    background-color: ${({ theme, disabled }) => !disabled && theme.bg1And2};
  }
  opacity: ${({ disabled, selected }) => (disabled || selected ? 0.5 : 1)};
`

export const TokenPickerItem = styled(Flex)`
  padding: 0 22.5px;
  height: 56px;
  cursor: ${({ disabled }) => !disabled && 'pointer'};
  pointer-events: ${({ disabled }) => disabled && 'none'};
  transition: background-color 0.2s ease;
  background-color: transparent;
  :hover {
    background-color: ${({ theme, disabled }) => !disabled && transparentize(0.4, theme.bg3)};
  }
  opacity: ${({ disabled, selected }) => (disabled || selected ? 0.5 : 1)};
`

export const SearchInput = styled.input<{ fontSize?: string; fontWeight?: number }>`
  position: relative;
  display: flex;
  align-items: center;
  width: ${({ width }) => (width ? width : '100%')};
  height: ${({ height }) => (height ? height : '44px')};
  white-space: nowrap;
  background: ${({ theme }) => transparentize(0.75, theme.purpleBase)};
  border-radius: 8px;
  border: 8px solid transparent;
  border-image: url(${border8pxRadius}) 8;
  padding: 8px 12px;
  :focus {
    border: solid 1px ${({ theme }) => theme.bg5};
    padding: 15px 19px;
  }
  outline: none;
  color: ${({ theme }) => theme.white};
  -webkit-appearance: none;

  font-size: ${({ fontSize }) => (fontSize ? fontSize : '16px')};
  font-weight: ${({ fontWeight }) => (fontWeight ? fontWeight : 'normal')};

  ::placeholder {
    color: ${({ theme }) => theme.purple5};
  }
`
export const Separator = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${({ theme }) => transparentize(0.5, theme.purple5)};
`

const SearchInputWrapper = styled.div<{ width?: string; height?: string }>`
  display: flex;
  justify-content: end;
  border-radius: 8px;
  padding: 8px 14px;
  justify-content: flex-end;
  align-items: center;
  white-space: nowrap;
  border-image: url(${border8pxRadius}) 8;
  background: ${({ theme }) => transparentize(0.75, theme.purpleBase)};
  width: ${({ width }) => (width ? width : '100%')};
  height: ${({ height }) => (height ? height : '44px')};
  outline: none;
  border: 1px solid ${({ theme }) => theme.bg5};
`
const SearchExpandedInput = styled.input<{ fontWeight?: number; fontSize?: string }>`
  width: 62px;
  background: transparent;
  border: transparent;
  outline: none;
  color: ${({ theme }) => theme.text4};
  font-weight: ${({ fontWeight }) => (fontWeight ? fontWeight : 'normal')};
  ::placeholder {
    color: ${({ theme }) => theme.text4};
  }
  :focus::-webkit-input-placeholder {
    color: transparent;
  }
  :focus:-moz-placeholder {
    color: transparent;
  } /* Firefox 18- */
  :focus::-moz-placeholder {
    color: transparent;
  } /* Firefox 19+ */
  :focus:-ms-input-placeholder {
    color: transparent;
  } /* oldIE ;) */
`

export default function SearchInputWithIcon({
  fontWeight,
  width,
  height,
  fontSize,
  className
}: {
  fontWeight?: number
  width?: string
  height?: string
  fontSize?: string
  className?: string
}) {
  const theme = useContext(ThemeContext)

  return (
    <SearchInputWrapper className={className} width={width} height={height}>
      <SearchExpandedInput placeholder="SEARCH" fontSize={fontSize} fontWeight={fontWeight} />
      <Search color={theme.text4} size={14} />
    </SearchInputWrapper>
  )
}

export const Checkbox = styled.input`
  border: 1px solid ${({ theme }) => theme.red2};
  height: 20px;
  margin: 0;
`

export const TextDot = styled.div`
  height: 3px;
  width: 3px;
  background-color: ${({ theme }) => theme.text2};
  border-radius: 50%;
`

export const SeparatorDark = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${({ theme }) => theme.bg3};
`

const StyledGoBackIcon = styled(ChevronLeft)`
  color: ${({ theme }) => theme.purple3};
  width: 16px;
  height: 16px;
  cursor: pointer;
`
export const GoBackIcon = (props: ButtonProps) => {
  return (
    <ButtonInvisbile {...props}>
      <StyledGoBackIcon />
    </ButtonInvisbile>
  )
}
