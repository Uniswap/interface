import Modal from 'components/Modal'
import { useState } from 'react'
import { X } from 'react-feather'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 209px 24px 49px;
  gap: 16px;
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

export function WelcomeModal({ onDismiss }: { onDismiss: () => void }) {
  const [isOpen, setIsOpen] = useState(true)

  const dismiss = () => {
    setIsOpen(false)
    onDismiss()
  }

  return (
    <Modal isOpen={isOpen} onDismiss={dismiss} maxWidth={720}>
      <Container>
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
      </Container>
    </Modal>
  )
}
