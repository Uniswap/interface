import Column from 'components/Column'
import React, { PropsWithChildren, ReactElement } from 'react'
import { ChevronDown } from 'react-feather'
import styled from 'styled-components/macro'

import Row, { RowBetween } from '../Row'

const ButtonContainer = styled(Row)`
  cursor: pointer;
  justify-content: flex-end;
  width: unset;
`

const ExpandIcon = styled(ChevronDown)<{ $isOpen: boolean }>`
  color: ${({ theme }) => theme.textSecondary};
  transform: ${({ $isOpen }) => ($isOpen ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform ${({ theme }) => theme.transition.duration.medium};
`

export default function Expand({
  header,
  button,
  children,
  testId,
  isOpen,
  onToggle,
}: PropsWithChildren<{
  header: ReactElement
  button: ReactElement
  testId?: string
  isOpen: boolean
  onToggle: () => void
}>) {
  return (
    <Column gap="md">
      <RowBetween>
        {header}
        <ButtonContainer data-testid={testId} onClick={onToggle} aria-expanded={isOpen}>
          {button}
          <ExpandIcon $isOpen={isOpen} />
        </ButtonContainer>
      </RowBetween>
      {isOpen && children}
    </Column>
  )
}
