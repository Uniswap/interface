/* eslint-disable @typescript-eslint/no-var-requires */

import Modal from 'components/Modal'
import { useState } from 'react'
import { X } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'

const Container = styled.div`
  position: relative;
  display: flex;
  padding: 209px 24px 49px;
  overflow: hidden;
  height: fit-content;
`

const CloseButton = styled(X)`
  position: absolute;
  top: 20px;
  right: 24px;
  cursor: pointer;
`

const Link = styled.a`
  outline: none;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`

const Background = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  object-fit: contain;
`

const Content = styled.div`
  display: flex;
  flex-direction: column;
  z-index: 1;
  gap: 16px;
`

const BACKGROUND_IMAGE = {
  dark: {
    src: require('../../../assets/images/welcomeModal-dark.jpg').default,
    srcSet: `
      ${require('../../../assets/images/welcomeModal-dark@2x.jpg').default} 2x,
      ${require('../../../assets/images/welcomeModal-dark@3x.jpg').default} 3x,
    `,
  },
  light: {
    src: require('../../../assets/images/welcomeModal-light.jpg').default,
    srcSet: `
      ${require('../../../assets/images/welcomeModal-light@2x.jpg').default} 2x,
      ${require('../../../assets/images/welcomeModal-light@3x.jpg').default} 3x,
    `,
  },
}

export function WelcomeModal({ onDismiss }: { onDismiss: () => void }) {
  const [isOpen, setIsOpen] = useState(true)

  const dismiss = () => {
    setIsOpen(false)
    onDismiss()
  }

  const theme = useTheme()

  return (
    <Modal isOpen={isOpen} onDismiss={dismiss} maxWidth={720}>
      <Container>
        <Background
          {...(theme.darkMode ? BACKGROUND_IMAGE.dark : BACKGROUND_IMAGE.light)}
          alt="Welcome modal background"
        />
        <Content>
          <ThemedText.LargeHeader>Introducing Uniswap NFT</ThemedText.LargeHeader>
          <ThemedText.BodySecondary>
            We’re excited to announce that Uniswap Labs has acquired Genie to build the marketplace for all digital
            assets! With Uniswap NFT, you can buy and sell NFTs across all marketplaces with the full functionality of
            Genie. Additonally, if you’ve used Genie in the past, then you may be eligible for a USDC airdrop. You can
            connect your wallet to claim any rewards. For more details on the airdrop please read the official
            announcement on the Uniswap Labs blog.{' '}
            <Link
              href="https://uniswap.org/blog/uniswap-nft-aggregator-announcement"
              title="Uniswap NFT aggregator announcement"
            >
              Learn more.
            </Link>
          </ThemedText.BodySecondary>
          <CloseButton size={24} onClick={dismiss} />
        </Content>
      </Container>
    </Modal>
  )
}
