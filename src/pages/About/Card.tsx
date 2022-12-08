import styled from 'styled-components/macro'

const StyledCard = styled.a`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-decoration: none;
  color: ${({ theme }) => theme.textPrimary};
  border: 1px solid black;
  padding: 40px;
  height: 400px;
  border-radius: 24px;
  transition: 200ms ease background-color;

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

const Card = ({ title, description, to }: { title: string; description: string; to: string }) => {
  return (
    <StyledCard href={to}>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </StyledCard>
  )
}

export default Card
