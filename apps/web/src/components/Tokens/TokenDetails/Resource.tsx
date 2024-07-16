import { darken } from 'polished'
import styled from 'styled-components'
import { ExternalLink } from 'theme/components'

const ResourceLink = styled(ExternalLink)`
  display: flex;
  color: ${({ theme }) => theme.accent1};
  font-weight: 535;
  font-size: 14px;
  line-height: 20px;
  gap: 4px;
  text-decoration: none;

  &:hover,
  &:focus {
    color: ${({ theme }) => darken(0.1, theme.accent1)};
    text-decoration: none;
  }
`
export default function Resource({ name, link }: { name: string; link: string }) {
  return (
    <ResourceLink href={link}>
      {name}
      <sup>↗</sup>
    </ResourceLink>
  )
}
