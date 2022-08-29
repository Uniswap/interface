import { RedesignVariant, useRedesignFlag } from 'featureFlags/flags/redesign'
import { darken } from 'polished'
import { useState } from 'react'
import styled, { keyframes } from 'styled-components/macro'

const Wrapper = styled.button<{ isActive?: boolean; activeElement?: boolean; redesignFlag: boolean }>`
  align-items: center;
  background: ${({ isActive, theme, redesignFlag }) =>
    redesignFlag && isActive
      ? theme.accentActionSoft
      : redesignFlag && !isActive
      ? 'transparent'
      : theme.deprecated_bg1};
  border: ${({ redesignFlag, theme, isActive }) =>
    redesignFlag && !isActive ? `1px solid ${theme.backgroundOutline}` : 'none'};
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  outline: none;
  padding: ${({ redesignFlag }) => (redesignFlag ? '4px' : '0.4rem 0.4rem')};
  width: fit-content;
`

const turnOnToggle = keyframes`
  from {
    margin-left: 0em;
    margin-right: 2.2em;
  }
  to {
    margin-left: 2.2em;
    margin-right: 0em;
  }
`

const turnOffToggle = keyframes`
  from {
    margin-left: 2.2em;
    margin-right: 0em;
  }
  to {
    margin-left: 0em;
    margin-right: 2.2em;
  }
`

const ToggleElementHoverStyle = (hasBgColor: boolean, theme: any, isActive?: boolean) =>
  hasBgColor
    ? {
        opacity: '0.8',
      }
    : {
        background: isActive ? darken(0.05, theme.deprecated_primary1) : darken(0.05, theme.deprecated_bg4),
        color: isActive ? theme.deprecated_white : theme.deprecated_text3,
      }

const ToggleElement = styled.span<{ isActive?: boolean; bgColor?: string; isInitialToggleLoad?: boolean }>`
  animation: 0.1s
    ${({ isActive, isInitialToggleLoad }) => (isInitialToggleLoad ? 'none' : isActive ? turnOnToggle : turnOffToggle)}
    ease-in;
  background: ${({ theme, bgColor, isActive }) =>
    isActive ? bgColor ?? theme.deprecated_primary1 : !!bgColor ? theme.deprecated_bg4 : theme.deprecated_text3};
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
  const [isInitialToggleLoad, setIsInitialToggleLoad] = useState(true)
  const redesignFlag = useRedesignFlag()
  const redesignFlagEnabled = redesignFlag === RedesignVariant.Enabled

  const switchToggle = () => {
    toggle()
    if (isInitialToggleLoad) setIsInitialToggleLoad(false)
  }

  return (
    <Wrapper id={id} isActive={isActive} onClick={switchToggle} redesignFlag={redesignFlagEnabled}>
      <ToggleElement isActive={isActive} bgColor={bgColor} isInitialToggleLoad={isInitialToggleLoad} />
    </Wrapper>
  )
}
