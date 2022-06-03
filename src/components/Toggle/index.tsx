import { darken } from 'polished'
import styled from 'styled-components/macro'

const Wrapper = styled.button<{ isActive?: boolean; activeElement?: boolean }>`
  align-items: center;
  background: ${({ theme }) => theme.bg1};
  border: none;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  outline: none;
  padding: 0.4rem 0.4rem;
  width: fit-content;
`

const ToggleElementHoverStyle = (hasBgColor: boolean, theme: any, isActive?: boolean) =>
  hasBgColor
    ? {
        opacity: '0.8',
      }
    : {
        background: isActive ? darken(0.05, theme.primary1) : darken(0.05, theme.bg4),
        color: isActive ? theme.white : theme.text3,
      }

const ToggleElement = styled.span<{ isActive?: boolean; bgColor?: string }>`
  background: ${({ theme, bgColor, isActive }) =>
    isActive ? bgColor ?? theme.primary1 : !!bgColor ? theme.bg4 : theme.text3};
  border-radius: 50%;
  height: 24px;
  :hover {
    ${({ bgColor, theme, isActive }) => ToggleElementHoverStyle(!!bgColor, theme, isActive)}
  }
  margin-left: ${({ isActive }) => (isActive ? '2.2em' : '0em')};
  margin-right: ${({ isActive }) => (!isActive ? '2.2em' : '0em')};
  width: 24px;
`

interface ToggleProps {
  id?: string
  bgColor?: string
  isActive: boolean
  toggle: () => void
}

export default function Toggle({ id, bgColor, isActive, toggle }: ToggleProps) {
  return (
    <Wrapper id={id} isActive={isActive} onClick={toggle}>
      <ToggleElement isActive={isActive} bgColor={bgColor} />
    </Wrapper>
  )
}
