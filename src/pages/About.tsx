import { Box } from 'nft/components/Box'
import { DiscordIconMenu, GithubIconMenu, TwitterIconMenu } from 'nft/components/icons'
import { ReactNode } from 'react'
import { BookOpen, Globe, Heart, HelpCircle, Terminal, Twitter } from 'react-feather'
import { useIsDarkMode } from 'state/user/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { BREAKPOINTS } from 'theme'

const MOBILE_BREAKPOINT = BREAKPOINTS.md

const IconRow = styled.span`
  display: flex;
  flex-direction: row;
`

const SMALL_CARD_ICON_SIZE = 32

const Icon = ({ href, children }: { href?: string; children: ReactNode }) => {
  return (
    <Box
      as={href ? 'a' : 'div'}
      href={href ?? undefined}
      target={href ? '_blank' : undefined}
      rel={href ? 'noopener noreferrer' : undefined}
      display="flex"
      flexDirection="column"
      color="textPrimary"
      background="none"
      border="none"
      justifyContent="center"
      textAlign="center"
      marginRight="12"
    >
      {children}
    </Box>
  )
}

const PageWrapper = styled.span<{ isDarkMode: boolean }>`
  width: 100%;
  align-self: center;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`

const TitleText = styled.h1<{ isDarkMode: boolean }>`
  color: transparent;
  font-size: 48px;
  font-weight: 600;
  margin-bottom: 0px;
  background: ${({ isDarkMode }) =>
    isDarkMode
      ? 'linear-gradient(20deg, rgba(255, 244, 207, 1) 10%, rgba(255, 87, 218, 1) 100%)'
      : 'linear-gradient(10deg, rgba(255,79,184,1) 0%, rgba(255,159,251,1) 100%)'};

  background-clip: text;
  -webkit-background-clip: text;

  @media screen and (min-width: ${MOBILE_BREAKPOINT}px) {
    font-size: 72px;
  }
`

const Body = styled.p`
  color: ${({ theme }) => theme.textPrimary};
  font-size: 18px;
  padding: 0;
  margin: 0;
`

const ContentWrapper = styled.span`
  max-width: 960px;
  pointer-events: all;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 8rem 1rem 1rem 1rem;
  gap: 24px;

  @media screen and (min-width: ${MOBILE_BREAKPOINT}px) {
    padding: 8rem 5rem 5rem 5rem;
    gap: 56px;
  }
`

const SmallCardContainer = styled.div`
  display: grid;
  gap: 12px;
  width: 100%;
  grid-template-columns: 1fr;

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    grid-template-columns: 1fr 1fr;
  }
  @media screen and (min-width: ${BREAKPOINTS.lg}px) {
    grid-template-columns: 1fr 1fr 1fr;
  }
`

const SmallCard = styled.a`
  background-color: #0e111a;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-decoration: none;
  color: white;
  padding: 32px;
  min-height: 220px;
  font-weight: light;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  font-size: 32px;
  transition: 200ms ease all;

  &:hover {
    transition: 200ms ease background-color;
    background-color: ${({ theme }) => theme.backgroundModule};
  }
`

export default function About() {
  const isDarkMode = useIsDarkMode()
  const theme = useTheme()

  return (
    <PageWrapper isDarkMode={isDarkMode}>
      <ContentWrapper>
        <TitleText isDarkMode={isDarkMode}>
          Our mission: <br />
          Unlock universal ownership & exchange
        </TitleText>
        <Body>
          Uniswap Labs is building the future of decentralized finance by harnessing the power of the Uniswap Protocol.
        </Body>

        <SmallCardContainer>
          <SmallCard href="https://uniswap.org" target="_blank" rel="noopener noreferrer">
            <Globe size={SMALL_CARD_ICON_SIZE} strokeWidth={1} color={theme.textSecondary} />
            Uniswap Protocol
          </SmallCard>
          <SmallCard href="https://uniswap.org/blog" target="_blank" rel="noopener noreferrer">
            <BookOpen size={SMALL_CARD_ICON_SIZE} strokeWidth={1} color={theme.textSecondary} />
            Blog
          </SmallCard>
          <SmallCard href="https://boards.greenhouse.io/uniswaplabs" target="_blank" rel="noopener noreferrer">
            <Heart size={SMALL_CARD_ICON_SIZE} strokeWidth={1} color={theme.textSecondary} />
            Careers
          </SmallCard>
          <SmallCard href="https://support.uniswap.org/" target="_blank" rel="noopener noreferrer">
            <HelpCircle size={SMALL_CARD_ICON_SIZE} strokeWidth={1} color={theme.textSecondary} />
            Support
          </SmallCard>
          <SmallCard href="https://twitter.com/Uniswap" target="_blank" rel="noopener noreferrer">
            <Twitter size={SMALL_CARD_ICON_SIZE} strokeWidth={1} color={theme.textSecondary} />
            Twitter
          </SmallCard>
          <SmallCard href="https://uniswap.org/developers" target="_blank" rel="noopener noreferrer">
            <Terminal size={SMALL_CARD_ICON_SIZE} strokeWidth={1} color={theme.textSecondary} />
            Developers
          </SmallCard>
        </SmallCardContainer>

        <span>
          <small>
            Media inquires for Uniswap Labs - Contact <a href="mailto:media@uniswap.org">media@uniswap.org</a>
          </small>
        </span>
        <IconRow>
          <Icon href="https://discord.com/invite/FCfyBSbCU5">
            <DiscordIconMenu width={24} height={24} color={theme.textSecondary} />
          </Icon>
          <Icon href="https://twitter.com/Uniswap">
            <TwitterIconMenu width={24} height={24} color={theme.textSecondary} />
          </Icon>
          <Icon href="https://github.com/Uniswap">
            <GithubIconMenu width={24} height={24} color={theme.textSecondary} />
          </Icon>
        </IconRow>
      </ContentWrapper>
    </PageWrapper>
  )
}
