import AnimatedDropdown from 'components/AnimatedDropdown'
import Column from 'components/Column'
import { PropsWithChildren, ReactElement } from 'react'
import { ChevronDown } from 'react-feather'
import styled from 'styled-components'

import Row, { RowBetween } from '../Row'

const ButtonContainer = styled(Row)`
  cursor: pointer;
  justify-content: flex-end;
  width: unset;
`

const ExpandIcon = styled(ChevronDown)<{ $isOpen: boolean }>`
  color: ${({ theme }) => theme.neutral2};
  transform: ${({ $isOpen }) => ($isOpen ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform ${({ theme }) => theme.transition.duration.medium};
`

const Content = styled(Column)`
  padding-top: ${({ theme }) => theme.grids.md};
`

const Wrapper = styled(Column)<{ $padding?: string }>`
  padding: ${({ $padding }) => $padding};
`

export default function Expand({
  header,
  button,
  children,
  testId,
  isOpen,
  padding,
  onToggle,
}: PropsWithChildren<{
  header: ReactElement
  button: ReactElement
  testId?: string
  isOpen: boolean
  padding?: string
  onToggle: () => void
}>) {
  return (
    <Wrapper $padding={padding}>
      <RowBetween>
        {header}
        <ButtonContainer data-testid={testId} onClick={onToggle} aria-expanded={isOpen}>
          {button}
          <ExpandIcon $isOpen={isOpen} />
        </ButtonContainer>
      </RowBetween>
      <AnimatedDropdown open={isOpen}>
        <Content gap="md">{children}</Content>
      </AnimatedDropdown>
    </Wrapper>
  )
}
