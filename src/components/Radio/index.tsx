import { darken } from 'polished'
import styled from 'styled-components/macro'

const Wrapper = styled.button<{ isActive?: boolean; activeElement?: boolean }>`
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

const ToggleElementHoverStyle = (hasBgColor: boolean, theme: any, isActive?: boolean) =>
  hasBgColor
    ? {
        opacity: '0.8',
      }
    : {
        background: isActive ? darken(0.05, theme.accentAction) : darken(0.05, theme.deprecated_bg4),
        color: isActive ? theme.white : theme.textTertiary,
      }

const ToggleElement = styled.span<{ isActive?: boolean; bgColor?: string }>`
  animation: 0.1s opacity ease-in;
  background: ${({ theme, bgColor, isActive }) =>
    isActive ? bgColor ?? theme.accentAction : bgColor ? theme.deprecated_bg4 : theme.textTertiary};
  border-radius: 50%;
  :hover {
    ${({ bgColor, theme, isActive }) => ToggleElementHoverStyle(!!bgColor, theme, isActive)}
  }
  width: 10px;
  height: 10px;
  opacity: ${({ isActive }) => (isActive ? '1' : '0')};
`

interface ToggleProps {
  id?: string
  bgColor?: string
  isActive: boolean
  toggle: () => void
}

export default function Radio({ id, isActive, toggle }: ToggleProps) {
  return (
    <Wrapper id={id} isActive={isActive} onClick={toggle}>
      <ToggleElement isActive={isActive} />
    </Wrapper>
  )
}
