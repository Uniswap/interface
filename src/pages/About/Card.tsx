import { Link } from 'react-router-dom'
import { useIsDarkMode } from 'state/user/hooks'
import styled from 'styled-components/macro'

const StyledCard = styled.div<{ isDarkMode: boolean }>`
  display: flex;
  background: ${({ isDarkMode }) =>
    isDarkMode ? 'linear-gradient(180deg, rgba(19, 22, 27, 0.54) 0%, #13161b 100%)' : 'transparent'};
  flex-direction: column;
  justify-content: space-between;
  text-decoration: none;
  color: ${({ theme }) => theme.textPrimary};
  padding: 40px;
  height: 400px;
  border-radius: 24px;
  transition: ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.ease}  background-color`};
  border: 1px solid ${({ theme, isDarkMode }) => (isDarkMode ? 'transparent' : theme.backgroundOutline)};

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

const Card = ({
  title,
  description,
  to,
  external,
}: {
  title: string
  description: string
  to: string
  external?: boolean
}) => {
  const isDarkMode = useIsDarkMode()
  return (
    <StyledCard
      as={external ? 'a' : Link}
      to={external ? undefined : to}
      href={external ? to : undefined}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopenener noreferrer' : undefined}
      isDarkMode={isDarkMode}
    >
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </StyledCard>
  )
}

export default Card
