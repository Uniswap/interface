import airdropBackgroundv2 from 'assets/images/airdopBackground.png'
import { OpacityHoverState } from 'components/Common'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import styled, { css } from 'styled-components/macro'
import { ThemedText } from 'theme'

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

const LinkWrap = styled(Link)`
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

const AirdropModal = ({ isOpen }: { isOpen: boolean }) => {
  const [isClaimed, setClaimed] = useState(false)

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={() => {
        console.log('hi')
      }}
      maxHeight={90}
    >
      <ModalWrap>
        {isClaimed ? (
          <div>Claimed</div>
        ) : (
          <>
            <ImageContainer>
              <TextContainer>
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
              <LinkWrap to="www.google.com">
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
