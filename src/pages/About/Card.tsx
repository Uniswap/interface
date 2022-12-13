import { Link } from 'react-router-dom'
import { useIsDarkMode } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { BREAKPOINTS } from 'theme'

const DARK_MODE_GRADIENT = 'linear-gradient(180deg, rgba(19, 22, 27, 0.54) 0%, #13161b 100%)'

const StyledCard = styled.div<{ isDarkMode: boolean; backgroundImgSrc?: string }>`
  display: flex;
  background: ${({ isDarkMode, backgroundImgSrc }) =>
    isDarkMode
      ? `${DARK_MODE_GRADIENT} ${backgroundImgSrc ? `, url(${backgroundImgSrc})` : ''}`
      : `url(${backgroundImgSrc})`};
  background-size: auto 100%;
  background-position: right;
  background-repeat: no-repeat;
  flex-direction: column;
  justify-content: space-between;
  text-decoration: none;
  color: ${({ theme }) => theme.textPrimary};
  padding: 24px;
  height: 200px;
  border-radius: 24px;
  border: 1px solid ${({ theme, isDarkMode }) => (isDarkMode ? 'transparent' : theme.backgroundOutline)};

  &:hover {
    border: 1px solid ${({ theme, isDarkMode }) => (isDarkMode ? theme.backgroundOutline : theme.textTertiary)};
  }
  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    height: ${({ backgroundImgSrc }) => (backgroundImgSrc ? 360 : 200)}px;
    padding: 40px;
  }
`

const CardTitle = styled.div`
  font-size: 20px;
  line-height: 28px;
  font-weight: 500;

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    font-size: 20px;
    line-height: 28px;
  }

  @media screen and (min-width: ${BREAKPOINTS.lg}px) {
    font-size: 28px;
    line-height: 36px;
  }
`

const CardDescription = styled.div`
  font-size: 14px;
  line-height: 20px;

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    font-size: 20px;
    line-height: 28px;
  }

  @media screen and (min-width: ${BREAKPOINTS.lg}px) {
    font-size: 20px;
    line-height: 28px;
  }
`

const Card = ({
  title,
  description,
  to,
  external,
  backgroundImgSrc,
}: {
  title: string
  description: string
  to: string
  external?: boolean
  backgroundImgSrc?: string
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
      backgroundImgSrc={backgroundImgSrc}
    >
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </StyledCard>
  )
}

export default Card
