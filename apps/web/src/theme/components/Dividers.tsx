import { deprecatedStyled } from 'lib/styled-components'

export const Divider = deprecatedStyled.div`
  width: 100%;
  height: 1px;
  border-width: 0;
  margin: 0;
  background-color: ${({ theme }) => theme.surface3};
`
