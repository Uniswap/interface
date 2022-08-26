import { darken } from 'polished'
import { Check, ChevronDown } from 'react-feather'
import { Button as RebassButton, ButtonProps as ButtonPropsOriginal } from 'rebass/styled-components'
import styled, { useTheme } from 'styled-components/macro'

import { RowBetween } from '../Row'

type ButtonProps = Omit<ButtonPropsOriginal, 'css'>

export const BaseButton = styled(RebassButton)<
  {
    padding?: string
    width?: string
    $borderRadius?: string
    altDisabledStyle?: boolean
  } & ButtonProps
>`
  padding: ${({ padding }) => padding ?? '16px'};
  width: ${({ width }) => width ?? '100%'};
  font-weight: 500;
  text-align: center;
  border-radius: ${({ $borderRadius }) => $borderRadius ?? '20px'};
  outline: none;
  border: 1px solid transparent;
  color: ${({ theme }) => theme.deprecated_text1};
  text-decoration: none;
  display: flex;
  justify-content: center;
  flex-wrap: nowrap;
  align-items: center;
  cursor: pointer;
  position: relative;
  z-index: 1;
  &:disabled {
    opacity: 50%;
    cursor: auto;
    pointer-events: none;
  }

  will-change: transform;
  transition: transform 450ms ease;
  transform: perspective(1px) translateZ(0);

  > * {
    user-select: none;
  }

  > a {
    text-decoration: none;
  }
`

export const ButtonPrimary = styled(BaseButton)<{ redesignFlag?: boolean }>`
  background-color: ${({ theme, redesignFlag }) => (redesignFlag ? theme.accentAction : theme.deprecated_primary1)};
  font-size: ${({ redesignFlag }) => redesignFlag && '20px'};
  font-weight: ${({ redesignFlag }) => redesignFlag && '600'};
  padding: ${({ redesignFlag }) => redesignFlag && '16px'};
  color: ${({ theme, redesignFlag }) => (redesignFlag ? theme.accentTextLightPrimary : 'white')};
  &:focus {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.05, theme.deprecated_primary1)};
    background-color: ${({ theme }) => darken(0.05, theme.deprecated_primary1)};
  }
  &:hover {
    background-color: ${({ theme }) => darken(0.05, theme.deprecated_primary1)};
  }
  &:active {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.1, theme.deprecated_primary1)};
    background-color: ${({ theme }) => darken(0.1, theme.deprecated_primary1)};
  }
  &:disabled {
    background-color: ${({ theme, altDisabledStyle, disabled }) =>
      altDisabledStyle ? (disabled ? theme.deprecated_primary1 : theme.deprecated_bg2) : theme.deprecated_bg2};
    color: ${({ altDisabledStyle, disabled, theme }) =>
      altDisabledStyle ? (disabled ? theme.deprecated_white : theme.deprecated_text2) : theme.deprecated_text2};
    cursor: auto;
    box-shadow: none;
    border: 1px solid transparent;
    outline: none;
  }
`

export const ButtonLight = styled(BaseButton)<{ redesignFlag?: boolean }>`
  background-color: ${({ theme, redesignFlag }) => (redesignFlag ? theme.accentActionSoft : theme.deprecated_primary5)};
  color: ${({ theme, redesignFlag }) => (redesignFlag ? theme.accentAction : theme.deprecated_primaryText1)};
  font-size: ${({ redesignFlag }) => (redesignFlag ? '20px' : '16px')};
  font-weight: ${({ redesignFlag }) => (redesignFlag ? '600' : '500')};

  &:focus {
    box-shadow: 0 0 0 1pt
      ${({ theme, disabled, redesignFlag }) =>
        !disabled && (redesignFlag ? theme.accentActionSoft : darken(0.03, theme.deprecated_primary5))};
    background-color: ${({ theme, disabled, redesignFlag }) =>
      !disabled && (redesignFlag ? theme.accentActionSoft : darken(0.03, theme.deprecated_primary5))};
  }
  &:hover {
    background-color: ${({ theme, disabled, redesignFlag }) =>
      !disabled && (redesignFlag ? theme.accentActionSoft : darken(0.03, theme.deprecated_primary5))};
  }
  &:active {
    box-shadow: 0 0 0 1pt
      ${({ theme, disabled, redesignFlag }) =>
        !disabled && (redesignFlag ? theme.accentActionSoft : darken(0.05, theme.deprecated_primary5))};
    background-color: ${({ theme, disabled, redesignFlag }) =>
      !disabled && (redesignFlag ? theme.accentActionSoft : darken(0.05, theme.deprecated_primary5))};
  }
  :disabled {
    opacity: 0.4;
    :hover {
      cursor: auto;
      background-color: ${({ theme, redesignFlag }) => (redesignFlag ? 'transparent' : theme.deprecated_primary5)};
      box-shadow: none;
      border: 1px solid transparent;
      outline: none;
    }
  }
`

