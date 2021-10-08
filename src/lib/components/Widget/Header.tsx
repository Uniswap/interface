import { ReactNode } from 'react'

import { ReactComponent as Logo } from '../../assets/logo.svg'
import themed, { TYPE, useTheme } from '../../themed'
import BaseHeader from '../Header'

const LogoWrapper = themed.div`
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
  const { icon } = useTheme()
  return (
    <>
      <a href={`https://app.uniswap.org/#${path}`}>
        <LogoWrapper>
          <Logo height="18" width="18" fill={icon} style={{ mixBlendMode: 'lighten' }} />
        </LogoWrapper>
      </a>
      <span style={{ width: 8 }} />
      <TYPE.header.title>{title}</TYPE.header.title>
    </>
  )
}

export default function Header({ path, title, children }: HeaderProps) {
  return <BaseHeader title={<Title path={path} title={title} />}>{children}</BaseHeader>
}
