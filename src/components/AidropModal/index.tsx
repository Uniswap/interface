import airdropBackgroundv2 from 'assets/images/airdopBackground.png'
import { OpacityHoverState } from 'components/Common'
import { ChevronRightIcon } from 'nft/components/icons'
import { useState } from 'react'
import styled from 'styled-components/macro'
import { CloseIcon, ThemedText } from 'theme'
import Loader from 'components/Loader'
import { ButtonEmphasis, ButtonSize, ThemeButton } from 'components/Button'

import Modal from '../Modal'

const ModalWrap = styled.div`
  display: flex;
  flex-direction: column;
`

const Body = styled.div`
  padding-left: 20px;
  padding-right: 20px;
  padding-top: 28px;
  padding-bottom: 20px;
`

const ClaimButton = styled(ThemeButton)`
  width: 100%;
  background-color: ${({ theme }) => theme.accentAction};
  margin-top: 40px;
  border-radius: 12px;
`

const Line = styled.div`
  height: 1px;
  width: 100%;
  background-color: white;
  opacity: 0.24;
  margin-top: 12px;
  margin-bottom: 12px;
`

const LinkWrap = styled.a`
  text-decoration: none;
  ${OpacityHoverState}
`

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
`

const StyledImage = styled.img`
  width: 100%;
  height: 170px;
`

const USDCLabel = styled.div`
  font-weight: 700;
  font-size: 36px;
  line-height: 44px;
`

const TextContainer = styled.div`
  position: absolute;
  left: 18px;
  top: 18px;
  right: 18px;
  width: calc(100% - 36px);
`

const RewardsDetailsContainer = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
`

const CurrencyText = styled.span`
  color: white;
  font-weight: 500;
  font-size: 12px;
  line-height: 14.5px;
`

const ClaimContainer = styled.div`
  display: flex;
  flex-direction: column;
  text-align: center;
  height: 380px;
  padding: 60px 28px;
  padding-bottom: 20px;
`

const SuccessText = styled.div`
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  margin-top: 24px;
  margin-bottom: 8px;
`

const EtherscanLink = styled.a`
  text-decoration: none;

  ${OpacityHoverState}
`

const CloseButton = styled(ThemeButton)`
  max-width: 68px;
  margin-top: auto;
  margin-left: auto;
  margin-right: auto;
`

const SyledCloseIcon = styled(CloseIcon)`
  float: right;
  height: 24px;
  margin-top: 2px;

  ${OpacityHoverState}
`

const AirdropModal = ({ isOpen, onDismiss }: { isOpen: boolean; onDismiss: () => void }) => {
  const [isClaimed, setClaimed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [totalAmount] = useState(300)
  const dismiss = () => {
    onDismiss()

    setTimeout(() => {
      setClaimed(false)
    }, 500)
  }

  const submit = () => {
    setIsSubmitting(true)

    setTimeout(() => {
      setIsSubmitting(false)
      setClaimed(true)
    }, 1000)
  }

  return (
    <Modal isOpen={isOpen} onDismiss={dismiss} maxHeight={90}>
      <ModalWrap>
        {isClaimed ? (
          <ClaimContainer>
            <ThemedText.HeadlineSmall>Congratulations!</ThemedText.HeadlineSmall>
            <SuccessText>
              You have successfully claimed {totalAmount} USDC. Thank you for supporting Genie.xyz.
            </SuccessText>
            <EtherscanLink href="https://etherscan.io/" target="_blank">
              <ThemedText.Link>
                <div style={{ display: 'flex', alignItems: 'center', textAlign: 'center', justifyContent: 'center' }}>
                  <span style={{ marginRight: 8 }}>Etherscan</span>
                  <ChevronRightIcon />
                </div>
              </ThemedText.Link>
            </EtherscanLink>

            <CloseButton size={ButtonSize.medium} emphasis={ButtonEmphasis.medium} onClick={dismiss}>
              Close
            </CloseButton>
          </ClaimContainer>
        ) : (
          <>
            <ImageContainer>
              <TextContainer>
                <SyledCloseIcon onClick={dismiss} stroke="white" />
                <ThemedText.ButtonLabelMedium>Uniswap NFT Airdrop</ThemedText.ButtonLabelMedium>
                <USDCLabel>{totalAmount} USDC</USDCLabel>
                <Line />
                <RewardsDetailsContainer>
                  <ThemedText.BodyCaption marginBottom="8px">Trading rewards</ThemedText.BodyCaption>{' '}
                  <CurrencyText>300 USDC</CurrencyText>
                </RewardsDetailsContainer>
                <RewardsDetailsContainer>
                  <ThemedText.BodyCaption>Genie NFT holder rewards</ThemedText.BodyCaption>{' '}
                  <CurrencyText>0</CurrencyText>
                </RewardsDetailsContainer>
              </TextContainer>
              <StyledImage src={airdropBackgroundv2} />
            </ImageContainer>
            <Body>
              <ThemedText.BodyBodySmall marginBottom="28px">
                As a long time supporter of Genie you’ve been awarded {totalAmount} USDC tokens. Read more about Uniswap
                NFT.
              </ThemedText.BodyBodySmall>
              <LinkWrap href="https://uniswap.org/blog/uniswap-nft-aggregator-announcement" target="_blank">
                <ThemedText.Link>Read more about Uniswap NFT</ThemedText.Link>
              </LinkWrap>

              <ClaimButton
                onClick={submit}
                size={ButtonSize.medium}
                emphasis={ButtonEmphasis.medium}
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader stroke="white" />}
                <span>Claim USDC</span>
              </ClaimButton>
            </Body>
          </>
        )}
      </ModalWrap>
    </Modal>
  )
}

export default AirdropModal
