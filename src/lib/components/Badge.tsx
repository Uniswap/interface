import styled, { Color } from 'lib/theme'

import Row from './Row'

const Badge = styled(Row)<{ borderRadius?: number; padding?: string; color?: Color }>`
  background-color: ${({ theme, color = 'outline' }) => theme[color]};
  border-radius: ${({ borderRadius }) => `${borderRadius ?? 0.5}em`};
  padding: ${({ padding }) => padding ?? '0.25em 0.375em'};
`

export default Badge
