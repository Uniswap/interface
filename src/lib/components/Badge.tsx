import styled from 'lib/theme'

import Row from './Row'

export const Badge = styled(Row)<{ borderRadius?: number; padding?: string }>`
  background-color: ${({ theme }) => theme.outline};
  border-radius: ${({ borderRadius }) => `${borderRadius ?? 0.5}em`};
  padding: ${({ padding }) => padding ?? '0.25em 0.375em'};
  z-index: 2;
`

export const BadgeDark = styled(Badge)`
  background-color: ${({ theme }) => theme.module};
`
