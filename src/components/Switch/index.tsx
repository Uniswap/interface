import React, { FC } from 'react'
import { Text } from 'rebass'

import styled from 'styled-components'
import './Switch.css'

const StyledLabel = styled.label<{ isOn: boolean }>`
  background: ${props => props.isOn && `${props.theme.mainPurple}!important`};
`
const StyledText = styled(Text)<{ isOn: boolean }>`
  color: ${props => (props.isOn ? props.theme.text2 : props.theme.purple2)};
`
interface SwitchProps {
  isOn: boolean
  handleToggle: () => void
  label: string
  style?: React.CSSProperties
}

export const Switch: FC<SwitchProps> = ({ isOn, handleToggle, label, style }) => {
  return (
    <>
      <input
        style={style}
        checked={isOn}
        onChange={handleToggle}
        className="react-switch-checkbox"
        type="checkbox"
        id={label}
        value={label}
      />
      <StyledLabel className="react-switch-label" isOn={isOn} htmlFor={label}>
        <span className="react-switch-button" />
      </StyledLabel>
      <StyledText isOn={isOn} marginLeft={'8px'} alignSelf={'center'} fontSize={'11px'} fontWeight={'500'}>
        {label}
      </StyledText>
    </>
  )
}
