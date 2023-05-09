import Column from 'components/Column'
import React, { PropsWithChildren, ReactElement, useState } from 'react'
import { ChevronDown } from 'react-feather'
import styled from 'styled-components/macro'

import Row, { RowBetween } from '../Row'

const ButtonContainer = styled(Row)`
  cursor: pointer;
  justify-content: flex-end;
  width: unset;
`

const ExpandIcon = styled(ChevronDown)<{ $isExpanded: boolean }>`
  color: ${({ theme }) => theme.textSecondary};
  transform: ${({ $isExpanded }) => ($isExpanded ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform ${({ theme }) => theme.transition.duration.medium};
`

export default function Expand({
  header,
  button,
  children,
  testId,
}: PropsWithChildren<{
  header: ReactElement
  button: ReactElement
  testId?: string
}>) {
  const [isExpanded, setExpanded] = useState(false)
  return (
    <Column gap="md">
      <RowBetween>
        {header}
        <ButtonContainer data-testid={testId} onClick={() => setExpanded(!isExpanded)} aria-expanded={isExpanded}>
          {button}
          <ExpandIcon $isExpanded={isExpanded} />
        </ButtonContainer>
      </RowBetween>
      {isExpanded && children}
    </Column>
  )
}
