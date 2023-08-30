import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import styled, { css } from 'styled-components'

const Header = styled.div<{ isOpen: boolean }>`
  display: flex;
  border-radius: ${({ isOpen }) => (isOpen ? '16px 16px 0px 0px' : '16px')};
  justify-content: space-between;
  background-color: ${({ theme }) => theme.surface1};
  padding: 14px 20px;
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.surface3};
  margin-top: 28px;
  width: 100%;
  align-items: center;

  &:hover {
    background-color: ${({ theme }) => theme.deprecated_stateOverlayHover};
  }

  &:active {
    background-color: ${({ theme }) => theme.deprecated_stateOverlayPressed};
  }

  transition: ${({
    theme: {
      transition: { duration, timing },
    },
  }) => css`background-color ${duration.medium} ${timing.ease}`};
`

const PrimaryHeader = styled.span`
  display: flex;
  align-items: center;
  gap: 16px;
  color: ${({ theme }) => theme.neutral1};
  font-weight: 535;
  line-height: 28px;
  font-size: 20px;
`

const SecondaryHeader = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.neutral2};
`

const SecondaryHeaderContainer = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  color: ${({ theme }) => theme.neutral1};
`

const ContentContainer = styled.div`
  padding: 20px;
  border: 1px solid ${({ theme }) => theme.surface3};
  border-top: none;
  border-radius: 0px 0px 16px 16px;
  background-color: ${({ theme }) => theme.surface1};
`

const InfoContainer = ({
  children,
  primaryHeader,
  secondaryHeader,
  defaultOpen,
  ...props
}: {
  children: JSX.Element
  primaryHeader: string
  secondaryHeader: React.ReactNode
  defaultOpen?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(!!defaultOpen)

  return (
    <div>
      <Header {...props} isOpen={isOpen} onClick={() => setIsOpen(!isOpen)}>
        <PrimaryHeader>
          {primaryHeader} <SecondaryHeader>{secondaryHeader}</SecondaryHeader>
        </PrimaryHeader>
        <SecondaryHeaderContainer>{isOpen ? <ChevronUp /> : <ChevronDown />}</SecondaryHeaderContainer>
      </Header>
      {isOpen && <ContentContainer>{children}</ContentContainer>}
    </div>
  )
}

export default InfoContainer
