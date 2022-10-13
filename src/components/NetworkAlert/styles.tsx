import { ExternalLink } from 'theme'
import styled from 'styled-components/macro'

export const ReadMoreLink = styled((props => <ExternalLink {...props} />))`
  color: ${({ theme }) => theme.text1};
  text-decoration: underline;
  font-family: ${({theme}) => `normal;`}
`
