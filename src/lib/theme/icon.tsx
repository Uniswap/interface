import { Icon } from 'react-feather'

import styled from './styled'
import { Color } from './theme'

interface IconOptions {
  color?: Color | 'currentColor'
}

export function icon(Icon: Icon, { color = 'currentColor' }: IconOptions = {}) {
  return styled(Icon)`
    clip-path: stroke-box;
    height: 1em;
    stroke: ${({ theme }) => (color === 'currentColor' ? 'currentColor' : theme[color])};
    width: 1em;
  `
}
