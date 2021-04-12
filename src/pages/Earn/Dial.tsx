import React from 'react'
import { buildStyles, CircularProgressbar } from 'react-circular-progressbar'
import styled, { useTheme } from 'styled-components'

interface Props {
  children?: React.ReactNode
  disabled?: boolean
  size?: number
  value: number
}

export const Dial: React.FC<Props> = ({ children, disabled, size = 300, value }: Props) => {
  const theme = useTheme()
  return (
    <StyledDial size={size}>
      <StyledOuter>
        <CircularProgressbar
          value={value}
          styles={buildStyles({
            strokeLinecap: 'round',
            pathColor: !disabled ? theme.primary1 : theme.text3,
            pathTransitionDuration: 1,
          })}
        />
      </StyledOuter>
      <StyledInner size={size}>{children}</StyledInner>
    </StyledDial>
  )
}

interface StyledInnerProps {
  size: number
}

const PAD = 24

const StyledDial = styled.div<StyledInnerProps>`
  padding: ${PAD}px;
  position: relative;
  height: ${(props) => props.size}px;
  width: ${(props) => props.size}px;
`

const StyledInner = styled.div<StyledInnerProps>`
  align-items: center;
  background-color: ${(props) => props.theme.bg2};
  border-radius: ${(props) => props.size - PAD * 2}px;
  display: flex;
  justify-content: center;
  position: relative;
  height: ${(props) => props.size - PAD * 2}px;
  width: ${(props) => props.size - PAD * 2}px;
`

const StyledOuter = styled.div`
  background-color: #000;
  border-radius: 10000px;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
`
