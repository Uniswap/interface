import { Icon } from 'lib/icons'
import styled, { Color } from 'lib/theme'
import { ComponentProps } from 'react'

export const BaseButton = styled.button`
  background-color: transparent;
  border: none;
  border-radius: 0.5em;
  color: currentColor;
  cursor: pointer;
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
  margin: 0;
  padding: 0;

  :disabled {
    cursor: initial;
    filter: saturate(0) opacity(0.4);
  }
`

export default styled(BaseButton)<{ color?: Color }>`
  color: ${({ color = 'interactive', theme }) => color === 'interactive' && theme.onInteractive};

  :enabled {
    background-color: ${({ color = 'interactive', theme }) => theme[color]};
  }

  :enabled:hover {
    background-color: ${({ color = 'interactive', theme }) => theme.onHover(theme[color])};
  }

  :disabled {
    border: 1px solid ${({ theme }) => theme.outline};
    color: ${({ theme }) => theme.secondary};
    cursor: initial;
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

export function IconButton({ icon: Icon, iconProps, ...props }: IconButtonProps & ComponentProps<typeof BaseButton>) {
  return (
    <SecondaryButton {...props}>
      <Icon {...iconProps} />
    </SecondaryButton>
  )
}
