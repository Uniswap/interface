import styled, { Theme } from 'lib/theme'

const Rule = styled.hr<{ padded?: true; theme: Theme }>`
  border: none;
  border-bottom: 1px solid ${({ theme }) => theme.outline};
  margin: 0 ${({ padded }) => padded && '1em'};
`

export default Rule
