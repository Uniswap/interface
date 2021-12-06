import { Icon } from 'react-feather'

import styled from './styled'
import { Color, Theme } from './theme'

interface IconOptions {
  color?: Color | 'currentColor'
}

export function icon(Icon: Icon, { color = 'currentColor' }: IconOptions = {}) {
  return styled(Icon)<{ theme: Theme }>`
    clip-path: stroke-box;
    height: 1em;
    stroke: ${({ theme }) => (color === 'currentColor' ? 'currentColor' : theme[color])};
    width: 1em;
  `
}
