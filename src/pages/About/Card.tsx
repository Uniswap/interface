import { TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, EventName } from '@uniswap/analytics-events'
import { Link } from 'react-router-dom'
import { useIsDarkMode } from 'state/user/hooks'
import styled, { DefaultTheme } from 'styled-components/macro'
import { BREAKPOINTS } from 'theme'

const DARK_MODE_GRADIENT = 'linear-gradient(180deg, rgba(19, 22, 27, 0.54) 0%, #13161b 100%)'

const StyledCard = styled.div<{ isDarkMode: boolean; backgroundImgSrc?: string; type: CardType }>`
  display: flex;
  background: ${({ isDarkMode, backgroundImgSrc }) =>
    isDarkMode
      ? `${DARK_MODE_GRADIENT} ${backgroundImgSrc ? `, url(${backgroundImgSrc})` : ''}`
      : `white url(${backgroundImgSrc})`};
  background-size: auto 100%;
  background-position: right;
  background-repeat: no-repeat;
  flex-direction: column;
  justify-content: space-between;
  text-decoration: none;
  color: ${({ theme }) => theme.textPrimary};
  padding: 40px;
  height: 345px;
  border-radius: 24px;
  border: 1px solid ${({ theme, isDarkMode }) => (isDarkMode ? theme.backgroundOutline : 'transparent')};
  box-shadow: 0px 10px 24px 0px rgba(51, 53, 72, 0.04);

  &:hover {
    border: 1px solid ${({ theme, isDarkMode }) => (isDarkMode ? theme.backgroundOutline : theme.textTertiary)};
  }
  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    height: ${({ backgroundImgSrc }) => (backgroundImgSrc ? 360 : 260)}px;
  }
`

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
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

export enum CardType {
  Primary = 'Primary',
  Secondary = 'Secondary',
}

const getCardDescriptionColor = (type: CardType, theme: DefaultTheme) => {
  switch (type) {
    case CardType.Secondary:
      return theme.textSecondary
    default:
      return theme.textPrimary
  }
}

const CardDescription = styled.div<{ type: CardType }>`
  display: flex;
  flex-direction: column;
  font-size: 20px;
  line-height: 28px;
  color: ${({ theme, type }) => getCardDescriptionColor(type, theme)};
  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    font-size: 14px;
    line-height: 18px;
  }
`

const CardCTA = styled(CardDescription)`
  color: ${({ theme }) => theme.accentAction};
  margin: 24px 0 0;
  cursor: pointer;
`

const Card = ({
  type = CardType.Primary,
  title,
  description,
  cta,
  to,
  external,
  backgroundImgSrc,
  icon,
  elementName,
}: {
  type?: CardType
  title: string
  description: string
  cta?: string
  to: string
  external?: boolean
  backgroundImgSrc?: string
  icon?: React.ReactNode
  elementName?: string
}) => {
  const isDarkMode = useIsDarkMode()
  return (
    <TraceEvent events={[BrowserEvent.onClick]} name={EventName.ELEMENT_CLICKED} element={elementName}>
      <StyledCard
        type={type}
        as={external ? 'a' : Link}
        to={external ? undefined : to}
        href={external ? to : undefined}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopenener noreferrer' : undefined}
        isDarkMode={isDarkMode}
        backgroundImgSrc={backgroundImgSrc}
      >
        <TitleRow>
          <CardTitle>{title}</CardTitle>
          {icon}
        </TitleRow>
        <CardDescription type={type}>
          {description}
          <CardCTA type={type}>{cta}</CardCTA>
        </CardDescription>
      </StyledCard>
    </TraceEvent>
  )
}

export default Card
