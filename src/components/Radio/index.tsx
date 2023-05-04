import { RowBetween } from 'components/Row'
import { darken } from 'polished'
import { PropsWithChildren } from 'react'
import styled, { DefaultTheme } from 'styled-components/macro'

const Button = styled.button<{ isActive?: boolean; activeElement?: boolean }>`
  align-items: center;
  background: transparent;
  border: 2px solid ${({ theme, isActive }) => (isActive ? theme.accentAction : theme.backgroundOutline)};
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  outline: none;
  padding: 5px;
  width: fit-content;
`

const toggleElementHoverStyle = (hasBgColor: boolean, theme: DefaultTheme, isActive?: boolean) =>
  hasBgColor
    ? {
        opacity: '0.8',
      }
    : {
        background: isActive ? darken(0.05, theme.accentAction) : darken(0.05, theme.deprecated_bg4),
        color: isActive ? theme.white : theme.textTertiary,
      }

const ButtonFill = styled.span<{ isActive?: boolean; bgColor?: string }>`
  animation: 0.1s opacity ease-in;
  background: ${({ theme, bgColor, isActive }) =>
    isActive ? bgColor ?? theme.accentAction : bgColor ? theme.deprecated_bg4 : theme.textTertiary};
  border-radius: 50%;
  :hover {
    ${({ bgColor, theme, isActive }) => toggleElementHoverStyle(!!bgColor, theme, isActive)}
  }
  width: 10px;
  height: 10px;
  opacity: ${({ isActive }) => (isActive ? '1' : '0')};
`

const Container = styled(RowBetween)`
  cursor: pointer;
`

interface RadioProps {
  className?: string
  isActive: boolean
  toggle: () => void
}

export default function Radio({ className, isActive, children, toggle }: PropsWithChildren<RadioProps>) {
  return (
    <Container className={className} onClick={toggle}>
      {children}
      <Button isActive={isActive}>
        <ButtonFill isActive={isActive} />
      </Button>
    </Container>
  )
}
