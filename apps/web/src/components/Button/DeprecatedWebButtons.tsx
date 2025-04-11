import styled, { DefaultTheme } from 'lib/styled-components'
import { darken } from 'polished'
import { forwardRef } from 'react'
import { ButtonProps as ButtonPropsOriginal, Button as RebassButton } from 'rebass/styled-components'

type ButtonProps = Omit<ButtonPropsOriginal, 'css'>

const ButtonOverlay = styled.div`
  background-color: transparent;
  bottom: 0;
  border-radius: inherit;
  height: 100%;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
  transition: 150ms ease background-color;
  width: 100%;
`

type BaseButtonProps = {
  padding?: string
  width?: string
  $borderRadius?: string
  altDisabledStyle?: boolean
} & ButtonProps

/** @deprecated Please use `Button` from `ui/src` and replace this usage if possible */
const BaseButton = styled(RebassButton)<BaseButtonProps>`
  padding: ${({ padding }) => padding ?? '16px'};
  width: ${({ width }) => width ?? '100%'};
  line-height: 24px;
  font-weight: 535;
  text-align: center;
  border-radius: ${({ $borderRadius }) => $borderRadius ?? '16px'};
  outline: none;
  border: 1px solid transparent;
  color: ${({ theme }) => theme.neutral1};
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

/** @deprecated Please use `Button` from `ui/src` */
export const ButtonGray = styled(BaseButton)`
  background-color: ${({ theme }) => theme.surface1};
  color: ${({ theme }) => theme.neutral2};
  border: 1px solid ${({ theme }) => theme.surface3};
  font-size: 16px;
  font-weight: 535;

  &:hover {
    background-color: ${({ theme, disabled }) => !disabled && darken(0.05, theme.surface2)};
  }
  &:active {
    background-color: ${({ theme, disabled }) => !disabled && darken(0.1, theme.surface2)};
  }
`

/** @deprecated Please use `Button` from `ui/src` and replace this usage if possible */
export const ButtonEmpty = styled(BaseButton)`
  background-color: transparent;
  color: ${({ theme }) => theme.accent1};
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

/** @deprecated Please use `Button` from `ui/src` and replace this usage if possible */
export enum ButtonEmphasis {
  highSoft = 'highSoft',
  medium = 'medium',
}
interface BaseThemeButtonProps {
  emphasis: ButtonEmphasis
}

function pickThemeButtonBackgroundColor({ theme, emphasis }: { theme: DefaultTheme; emphasis: ButtonEmphasis }) {
  switch (emphasis) {
    case ButtonEmphasis.highSoft:
      return theme.accent2
    case ButtonEmphasis.medium:
    default:
      return theme.surface3
  }
}

function pickThemeButtonTextColor({ theme, emphasis }: { theme: DefaultTheme; emphasis: ButtonEmphasis }) {
  switch (emphasis) {
    case ButtonEmphasis.highSoft:
      return theme.accent1
    case ButtonEmphasis.medium:
    default:
      return theme.neutral1
  }
}

const BaseThemeButton = styled.button<BaseThemeButtonProps>`
  align-items: center;
  background-color: ${pickThemeButtonBackgroundColor};
  border-radius: 16px;
  border: 0;
  color: ${pickThemeButtonTextColor};
  cursor: pointer;
  display: flex;
  flex-direction: row;
  font-size: 16px;
  font-weight: 535;
  gap: 12px;
  justify-content: center;
  line-height: 20px;
  padding: 10px 12px;
  position: relative;
  transition: 150ms ease opacity;
  user-select: none;

  :active {
    ${ButtonOverlay} {
      background-color: ${({ theme }) => theme.deprecated_stateOverlayPressed};
    }
  }
  :focus {
    ${ButtonOverlay} {
      background-color: ${({ theme }) => theme.deprecated_stateOverlayPressed};
    }
  }
  :hover {
    ${ButtonOverlay} {
      background-color: ${({ theme }) => theme.deprecated_stateOverlayHover};
    }
  }
  :disabled {
    cursor: default;
    opacity: 0.6;
  }
  :disabled:active,
  :disabled:focus,
  :disabled:hover {
    ${ButtonOverlay} {
      background-color: transparent;
    }
  }
`

interface ThemeButtonProps extends React.ComponentPropsWithoutRef<'button'>, BaseThemeButtonProps {}
type ThemeButtonRef = HTMLButtonElement

/** @deprecated Please use `Button` from `ui/src` and replace this usage if possible */
export const ThemeButton = forwardRef<ThemeButtonRef, ThemeButtonProps>(function ThemeButton(
  { children, ...rest },
  ref,
) {
  return (
    <BaseThemeButton {...rest} ref={ref}>
      <ButtonOverlay />
      {children}
    </BaseThemeButton>
  )
})