export const ButtonGray = styled(BaseButton)`
  background-color: ${({ theme }) => theme.deprecated_bg1};
  color: ${({ theme }) => theme.deprecated_text2};
  font-size: 16px;
  font-weight: 500;

  &:hover {
    background-color: ${({ theme, disabled }) => !disabled && darken(0.05, theme.deprecated_bg2)};
  }
  &:active {
    background-color: ${({ theme, disabled }) => !disabled && darken(0.1, theme.deprecated_bg2)};
  }
`

export const ButtonSecondary = styled(BaseButton)`
  border: 1px solid ${({ theme }) => theme.deprecated_primary4};
  color: ${({ theme }) => theme.deprecated_primary1};
  background-color: transparent;
  font-size: 16px;
  border-radius: 12px;
  padding: ${({ padding }) => (padding ? padding : '10px')};

  &:focus {
    box-shadow: 0 0 0 1pt ${({ theme }) => theme.deprecated_primary4};
    border: 1px solid ${({ theme }) => theme.deprecated_primary3};
  }
  &:hover {
    border: 1px solid ${({ theme }) => theme.deprecated_primary3};
  }
  &:active {
    box-shadow: 0 0 0 1pt ${({ theme }) => theme.deprecated_primary4};
    border: 1px solid ${({ theme }) => theme.deprecated_primary3};
  }
  &:disabled {
    opacity: 50%;
    cursor: auto;
  }
  a:hover {
    text-decoration: none;
  }
`

export const ButtonOutlined = styled(BaseButton)`
  border: 1px solid ${({ theme }) => theme.deprecated_bg2};
  background-color: transparent;
  color: ${({ theme }) => theme.deprecated_text1};
  &:focus {
    box-shadow: 0 0 0 1px ${({ theme }) => theme.deprecated_bg4};
  }
  &:hover {
    box-shadow: 0 0 0 1px ${({ theme }) => theme.deprecated_bg4};
  }
  &:active {
    box-shadow: 0 0 0 1px ${({ theme }) => theme.deprecated_bg4};
  }
  &:disabled {
    opacity: 50%;
    cursor: auto;
  }
`

export const ButtonYellow = styled(BaseButton)<{ redesignFlag?: boolean }>`
  background-color: ${({ theme, redesignFlag }) => (redesignFlag ? theme.accentWarningSoft : theme.deprecated_yellow3)};
  color: ${({ theme, redesignFlag }) => (redesignFlag ? theme.accentWarning : 'white')};
  &:focus {
    box-shadow: ${({ theme, redesignFlag }) => !redesignFlag && `0 0 0 1pt ${theme.deprecated_yellow3}`};
    background-color: ${({ theme, redesignFlag }) =>
      redesignFlag ? theme.accentWarningSoft : darken(0.05, theme.deprecated_yellow3)};
  }
  &:hover {
    background: ${({ theme, redesignFlag }) => redesignFlag && theme.stateOverlayHover};
    mix-blend-mode: ${({ redesignFlag }) => redesignFlag && 'normal'};
    background-color: ${({ theme, redesignFlag }) => !redesignFlag && darken(0.05, theme.deprecated_yellow3)};
  }
  &:active {
    box-shadow: ${({ theme, redesignFlag }) => !redesignFlag && `0 0 0 1pt ${darken(0.1, theme.deprecated_yellow3)}`};
    background-color: ${({ theme, redesignFlag }) =>
      redesignFlag ? theme.accentWarningSoft : darken(0.1, theme.deprecated_yellow3)};
  }
  &:disabled {
    background-color: ${({ theme, redesignFlag }) =>
      redesignFlag ? theme.accentWarningSoft : theme.deprecated_yellow3};
    opacity: ${({ redesignFlag }) => (redesignFlag ? '60%' : '50%')};
    cursor: auto;
  }
`

export const ButtonEmpty = styled(BaseButton)`
  background-color: transparent;
  color: ${({ theme }) => theme.deprecated_primary1};
  display: flex;
  justify-content: center;
  align-items: center;

  &:focus {
    text-decoration: underline;
  }
  &:hover {
    text-decoration: none;
  }
  &:active {
    text-decoration: none;
  }
  &:disabled {
    opacity: 50%;
    cursor: auto;
  }
`

