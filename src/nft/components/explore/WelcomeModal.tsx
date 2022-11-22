import Modal from 'components/Modal'
import { useState } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 209px 24px 49px;
  gap: 16px;
`

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(true)

  const toggleClaimModal = () => {
    setIsOpen(false)
  }

  return (
    <Modal isOpen={isOpen} onDismiss={toggleClaimModal} maxWidth={720}>
      <Container>
        <ThemedText.LargeHeader>Introducing Uniswap NFT</ThemedText.LargeHeader>
        <ThemedText.BodySecondary>
          We’re excited to announce that Uniswap Labs has acquired Genie to build the marketplace for all digital
          assets! With Uniswap NFT, you can buy and sell NFTs across all marketplaces with the full functionality of
          Genie. Additonally, if you’ve used Genie in the past, then you may be eligible for a USDC airdrop. You can
          connect your wallet to claim any rewards. For more details on the airdrop please read the official
          announcement on the Uniswap Labs blog. Learn more.
        </ThemedText.BodySecondary>
      </Container>
    </Modal>
  )
}
