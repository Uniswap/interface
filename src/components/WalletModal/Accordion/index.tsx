import React, { PropsWithChildren, ReactNode } from 'react'
import { ChevronDown } from 'react-feather'
import styled from 'styled-components/macro'
import { ClickableStyle, ThemedText } from 'theme'

const InfoCard = styled.div`
  background-color: ${({ theme }) => theme.backgroundModule};
  &:focus {
    background-color: ${({ theme }) => theme.hoverState};
  }
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
`

const StyledChevron = styled(ChevronDown)`
  height: 16px;
  width: 16px;
`

const Header = styled.div`
  ${ClickableStyle}
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  color: ${({ theme }) => theme.textSecondary};
  padding: 12px;
`

const Body = styled.div`
  padding: 0 12px 12px;
`

export default function Accordion({
  header,
  children,
  open,
  setOpen,
}: PropsWithChildren<{
  header: ReactNode
  open: boolean
  setOpen: (b: boolean) => void
}>) {
  const content = (
    <InfoCard onClick={() => !open && setOpen(true)}>
      <Header onClick={() => setOpen(!open)}>
        <ThemedText.Caption color="textSecondary">{header}</ThemedText.Caption>
        <StyledChevron />
      </Header>
      {open && <Body>{children}</Body>}
    </InfoCard>
  )

  return content
}
