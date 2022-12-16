import styled from 'styled-components/macro'
import { BREAKPOINTS } from 'theme'

const StyledStep = styled.div<{ selected: boolean }>`
  cursor: pointer;
  display: flex;
  padding: 24px 0;
  color: ${({ theme, selected }) => (selected ? theme.textPrimary : theme.textSecondary)};
  font-size: 20px;
  font-weight: 500;
  line-height: 28px;
  transition: ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.ease}  color`};

  &:not(:last-of-type) {
    border-bottom: ${({ theme }) => `1px solid ${theme.backgroundOutline}`};
  }

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    font-size: 28px;
    line-height: 36px;
  }
`

const StepIndex = styled.span`
  margin-right: 24px;
  margin-left: 8px;

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    margin-right: 36px;
  }
`

const Step = ({
  index,
  title,
  onSelect,
  selected,
}: {
  index: number
  title: string
  onSelect: () => void
  selected: boolean
}) => {
  return (
    <StyledStep onClick={onSelect} onMouseEnter={onSelect} selected={selected}>
      <StepIndex>{index + 1}</StepIndex>
      {title}
    </StyledStep>
  )
}

export default Step
