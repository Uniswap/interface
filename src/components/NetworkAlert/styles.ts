import styled from 'styled-components/macro'
import { ExternalLink } from 'theme'

export const ReadMoreLink = styled(ExternalLink)`
  color: ${({ theme }) => theme.text1};
  text-decoration: underline;
`
