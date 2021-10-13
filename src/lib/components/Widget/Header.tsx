import Logo from 'lib/assets/Logo'
import themed, { TYPE } from 'lib/themed'
import { ReactNode } from 'react'

import BaseHeader from '../Header'

const ThemedLogo = themed(Logo)`
  fill: ${({ theme }) => theme.icon};
  mix-blend-mode: lighten;
  padding: 1.5px 2px;
  transition: transform 0.3s ease;

  :hover {
    cursor: pointer;
    opacity: 0.7;
    transform: rotate(-5deg);
  }
`

export interface HeaderProps {
  path: string
  title: string
  children: ReactNode
}

function Title({ path, title }: Omit<HeaderProps, 'children'>) {
  return (
    <>
      <a href={`https://app.uniswap.org/#${path}`}>
        <ThemedLogo />
      </a>
      <span style={{ width: 8 }} />
      <TYPE.title>{title}</TYPE.title>
    </>
  )
}

export default function Header({ path, title, children }: HeaderProps) {
  return <BaseHeader title={<Title path={path} title={title} />}>{children}</BaseHeader>
}
