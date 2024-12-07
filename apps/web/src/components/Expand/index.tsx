import Column from 'components/deprecated/Column'
import Row, { RowBetween } from 'components/deprecated/Row'
import styled from 'lib/styled-components'
import { PropsWithChildren, ReactElement } from 'react'
import { ChevronDown } from 'react-feather'
import { HeightAnimator } from 'ui/src'
import { iconSizes } from 'ui/src/theme'

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
  iconSize = 'icon24',
}: PropsWithChildren<{
  header?: ReactElement
  button: ReactElement
  testId?: string
  isOpen: boolean
  padding?: string
  onToggle: () => void
  iconSize?: keyof typeof iconSizes
}>) {
  return (
    <Wrapper $padding={padding}>
      <RowBetween>
        {header}
        <ButtonContainer data-testid={testId} onClick={onToggle} aria-expanded={isOpen}>
          {button}
          <ExpandIcon $isOpen={isOpen} size={iconSizes[iconSize]} />
        </ButtonContainer>
      </RowBetween>
      <HeightAnimator open={isOpen}>
        <Content gap="md">{children}</Content>
      </HeightAnimator>
    </Wrapper>
  )
}
