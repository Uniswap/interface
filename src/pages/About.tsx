import { Box } from 'nft/components/Box'
import { DiscordIconMenu, GithubIconMenu, TwitterIconMenu } from 'nft/components/icons'
import { ReactNode } from 'react'
import { useIsDarkMode } from 'state/user/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { BREAKPOINTS } from 'theme'

const MOBILE_BREAKPOINT = BREAKPOINTS.md

const IconRow = styled.span`
  display: flex;
  flex-direction: row;
`

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
  font-size: 24px;
  line-height: 36px;
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

const CardContainer = styled.div`
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

const StyledCard = styled.a`
  background-color: #0e111a;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-decoration: none;
  color: ${({ theme }) => theme.white};
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

export default function About() {
  const isDarkMode = useIsDarkMode()
  const theme = useTheme()

  return (
    <PageWrapper isDarkMode={isDarkMode}>
      <ContentWrapper>
        <TitleText isDarkMode={isDarkMode}>The best way to buy, sell and own crypto and NFTs</TitleText>
        <Body>
          The Uniswap Protocol is the world’s leading decentralized exchange protocol, allowing anyone to swap tokens,
          list a token, or provide liquidity in a pool to earn fees.
        </Body>
        <CardContainer>
          <Card to="https://app.uniswap.org/#/swap" title="Swap tokens" description="" />
          <Card to="https://app.uniswap.org/#/nfts" title="Trade NFTs" description="" />
          <Card to="https://app.uniswap.org/#/pool" title="Earn fees" description="" />
          <Card to="https://support.uniswap.org/" title="Build dApps" description="" />
        </CardContainer>
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
