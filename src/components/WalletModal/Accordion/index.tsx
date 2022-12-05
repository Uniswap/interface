import React, { PropsWithChildren, ReactNode } from 'react'
import { ChevronDown } from 'react-feather'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const InfoCard = styled.div`
  background-color: ${({ theme }) => theme.backgroundModule};
  &:focus {
    background-color: ${({ theme }) => theme.hoverState};
  }
  border: none;
  display: flex;
  flex-direction: column;
  padding: 12px;
`

const StyledChevron = styled(ChevronDown)`
  height: 16px;
  width: 16px;
`

const Header = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  color: ${({ theme }) => theme.textSecondary};
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
    <InfoCard onClick={() => setOpen(!open)}>
      <Header>
        <ThemedText.Caption color="textSecondary">{header}</ThemedText.Caption>
        <StyledChevron />
      </Header>
      {open && <ThemedText.Caption paddingTop="12px">{children}</ThemedText.Caption>}
    </InfoCard>
  )

  return content
}