export const ButtonText = styled(BaseButton)`
  padding: 0;
  width: fit-content;
  background: none;
  text-decoration: none;
  &:focus {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    text-decoration: underline;
  }
  &:hover {
    // text-decoration: underline;
    opacity: 0.9;
  }
  &:active {
    text-decoration: underline;
  }
  &:disabled {
    opacity: 50%;
    cursor: auto;
  }
`

const ButtonConfirmedStyle = styled(BaseButton)`
  background-color: ${({ theme }) => theme.deprecated_bg3};
  color: ${({ theme }) => theme.deprecated_text1};
  /* border: 1px solid ${({ theme }) => theme.deprecated_green1}; */

  &:disabled {
    opacity: 50%;
    background-color: ${({ theme }) => theme.deprecated_bg2};
    color: ${({ theme }) => theme.deprecated_text2};
    cursor: auto;
  }
`

const ButtonErrorStyle = styled(BaseButton)`
  background-color: ${({ theme }) => theme.deprecated_red1};
  border: 1px solid ${({ theme }) => theme.deprecated_red1};

  &:focus {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.05, theme.deprecated_red1)};
    background-color: ${({ theme }) => darken(0.05, theme.deprecated_red1)};
  }
  &:hover {
    background-color: ${({ theme }) => darken(0.05, theme.deprecated_red1)};
  }
  &:active {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.1, theme.deprecated_red1)};
    background-color: ${({ theme }) => darken(0.1, theme.deprecated_red1)};
  }
  &:disabled {
    opacity: 50%;
    cursor: auto;
    box-shadow: none;
    background-color: ${({ theme }) => theme.deprecated_red1};
    border: 1px solid ${({ theme }) => theme.deprecated_red1};
  }
`

export function ButtonConfirmed({
  confirmed,
  altDisabledStyle,
  ...rest
}: { confirmed?: boolean; altDisabledStyle?: boolean } & ButtonProps) {
  if (confirmed) {
    return <ButtonConfirmedStyle {...rest} />
  } else {
    return <ButtonPrimary {...rest} altDisabledStyle={altDisabledStyle} />
  }
}

export function ButtonError({ error, ...rest }: { error?: boolean } & ButtonProps) {
  if (error) {
    return <ButtonErrorStyle {...rest} />
  } else {
    return <ButtonPrimary {...rest} />
  }
}

export function ButtonDropdown({ disabled = false, children, ...rest }: { disabled?: boolean } & ButtonProps) {
  return (
    <ButtonPrimary {...rest} disabled={disabled}>
      <RowBetween>
        <div style={{ display: 'flex', alignItems: 'center' }}>{children}</div>
        <ChevronDown size={24} />
      </RowBetween>
    </ButtonPrimary>
  )
}

export function ButtonDropdownLight({ disabled = false, children, ...rest }: { disabled?: boolean } & ButtonProps) {
  return (
    <ButtonOutlined {...rest} disabled={disabled}>
      <RowBetween>
        <div style={{ display: 'flex', alignItems: 'center' }}>{children}</div>
        <ChevronDown size={24} />
      </RowBetween>
    </ButtonOutlined>
  )
}

const ActiveOutlined = styled(ButtonOutlined)`
  border: 1px solid;
  border-color: ${({ theme }) => theme.deprecated_primary1};
`

const Circle = styled.div`
  height: 17px;
  width: 17px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.deprecated_primary1};
  display: flex;
  align-items: center;
  justify-content: center;
`

const CheckboxWrapper = styled.div`
  width: 20px;
  padding: 0 10px;
  position: absolute;
  top: 11px;
  right: 15px;
`

const ResponsiveCheck = styled(Check)`
  size: 13px;
`

export function ButtonRadioChecked({ active = false, children, ...rest }: { active?: boolean } & ButtonProps) {
  const theme = useTheme()

  if (!active) {
    return (
      <ButtonOutlined $borderRadius="12px" padding="12px 8px" {...rest}>
        {<RowBetween>{children}</RowBetween>}
      </ButtonOutlined>
    )
  } else {
    return (
      <ActiveOutlined {...rest} padding="12px 8px" $borderRadius="12px">
        {
          <RowBetween>
            {children}
            <CheckboxWrapper>
              <Circle>
                <ResponsiveCheck size={13} stroke={theme.deprecated_white} />
              </Circle>
            </CheckboxWrapper>
          </RowBetween>
        }
      </ActiveOutlined>
    )
  }
}
