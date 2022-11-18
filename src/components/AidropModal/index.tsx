import airdropBackgroundv2 from 'assets/images/airdopBackground.png'
import { OpacityHoverState } from 'components/Common'
import { useState } from 'react'
import { ChevronRightIcon } from 'nft/components/icons'
import styled, { css } from 'styled-components/macro'
import { CloseIcon, ThemedText } from 'theme'

import Modal from '../Modal'

const hoverState = css`
  :hover::after {
    border-radius: 12px;
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: ${({ theme }) => theme.stateOverlayHover};

    transition: ${({
      theme: {
        transition: { duration, timing },
      },
    }) => `background ${duration.medium} ${timing.ease}`};

    z-index: 0;
  }

  :active::after {
    border-radius: 12px;
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: ${({ theme }) => theme.stateOverlayPressed};
    z-index: 0;

    transition: ${({
      theme: {
        transition: { duration, timing },
      },
    }) => `background ${duration.medium} ${timing.ease}`};
  }
`
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

const BuyNowButtonContainer = styled.div`
  position: relative;
  margin-top: 40px;
  outline: none;
`

// maxWidth: 68, marginLeft: 'auto', marginRight: 'auto', marginTop: 'auto', cursor: 'pointer'
const CloseButtonContainer = styled.div`
  position: relative;
  max-width: 68px;
  margin-left: auto;
  margin-right: auto;
  margin-top: auto;
  cursor: pointer;
`

const BuyNowButton = styled.div`
  width: 100%;
  background-color: ${({ theme }) => theme.accentAction};
  border-radius: 12px;
  padding: 10px 12px;
  text-align: center;
  cursor: pointer;

  ${hoverState}
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

const SubHeader = styled(ThemedText.SubHeader)`
  color: ${({ theme }) => theme.textPrimary};
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

const CloseButton = styled.div`
  background-color: ${({ theme }) => theme.backgroundInteractive};
  border-radius: 12px;
  color: white;
  margin-top: auto;
  padding: 10px 12px;
  max-width: 68px;
  margin-left: auto;
  margin-right: auto;

  ${hoverState}
`

const SyledCloseIcon = styled(CloseIcon)`
  float: right;
  height: 24px;
  margin-top: 2px;

  ${OpacityHoverState}
`

const AirdropModal = ({ isOpen, onDismiss }: { isOpen: boolean; onDismiss: () => void }) => {
  const [isClaimed, setClaimed] = useState(false)
  const dismiss = () => {
    onDismiss()

    setTimeout(() => {
      setClaimed(false)
    }, 500)
  }

  return (
    <Modal isOpen={isOpen} onDismiss={dismiss} maxHeight={90}>
      <ModalWrap>
        {isClaimed ? (
          <ClaimContainer>
            <ThemedText.HeadlineSmall>Congratulations!</ThemedText.HeadlineSmall>
            <SuccessText>You have successfully claimed 300 USDC. Thank you for supporting Genie.xyz.</SuccessText>
            <EtherscanLink href="https://etherscan.io/" target="_blank">
              <ThemedText.Link>
                <div style={{ display: 'flex', alignItems: 'center', textAlign: 'center', justifyContent: 'center' }}>
                  <span style={{ marginRight: 8 }}>Etherscan</span>
                  <ChevronRightIcon />
                </div>
              </ThemedText.Link>
            </EtherscanLink>
            <CloseButtonContainer>
              <CloseButton onClick={dismiss}>Close</CloseButton>
            </CloseButtonContainer>
          </ClaimContainer>
        ) : (
          <>
            <ImageContainer>
              <TextContainer>
                <SyledCloseIcon onClick={dismiss} stroke="white" />
                <ThemedText.ButtonLabelMedium>Uniswap NFT Airdrop</ThemedText.ButtonLabelMedium>
                <USDCLabel>300 USDC</USDCLabel>
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
                As a long time supporter of Genie you’ve been awarded 300 USDC tokens. Read more about Uniswap NFT.
              </ThemedText.BodyBodySmall>
              <LinkWrap href="https://uniswap.org/blog/uniswap-nft-aggregator-announcement" target="_blank">
                <ThemedText.Link>Read more about Uniswap NFT</ThemedText.Link>
              </LinkWrap>
              <div>
                <BuyNowButtonContainer>
                  <BuyNowButton
                    onClick={() => {
                      setClaimed(true)
                    }}
                  >
                    <SubHeader color="white" lineHeight="20px">
                      <span>Claim USDC</span>
                    </SubHeader>
                  </BuyNowButton>
                </BuyNowButtonContainer>
              </div>
            </Body>
          </>
        )}
      </ModalWrap>
    </Modal>
  )
}

export default AirdropModal
