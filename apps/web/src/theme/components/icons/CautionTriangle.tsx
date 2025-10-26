import { AlertTriangle } from 'react-feather'
// biome-ignore lint/style/noRestrictedImports: styled-components needed for theming existing icon
import styled from 'styled-components'

export const CautionTriangle = styled(AlertTriangle)`
  color: ${({ theme }) => theme.deprecated_accentWarning};
`
