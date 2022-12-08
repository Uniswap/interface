import styled from 'styled-components/macro'

const StyledCard = styled.a`
  display: flex;
  background: linear-gradient(180deg, rgba(19, 22, 27, 0.54) 0%, #13161b 100%);
  flex-direction: column;
  justify-content: space-between;
  text-decoration: none;
  color: ${({ theme }) => theme.textPrimary};
  padding: 40px;
  height: 400px;
  border-radius: 24px;
  transition: ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.ease}  background-color`};

  &:hover {
    background-color: ${({ theme }) => theme.backgroundModule};
  }
`

const CardTitle = styled.div`
  font-weight: 600;
  font-size: 48px;
  line-height: 56px;
`

const CardDescription = styled.div`
  font-weight: 400;
  font-size: 24px;
  line-height: 36px;
`

const Card = ({ title, description, to }: { title: string; description: string; to: string; external?: boolean }) => {
  return (
    <StyledCard href={to}>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </StyledCard>
  )
}

export default Card
