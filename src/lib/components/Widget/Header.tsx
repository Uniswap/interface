import { ReactComponent as Logo } from 'assets/svg/logo.svg'
import { ReactNode } from 'react'

import themed, { useTheme } from '../../themed'

const Wrapper = themed.div`
  display: flex;
  height: 24px;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding: 0 8px;
`

const Toolbar = themed.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;

  > * {
    margin-left: 8px;
  }
`

const Title = themed.div`
  display: flex;
  user-select: none;
  color: ${({ theme }) => theme.text1};
`

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

export default function Header({ path, title, children }: HeaderProps) {
  const { icon1 } = useTheme()

  return (
    <Wrapper>
      <Title>
        <a href={`https://app.uniswap.org/#${path}`}>
          <LogoWrapper>
            <Logo width="17" fill={icon1} style={{ mixBlendMode: 'lighten' }} />
          </LogoWrapper>
        </a>
        <span style={{ width: 8 }} />
        {title}
      </Title>
      <Toolbar>{children}</Toolbar>
    </Wrapper>
  )
}
