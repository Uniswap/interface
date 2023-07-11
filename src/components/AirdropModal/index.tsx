import { BigNumber } from '@ethersproject/bignumber'
import type { TransactionResponse } from '@ethersproject/providers'
import { UNISWAP_NFT_AIRDROP_CLAIM_ADDRESS } from '@thinkincoin-libs/sdk-core'
import { useWeb3React } from '@web3-react/core'
import uniswapNftAirdropClaim from 'abis/uniswap-nft-airdrop-claim.json'
import airdropBackgroundv2 from 'assets/images/airdopBackground.png'
import { ButtonEmphasis, ButtonSize, ThemeButton } from 'components/Button'
import { OpacityHoverState } from 'components/Common'
import Loader from 'components/Icons/LoadingSpinner'
import { useContract } from 'hooks/useContract'
import { ChevronRightIcon } from 'nft/components/icons'
import { useIsNftClaimAvailable } from 'nft/hooks/useIsNftClaimAvailable'
import { CollectionRewardsFetcher } from 'nft/queries/genie/GetAirdorpMerkle'
import { Airdrop, Rewards } from 'nft/types/airdrop'
import { useEffect, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import { useModalIsOpen, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled from 'styled-components/macro'
import { CloseIcon, ThemedText } from 'theme'

import Modal from '../Modal'

const ModalWrap = styled.div`
  display: flex;
  flex-direction: column;
`

const Body = styled.div`
  padding: 28px 20px 20px 20px;
`

const ClaimButton = styled(ThemeButton)`
  width: 100%;
  background-color: ${({ theme }) => theme.accentAction};
  border-radius: 12px;
  color: ${({ theme }) => theme.white};
`

const Line = styled.div`
  height: 1px;
  width: 100%;
  background-color: ${({ theme }) => theme.white};
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
  margin-top: 8px;
  color: white;
`

const TextContainer = styled.div`
  position: absolute;
  left: 16px;
  top: 16px;
  right: 16px;
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

  ${OpacityHoverState}
`

const Error = styled.div`
  display: flex;
  color: ${({ theme }) => theme.accentCritical};
  font-weight: 500;
  line-height: 24px;
  border-radius: 16px;
  padding: 12px 20px;
  font-size: 14px;
  align-items: center;
  gap: 12px;
`

const ReactLinkWrap = styled.div`
  margin-bottom: 40px;
`

const RewardsText = styled.span`
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.white};

  &:first-child {
    margin-bottom: 8px;
  }
`

const RewardsInformationText = styled.span`
  display: inline-block;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.textPrimary};
  margin-bottom: 28px;
`

const MainHeader = styled.span`
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  color: ${({ theme }) => theme.white};
`

const EtherscanLinkWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`

enum RewardAmounts {
  tradingRewardAmount = 300,
  holderRewardAmount = 1000,
  combinedAmount = 1300,
}

const AirdropModal = () => {
  const { account, provider } = useWeb3React()
  const [claim, setClaim] = useState<Rewards>()
  const [isClaimed, setIsClaimed] = useState(false)
  const [hash, setHash] = useState('')
  const [error, setError] = useState(false)
  const setIsClaimAvailable = useIsNftClaimAvailable((state) => state.setIsClaimAvailable)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [totalAmount, setTotalAmount] = useState(0)
  const isOpen = useModalIsOpen(ApplicationModal.UNISWAP_NFT_AIRDROP_CLAIM)
  const usdcAirdropToggle = useToggleModal(ApplicationModal.UNISWAP_NFT_AIRDROP_CLAIM)
  const contract = useContract(UNISWAP_NFT_AIRDROP_CLAIM_ADDRESS, uniswapNftAirdropClaim)

  const displayError = () => {
    setIsSubmitting(false)
    setError(true)
    setTimeout(() => {
      setError(false)
    }, 5000)
  }

  useEffect(() => {
    if (account && provider && contract) {
      ;(async () => {
        try {
          const { data } = await CollectionRewardsFetcher(account)
          const claim = data.find((claim) => claim?.rewardType === Airdrop.GENIE_UNISWAP_USDC_AIRDROP)

          if (!claim) return

          const [isClaimed] = await contract.connect(provider).functions.isClaimed(claim?.index)

          if (claim && isClaimed === false) {
            const usdAmount = BigNumber.from(claim.amount).div(10 ** 6)
            setClaim(claim)
            setTotalAmount(usdAmount.toNumber())
            setIsClaimAvailable(true)
          }
        } catch (err) {
          displayError()
        }
      })()
    }
  }, [account, contract, provider, setIsClaimAvailable])

  const makeClaim = async () => {
    try {
      if (contract && claim && claim.amount && claim.merkleProof && provider) {
        setIsSubmitting(true)

        const response: TransactionResponse = await contract
          .connect(provider?.getSigner())
          .functions.claim(claim.index, account, claim?.amount, claim?.merkleProof)

        await response.wait()

        setHash(response.hash)
        setIsSubmitting(false)
        setIsClaimed(true)
        setIsClaimAvailable(false)
      }
    } catch (err) {
      setIsSubmitting(false)
      displayError()
    }
  }

  return (
    <>
      <Modal hideBorder isOpen={isOpen} onDismiss={usdcAirdropToggle} maxHeight={90} maxWidth={400}>
        <ModalWrap>
          {isClaimed ? (
            <ClaimContainer>
              <ThemedText.HeadlineSmall>Congratulations!</ThemedText.HeadlineSmall>
              <SuccessText>
                You have successfully claimed {totalAmount} USDC. Thank you for supporting Genie.xyz.
              </SuccessText>
              <EtherscanLink href={`https://etherscan.io/tx/${hash}`} target="_blank">
                <ThemedText.Link>
                  <EtherscanLinkWrap>
                    <span>Etherscan</span>
                    <ChevronRightIcon />
                  </EtherscanLinkWrap>
                </ThemedText.Link>
              </EtherscanLink>

              <CloseButton size={ButtonSize.medium} emphasis={ButtonEmphasis.medium} onClick={usdcAirdropToggle}>
                Close
              </CloseButton>
            </ClaimContainer>
          ) : (
            <>
              <ImageContainer>
                <TextContainer>
                  <SyledCloseIcon onClick={usdcAirdropToggle} stroke="white" />
                  <MainHeader>Uniswap NFT Airdrop</MainHeader>
                  <USDCLabel>{totalAmount} USDC</USDCLabel>
                  <Line />
                  <RewardsDetailsContainer>
                    <RewardsText>Trading rewards</RewardsText>{' '}
                    <CurrencyText>
                      {totalAmount === RewardAmounts.tradingRewardAmount || totalAmount === RewardAmounts.combinedAmount
                        ? `${RewardAmounts.tradingRewardAmount} USDC`
                        : '0'}
                    </CurrencyText>
                  </RewardsDetailsContainer>
                  <RewardsDetailsContainer>
                    <RewardsText>Genie NFT holder rewards</RewardsText>{' '}
                    <CurrencyText>
                      {totalAmount !== RewardAmounts.tradingRewardAmount
                        ? `${RewardAmounts.holderRewardAmount} USDC`
                        : '0'}
                    </CurrencyText>
                  </RewardsDetailsContainer>
                </TextContainer>
                <StyledImage src={airdropBackgroundv2} />
              </ImageContainer>
              <Body>
                <RewardsInformationText>
                  As a long time supporter of Genie, you’ve been awarded {totalAmount} USDC tokens.
                </RewardsInformationText>
                <ReactLinkWrap>
                  <LinkWrap href="https://uniswap.org/blog/uniswap-nft-aggregator-announcement" target="_blank">
                    <ThemedText.Link>Read more about Uniswap NFT.</ThemedText.Link>
                  </LinkWrap>
                </ReactLinkWrap>

                {error && (
                  <Error>
                    <AlertTriangle />
                    Claim USDC failed. Please try again later
                  </Error>
                )}

                <ClaimButton
                  onClick={makeClaim}
                  size={ButtonSize.medium}
                  emphasis={ButtonEmphasis.medium}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader stroke="white" />}
                  <span>Claim{isSubmitting && 'ing'} USDC</span>
                </ClaimButton>
              </Body>
            </>
          )}
        </ModalWrap>
      </Modal>
    </>
  )
}

export default AirdropModal
