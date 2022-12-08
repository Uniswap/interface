import styled from 'styled-components/macro'

const StyledStep = styled.div<{ isLast?: boolean }>`
  display: flex;
  gap: 36px;
  padding: 24px 0;
  border-bottom: ${({ isLast, theme }) => !isLast && `1px solid ${theme.backgroundOutline}`};
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
  isLast,
}: {
  index: number
  title: string
  description: string
  isLast?: boolean
}) => {
  return (
    <StyledStep isLast={isLast}>
      <StepIndex>{index + 1}</StepIndex>
      <div>
        <StepTitle>{title}</StepTitle>
        <StepDescription>{description}</StepDescription>
      </div>
    </StyledStep>
  )
}

export default Step
