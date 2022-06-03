import { darken } from 'polished'
import styled from 'styled-components/macro'

const Wrapper = styled.button<{ isActive?: boolean; activeElement?: boolean }>`
  border-radius: 20px;
  border: none;
  background: ${({ theme }) => theme.bg1};
  display: flex;
  cursor: pointer;
  outline: none;
  padding: 0.4rem 0.4rem;
  align-items: center;
  height: 32px;
  width: 56px;
  position: relative;
`

const ToggleElement = styled.span<{ isActive?: boolean; isOnSwitch?: boolean }>`
  border-radius: 50%;
  height: 24px;
  width: 24px;
  position: absolute;
  background: ${({ theme, isActive, isOnSwitch }) => (isActive ? (isOnSwitch ? theme.primary1 : theme.text3) : 'none')};
  :hover {
    user-select: ${({ isOnSwitch }) => (isOnSwitch ? 'none' : 'initial')};
    background: ${({ theme, isActive, isOnSwitch }) =>
      isActive ? (isOnSwitch ? darken(0.05, theme.primary1) : darken(0.05, theme.bg4)) : 'none'};
    color: ${({ theme, isActive, isOnSwitch }) => (isActive ? (isOnSwitch ? theme.white : theme.white) : theme.text3)};
  }
`

interface ToggleProps {
  id?: string
  isActive: boolean
  toggle: () => void
}

export default function SimpleToggle({ id, isActive, toggle }: ToggleProps) {
  return (
    <Wrapper id={id} isActive={isActive} onClick={toggle}>
      <ToggleElement isActive={!isActive} isOnSwitch={false} style={{ left: '4px' }} />
      <ToggleElement isActive={isActive} isOnSwitch={true} style={{ right: '4px' }} />
    </Wrapper>
  )
}
