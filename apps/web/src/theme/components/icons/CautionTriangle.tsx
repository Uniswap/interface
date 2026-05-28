import { AlertTriangle } from 'react-feather'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import styled from 'styled-components'

export const CautionTriangle = styled(AlertTriangle)`
  color: ${({ theme }) => theme.deprecated_accentWarning};
`
