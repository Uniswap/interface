import styled from 'styled-components/macro'

const StyledStep = styled.div`
  cursor: pointer;
  display: flex;
  gap: 36px;
  padding: 24px 0;

  &:not(:last-of-type) {
    border-bottom: ${({ theme }) => `1px solid ${theme.backgroundOutline}`};
  }
`

const StepTitle = styled.div`
  color: ${({ theme }) => theme.textPrimary};
  font-size: 36px;
  line-height: 44px;
  font-weight: 600;
`

const StepDescription = styled.div`
  color: ${({ theme }) => theme.textSecondary};
  font-size: 24px;
  line-height: 36px;
`

const StepIndex = styled.div`
  color: ${({ theme }) => theme.textPrimary};
  font-size: 36px;
  line-height: 44px;
`

const Step = ({
  index,
  title,
  description,
  expanded,
  onClick,
}: {
  index: number
  title: string
  description: string
  onClick: () => void
  expanded?: boolean
}) => {
  return (
    <StyledStep onClick={onClick}>
      <StepIndex>{index + 1}</StepIndex>
      <div>
        <StepTitle>{title}</StepTitle>
        {expanded && <StepDescription>{description}</StepDescription>}
      </div>
    </StyledStep>
  )
}

export default Step
