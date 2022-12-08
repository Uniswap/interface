import coinbaseWalletIcon from 'assets/images/coinbaseWalletIcon.svg'
import metaMaskIcon from 'assets/images/metamask.png'
import phantomIcon from 'assets/images/phantom.png'
import rainbowIcon from 'assets/images/rainbow.png'
import walletConnectIcon from 'assets/images/walletConnectIcon.svg'
import { ButtonOutlined } from 'components/Button'
import { Box } from 'nft/components/Box'
import { DiscordIconMenu, GithubIconMenu, TwitterIconMenu } from 'nft/components/icons'
import { ReactNode } from 'react'
import { useIsDarkMode } from 'state/user/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { BREAKPOINTS } from 'theme'

import Card from './Card'
import Step from './Step'
import { SubTitle, Title } from './Title'

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

const Page = styled.span<{ isDarkMode: boolean }>`
  width: 100%;
  align-self: center;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 120px;
  justify-content: space-between;
  color: ${({ theme }) => theme.textPrimary};
  font-size: 24px;
  line-height: 36px;

  @media screen and (min-width: ${MOBILE_BREAKPOINT}px) {
    flex-direction: row;
  }

  & > * {
    flex: 1;
  }
`

const Content = styled.div`
  max-width: 1280px;
  pointer-events: all;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 128px 16px 16px 16px;
  gap: 24px;

  @media screen and (min-width: ${MOBILE_BREAKPOINT}px) {
    padding: 128px 80px 80px 80px;
    gap: 120px;
  }
`

const CardGrid = styled.div`
  display: grid;
  gap: 36px;
  width: 100%;
  grid-template-columns: 1fr;

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    grid-template-columns: 1fr 1fr;
  }
`

const WalletIconGrid = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 50px;
`

const WalletIconRow = styled.div`
  display: flex;
  gap: 50px;
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

const StepList = styled.div`
  display: flex;
  flex-direction: column;
`

const Intro = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`

const IntroCopy = styled.p`
  margin: 0;
`

const GetStarted = styled.div`
  margin-bottom: 100px;
`

export default function About() {
  const isDarkMode = useIsDarkMode()
  const theme = useTheme()

  return (
    <Page isDarkMode={isDarkMode}>
      <Content>
        <Title isDarkMode={isDarkMode}>The best way to buy, sell and own crypto and NFTs</Title>
        <Body>
          <div>
            <SubTitle isDarkMode={isDarkMode}>Powered by the Uniswap Protocol</SubTitle>
          </div>
          <Intro>
            <IntroCopy>
              The Uniswap Protocol is the world’s leading decentralized exchange protocol, allowing anyone to swap
              tokens, list a token, or provide liquidity in a pool to earn fees.
            </IntroCopy>
            <ActionsContainer>
              <InfoButton>Learn more</InfoButton>
              <InfoButton>Read the docs</InfoButton>
            </ActionsContainer>
          </Intro>
        </Body>
        <CardGrid>
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
        </CardGrid>
        <Body>
          <div>
            <GetStarted>
              <SubTitle isDarkMode={isDarkMode}>Get Started</SubTitle>
            </GetStarted>
            <WalletIconGrid>
              <WalletIconRow>
                <WalletIcon src={metaMaskIcon} alt="MetaMask" />
                <WalletIcon src={walletConnectIcon} alt="WalletConnect" />
                <WalletIcon src={coinbaseWalletIcon} alt="Coinbase Wallet" />
              </WalletIconRow>
              <WalletIconRow>
                <WalletIcon src={rainbowIcon} alt="Rainbow" />
                <WalletIcon src={phantomIcon} alt="Phantom" />
                <WalletIcon src={walletConnectIcon} alt="WalletConnect" />
              </WalletIconRow>
            </WalletIconGrid>
          </div>
          <StepList>
            <Step
              index={0}
              title="Connect a wallet"
              description="Connect your preferred crypto wallet to the Uniswap Interface."
            />
            <Step isLast index={1} title="Swap!" description="Trade crypto and NFTs through Uniswap’s platform" />
          </StepList>
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
      </Content>
    </Page>
  )
}
