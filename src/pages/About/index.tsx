import metaMaskIcon from 'assets/images/metamask.png'
import { ButtonOutlined } from 'components/Button'
import { Box } from 'nft/components/Box'
import { DiscordIconMenu, GithubIconMenu, TwitterIconMenu } from 'nft/components/icons'
import { ReactNode } from 'react'
import { useIsDarkMode } from 'state/user/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { BREAKPOINTS } from 'theme'

import Card from './Card'

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

const Title = styled.h1<{ isDarkMode: boolean }>`
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
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: ${({ theme }) => theme.textPrimary};
  font-size: 24px;
  line-height: 36px;
  margin: 0;

  @media screen and (min-width: ${MOBILE_BREAKPOINT}px) {
    flex-direction: row;
  }

  & > * {
    flex: 1;
  }
`

const ContentWrapper = styled.span`
  max-width: 1280px;
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
  gap: 36px;
  width: 100%;
  grid-template-columns: 1fr;

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    grid-template-columns: 1fr 1fr;
  }
`

const PoweredBy = styled.h2<{ isDarkMode?: boolean }>`
  margin: 0;
  max-width: 340px;
  color: transparent;
  font-size: 40px;
  line-height: 48px;

  background: ${({ isDarkMode }) =>
    isDarkMode
      ? 'linear-gradient(20deg, rgba(255, 244, 207, 1) 10%, rgba(255, 87, 218, 1) 100%)'
      : 'linear-gradient(10deg, rgba(255,79,184,1) 0%, rgba(255,159,251,1) 100%)'};

  background-clip: text;
  -webkit-background-clip: text;
`

const WalletIconContainer = styled.div`
  display: grid;
  gap: 50px;
  grid-template-columns: 1fr 1fr 1fr;
`

const WalletIcon = styled.img`
  width: 100px;
  height: 100px;
`

const InfoButton = styled(ButtonOutlined)`
  font-size: 24px;
  line-height: 32px;
  padding: 16px;
`

const ActionsContainer = styled.span`
  display: flex;
  gap: 16px;
  width: 100%;

  & > * {
    flex: 1;
  }
`

export default function About() {
  const isDarkMode = useIsDarkMode()
  const theme = useTheme()

  return (
    <PageWrapper isDarkMode={isDarkMode}>
      <ContentWrapper>
        <Title isDarkMode={isDarkMode}>The best way to buy, sell and own crypto and NFTs</Title>
        <Body>
          <div>
            <PoweredBy isDarkMode={isDarkMode}>Powered by the Uniswap Protocol</PoweredBy>
          </div>
          <div>
            <p>
              The Uniswap Protocol is the world’s leading decentralized exchange protocol, allowing anyone to swap
              tokens, list a token, or provide liquidity in a pool to earn fees.
            </p>
            <ActionsContainer>
              <InfoButton>Learn more</InfoButton>
              <InfoButton>Read the docs</InfoButton>
            </ActionsContainer>
          </div>
        </Body>
        <CardContainer>
          <Card
            to="/swap"
            title="Swap tokens"
            description="Discover and swap top tokens on Ethereum, Polygon, Optimism, and more."
          />
          <Card
            to="/nfts"
            title="Trade NFTs"
            description="Buy & sell NFTs across marketplaces to find more listings at better prices."
          />
          <Card
            to="/pool"
            title="Earn fees"
            description="Provide liquidity to pools on Uniswap and earn fees on swaps."
          />
          <Card
            to="https://support.uniswap.org/"
            external
            title="Build dApps"
            description="Build on the largest DeFi protocol on Ethereum with our tools."
          />
        </CardContainer>
        <Body>
          <WalletIconContainer>
            <WalletIcon src={metaMaskIcon} alt="MetaMask" />
            <WalletIcon src={metaMaskIcon} alt="MetaMask" />
            <WalletIcon src={metaMaskIcon} alt="MetaMask" />
            <WalletIcon src={metaMaskIcon} alt="MetaMask" />
            <WalletIcon src={metaMaskIcon} alt="MetaMask" />
            <WalletIcon src={metaMaskIcon} alt="MetaMask" />
          </WalletIconContainer>
          <div></div>
        </Body>
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
