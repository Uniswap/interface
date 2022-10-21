import { useState } from 'react'
import styled from 'styled-components/macro'
import { ChevronDown, ChevronUp } from 'react-feather'

const Header = styled.div`
  display: flex;
  border-radius: 16px 16px 0px 0px;
  justify-content: space-between;
  background-color: ${({ theme }) => theme.backgroundSurface};
  padding: 14px 20px;
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  margin-top: 28px;
  width: 100%;
`

const PrimaryHeader = styled.span`
  color: ${({ theme }) => theme.textPrimary};
`

const SecondaryHeader = styled.span`
  color: ${({ theme }) => theme.textSecondary};
`

const SecondaryHeaderContainer = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  color: ${({ theme }) => theme.textPrimary};
`

const ContentContainer = styled.div`
  padding: 20px;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-top: none;
`

const InfoContainer = ({
  children,
  primaryHeader,
  secondaryHeader,
}: {
  children: JSX.Element
  primaryHeader: string
  secondaryHeader: React.ReactNode
}) => {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div>
      <Header onClick={() => setIsOpen(!isOpen)}>
        <PrimaryHeader>{primaryHeader}</PrimaryHeader>
        <SecondaryHeaderContainer>
          <SecondaryHeader>{secondaryHeader}</SecondaryHeader>
          {isOpen ? <ChevronUp /> : <ChevronDown />}
        </SecondaryHeaderContainer>
      </Header>
      {isOpen && <ContentContainer>{children}</ContentContainer>}
    </div>
  )
}

export default InfoContainer
