import { ReactNode } from 'react'

import themed from '../themed'

const Row = themed.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  line-height: 20px;
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
  color: ${({ theme }) => theme.text};
  display: flex;
  user-select: none;
`

const Divider = themed.hr`
  border-color: ${({ theme }) => theme.icon};
  border-top: none;
  border-right: none;
  border-left: none;
  margin-bottom: 0;
  width: 100%;
`

export interface HeaderProps {
  title: ReactNode
  divider?: boolean
  children: ReactNode
}

export default function Header({ title, divider, children }: HeaderProps) {
  return (
    <>
      <Row>
        <Title>{title}</Title>
        <Toolbar>{children}</Toolbar>
      </Row>
      {divider && <Divider />}
    </>
  )
}
