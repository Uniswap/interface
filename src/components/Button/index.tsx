import { darken } from 'polished'
import { Check, ChevronDown } from 'react-feather'
import { Button as RebassButton, ButtonProps as ButtonPropsOriginal } from 'rebass/styled-components'
import styled, { DefaultTheme, useTheme } from 'styled-components/macro'

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

export const ButtonPrimary = styled(BaseButton)`
  background-color: ${({ theme }) => theme.accentAction};
  font-size: 20px;
  font-weight: 600;
  padding: 16px;
  color: ${({ theme }) => theme.accentTextLightPrimary};
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

export const ButtonLight = styled(BaseButton)`
  background-color: ${({ theme }) => theme.accentActionSoft};
  color: ${({ theme }) => theme.accentAction};
  font-size: 20px;
  font-weight: 600;

  &:focus {
    box-shadow: 0 0 0 1pt ${({ theme, disabled }) => !disabled && theme.accentActionSoft};
    background-color: ${({ theme, disabled }) => !disabled && theme.accentActionSoft};
  }
  &:hover {
    background-color: ${({ theme, disabled }) => !disabled && theme.accentActionSoft};
  }
  &:active {
    box-shadow: 0 0 0 1pt ${({ theme, disabled }) => !disabled && theme.accentActionSoft};
    background-color: ${({ theme, disabled }) => !disabled && theme.accentActionSoft};
  }
  :disabled {
    opacity: 0.4;
    :hover {
      cursor: auto;
      background-color: transparent;
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
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  background-color: transparent;
  color: ${({ theme }) => theme.textPrimary};
  &:focus {
    box-shadow: 0 0 0 1px ${({ theme }) => theme.deprecated_bg4};
  }
  &:hover {
    box-shadow: 0 0 0 1px ${({ theme }) => theme.textTertiary};
  }
  &:active {
    box-shadow: 0 0 0 1px ${({ theme }) => theme.deprecated_bg4};
  }
  &:disabled {
    opacity: 50%;
    cursor: auto;
  }
`

export const ButtonYellow = styled(BaseButton)`
  background-color: ${({ theme }) => theme.accentWarningSoft};
  color: ${({ theme }) => theme.accentWarning};
  &:focus {
    background-color: ${({ theme }) => theme.accentWarningSoft};
  }
  &:hover {
    background: ${({ theme }) => theme.stateOverlayHover};
    mix-blend-mode: normal;
  }
  &:active {
    background-color: ${({ theme }) => theme.accentWarningSoft};
  }
  &:disabled {
    background-color: ${({ theme }) => theme.accentWarningSoft};
    opacity: 60%;
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
    text-decoration: underline;
  }
  &:hover {
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
        <RowBetween>{children}</RowBetween>
      </ButtonOutlined>
    )
  } else {
    return (
      <ActiveOutlined {...rest} padding="12px 8px" $borderRadius="12px">
        <RowBetween>
          {children}
          <CheckboxWrapper>
            <Circle>
              <ResponsiveCheck size={13} stroke={theme.deprecated_white} />
            </Circle>
          </CheckboxWrapper>
        </RowBetween>
      </ActiveOutlined>
    )
  }
}

const ButtonOverlay = styled.div`
  background-color: transparent;
  bottom: 0;
  border-radius: 16px;
  height: 100%;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
  transition: 150ms ease background-color;
  width: 100%;
`
export enum ButtonSize {
  small,
  medium,
  large,
}
export enum ButtonEmphasis {
  high,
  promotional,
  highSoft,
  medium,
  low,
  warning,
  destructive,
}
interface BaseButtonProps {
  size: ButtonSize
  emphasis: ButtonEmphasis
}

function pickThemeButtonBackgroundColor({ theme, emphasis }: { theme: DefaultTheme; emphasis: ButtonEmphasis }) {
  switch (emphasis) {
    case ButtonEmphasis.high:
      return theme.accentAction
    case ButtonEmphasis.promotional:
      return theme.accentTextLightPrimary
    case ButtonEmphasis.highSoft:
      return theme.accentActionSoft
    case ButtonEmphasis.low:
      return 'transparent'
    case ButtonEmphasis.warning:
      return theme.accentWarningSoft
    case ButtonEmphasis.destructive:
      return theme.accentCritical
    case ButtonEmphasis.medium:
    default:
      return theme.backgroundInteractive
  }
}
function pickThemeButtonFontSize({ size }: { size: ButtonSize }) {
  switch (size) {
    case ButtonSize.large:
      return '20px'
    case ButtonSize.medium:
      return '16px'
    case ButtonSize.small:
      return '14px'
    default:
      return '16px'
  }
}
function pickThemeButtonLineHeight({ size }: { size: ButtonSize }) {
  switch (size) {
    case ButtonSize.large:
      return '24px'
    case ButtonSize.medium:
      return '20px'
    case ButtonSize.small:
      return '16px'
    default:
      return '20px'
  }
}
function pickThemeButtonPadding({ size }: { size: ButtonSize }) {
  switch (size) {
    case ButtonSize.large:
      return '16px'
    case ButtonSize.medium:
      return '10px 12px'
    case ButtonSize.small:
      return '8px'
    default:
      return '10px 12px'
  }
}
function pickThemeButtonTextColor({ theme, emphasis }: { theme: DefaultTheme; emphasis: ButtonEmphasis }) {
  switch (emphasis) {
    case ButtonEmphasis.high:
    case ButtonEmphasis.promotional:
      return theme.accentTextLightPrimary
    case ButtonEmphasis.highSoft:
      return theme.accentAction
    case ButtonEmphasis.low:
      return theme.textSecondary
    case ButtonEmphasis.warning:
      return theme.accentWarning
    case ButtonEmphasis.destructive:
      return theme.accentTextDarkPrimary
    case ButtonEmphasis.medium:
    default:
      return theme.textPrimary
  }
}

const BaseThemeButton = styled.button<BaseButtonProps>`
  align-items: center;
  background-color: ${pickThemeButtonBackgroundColor};
  border-radius: 16px;
  border: 0;
  color: ${pickThemeButtonTextColor};
  cursor: pointer;
  display: flex;
  flex-direction: row;
  font-size: ${pickThemeButtonFontSize};
  font-weight: 600;
  gap: 12px;
  justify-content: center;
  line-height: ${pickThemeButtonLineHeight};
  padding: ${pickThemeButtonPadding};
  position: relative;
  transition: 150ms ease opacity;

  :active {
    ${ButtonOverlay} {
      background-color: ${({ theme }) => theme.stateOverlayPressed};
    }
  }
  :disabled {
    cursor: default;
    opacity: 0.6;
  }
  :focus {
    ${ButtonOverlay} {
      background-color: ${({ theme }) => theme.stateOverlayPressed};
    }
  }
  :hover {
    ${ButtonOverlay} {
      background-color: ${({ theme }) => theme.stateOverlayHover};
    }
  }
`

interface ThemeButtonProps extends React.ComponentPropsWithoutRef<'button'>, BaseButtonProps {}

export const ThemeButton = ({ children, ...rest }: ThemeButtonProps) => {
  return (
    <BaseThemeButton {...rest}>
      <ButtonOverlay />
      {children}
    </BaseThemeButton>
  )
}
