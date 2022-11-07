import { darken } from 'polished'
import styled from 'styled-components/macro'
import { ExternalLink } from 'theme'

const ResourceLink = styled(ExternalLink)<{ color?: string }>`
  display: flex;
  color: ${({ theme, color }) => color ?? theme.accentAction};
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  gap: 4px;
  text-decoration: none;
  text-shadow: 0px 0px 5px ${({ theme, color }) => color ?? theme.accentAction};

  &:hover,
  &:focus {
    color: ${({ theme }) => darken(0.1, theme.accentAction)};
    text-decoration: none;
  }
`
export default function Resource({ name, link, color }: { name: string; link: string; color?: string }) {
  return (
    <ResourceLink color={color} href={link}>
      {name}
      <sup>↗</sup>
    </ResourceLink>
  )
}
