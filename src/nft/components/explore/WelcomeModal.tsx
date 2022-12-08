/* eslint-disable @typescript-eslint/no-var-requires */

import Modal from 'components/Modal'
import { useState } from 'react'
import { X } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'
import { ExternalLink } from 'theme/components'
import { ThemedText } from 'theme/components/text'

const Container = styled.div`
  position: relative;
  display: flex;
  padding: 30% 24px 24px;
  overflow: hidden;
  height: fit-content;
  user-select: none;
`

const CloseButton = styled(X)`
  position: absolute;
  top: 20px;
  right: 24px;
  cursor: pointer;
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

const Link = styled(ExternalLink)`
  color: ${({ theme }) => theme.accentActive};
  stroke: ${({ theme }) => theme.accentActive};
`

const Title = styled(ThemedText.LargeHeader)`
  @media (max-width: ${({ theme }) => theme.breakpoint.xl}px) {
    font-size: 20px !important;
  }
`

const Paragraph = styled(ThemedText.BodySecondary)`
  line-height: 24px;

  @media (max-width: ${({ theme }) => theme.breakpoint.xl}px) {
    font-size: 14px !important;
    line-height: 20px;
  }
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

export function WelcomeModal({ onDismissed }: { onDismissed: () => void }) {
  const [isOpen, setIsOpen] = useState(true)

  const dismiss = () => {
    setIsOpen(false)
    setTimeout(() => onDismissed())
  }

  const theme = useTheme()

  return (
    <Modal isOpen={isOpen} onSwipe={dismiss} maxWidth={720} isBottomSheet={false}>
      <Container>
        <Background
          {...(theme.darkMode ? BACKGROUND_IMAGE.dark : BACKGROUND_IMAGE.light)}
          alt="Welcome modal background"
          draggable={false}
        />
        <Content>
          <Title>Introducing NFTs on Uniswap</Title>
          <Paragraph>
            You can now buy and sell NFTs on Uniswap across marketplaces. Trade here to find more listings and better
            prices. <br />
            <br />
            NFTs on Uniswap replaces Genie, which was{' '}
            <Link href="https://uniswap.org/blog/genie" title="Uniswap Labs has acquired Genie">
              acquired{' '}
            </Link>{' '}
            by Uniswap Labs earlier this year. If you have used Genie in the past, you may be eligible for a USDC
            airdrop.{' '}
            <Link
              href="https://uniswap.org/blog/uniswap-nft-aggregator-announcement"
              title="Uniswap NFT aggregator announcement"
            >
              Learn more.
            </Link>
          </Paragraph>
          <CloseButton data-testid="nft-intro-modal" size={24} onClick={dismiss} />
        </Content>
      </Container>
    </Modal>
  )
}
