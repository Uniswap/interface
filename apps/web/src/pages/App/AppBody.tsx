import { deprecatedStyled } from 'lib/styled-components'
import { Z_INDEX } from 'theme/zIndex'

export const BodyWrapper = deprecatedStyled.main<BodyWrapperProps>`
  position: relative;
  margin-top: ${({ $margin }) => $margin ?? '0px'};
  max-width: ${({ $maxWidth }) => $maxWidth ?? '420px'};
  width: 100%;
  background: ${({ theme }) => theme.surface1};
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.surface3};
  margin-top: 1rem;
  margin-left: auto;
  margin-right: auto;
  z-index: ${Z_INDEX.default};
`

interface BodyWrapperProps {
  $margin?: string
  $maxWidth?: string
}
