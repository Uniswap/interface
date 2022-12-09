import styled from 'styled-components/macro'

const StyledStep = styled.div<{ selected: boolean }>`
  cursor: pointer;
  display: flex;
  padding: 24px 0;
  color: ${({ theme, selected }) => (selected ? theme.textPrimary : theme.textSecondary)};
  font-size: 28px;
  font-weight: 500;
  line-height: 36px;

  &:not(:last-of-type) {
    border-bottom: ${({ theme }) => `1px solid ${theme.backgroundOutline}`};
  }
`

const StepIndex = styled.span`
  margin-right: 36px;
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
