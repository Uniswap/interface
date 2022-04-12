import { Icon } from 'lib/icons'
import styled, { Color, css, keyframes } from 'lib/theme'
import { ComponentProps, forwardRef } from 'react'

export const BaseButton = styled.button`
  background-color: transparent;
  border: none;
  border-radius: 0.5em;
  color: currentColor;
  cursor: pointer;
  font-size: inherit;
  font-weight: inherit;
  height: inherit;
  line-height: inherit;
  margin: 0;
  padding: 0;

  :disabled {
    cursor: initial;
    filter: saturate(0) opacity(0.4);
  }
`

const bleedIn = (outline: string, color: string) => keyframes`
  from {
    border-color: ${color};
    background-color: transparent;
  }
  to {
    border-color: transparent
    background-color: ${color};
  }
`

const bleedInCss = css<{ color?: Color }>`
  :enabled {
    animation: ${({ color = 'interactive', theme }) => bleedIn(theme.outline, theme[color])} 0.125s linear;
    will-change: border-color, background-color;
  }
`

export default styled(BaseButton)<{ color?: Color; bleedIn?: boolean }>`
  border: 1px solid transparent;
  color: ${({ color = 'interactive', theme }) => color === 'interactive' && theme.onInteractive};

  :enabled {
    background-color: ${({ color = 'interactive', theme }) => theme[color]};
    ${({ bleedIn }) => bleedIn && bleedInCss}
  }

  :enabled:hover {
    background-color: ${({ color = 'interactive', theme }) => theme.onHover(theme[color])};
  }

  :disabled {
    border-color: ${({ theme }) => theme.outline};
    color: ${({ theme }) => theme.secondary};
  }
`

const transparentButton = (defaultColor: Color) => styled(BaseButton)<{ color?: Color }>`
  color: ${({ color = defaultColor, theme }) => theme[color]};

  :enabled:hover {
    color: ${({ color = defaultColor, theme }) => theme.onHover(theme[color])};
  }
`

export const TextButton = transparentButton('accent')

const SecondaryButton = transparentButton('secondary')

interface IconButtonProps {
  icon: Icon
  iconProps?: ComponentProps<Icon>
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps & ComponentProps<typeof BaseButton>>(
  function IconButton({ icon: Icon, iconProps, ...props }: IconButtonProps & ComponentProps<typeof BaseButton>, ref) {
    return (
      <SecondaryButton {...props} ref={ref}>
        <Icon {...iconProps} />
      </SecondaryButton>
    )
  }
)
