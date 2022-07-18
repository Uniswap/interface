import { useWeb3React } from '@web3-react/core'
import { useEffect, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components/macro'
import { CustomLightSpinner, ExternalLink } from 'theme'

import Circle from '../../assets/images/blue-loader.svg'
import IconCloseButton from '../../assets/images/icon-button-close.svg'
import uniIcon from '../../assets/images/uniIcon.svg'
import { themeVars, vars } from '../../css/sprinkles.css'
import { useClaimCallback, useUserUnclaimedAmount } from '../../state/claim/hooks'
import { ButtonPrimary } from '../Button'
import UniBackground from './../../assets/images/uni.png'
import { ClaimsModal } from './ClaimsModal'

const CloseClaimButton = styled.button`
  color: ${vars.color.genieBlue};
  background: transparent;
  border: none;
  font-weight: 500;
  text-align: center;
  outline: none;
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 14px;
  line-height: 19px;
  &:hover {
    background: transparent;
  }
  &:focus {
    border: none;
    outline: none;
  }
  &:disabled {
    opacity: 50%;
    cursor: auto;
    pointer-events: none;
  }
`

const ClaimComponentWrapper = styled.div`
  position: relative;
  ${({ theme }) => theme.flexColumnNoWrap}
  background-color: ${themeVars.colors.lightGray};
  overfow-y: hidden;
  margin: 0;
  width: 100%;
  border-radius: 15px;
  margin-bottom: 20px;
  width: 400px;
  min-height: 440px;
  @media (max-width: 768px) {
    max-width: 100%;
  }
`

const CloseIcon = styled.div`
  position: absolute;
  right: -82px;
  top: 14px;
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
  @media (max-width: 768px) {
    right: 1rem;
  }
`

const Body = styled.div<{ backgroundUrl: string }>`
  background: url(${(props) => props.backgroundUrl || ''}) no-repeat;
  background-size: cover;
  border-radius: 15px;
  height: 172px;
  color: white;
`

const Img = styled.img`
  position: absolute;
  height: 68px;
  width: 68px;
  top: 0;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
`

const Section = styled.div`
  position: relative;
  padding-left: 16px;
  padding-right: 16px;
  margin-top: 32px;
`

const FullWrap = styled.div`
  postion: relative;
  display: flex;
  flex-direction: column;
  overflow-y: visible;
  width: 100%;
  min-width: 400px;
  &::-webkit-scrollbar {
    display: none;
  }
`

const ClaimButton = styled(ButtonPrimary)`
  position: absolute;
  max-width: calc(100% - 32px);
  height: 44px;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 12px;
`

const ImgWrapper = styled.div`
  position: relative;
  margin-left: auto;
  margin-right: auto;
  margin-top: 10px;
  height: 100px;
  width: 100%;
`

const Link = styled(ExternalLink)`
  color: ${vars.color.genieBlue};
  text-decoration: none;
  margin-bottom: 65px;
  font-size: 14px;
`

interface claimProps {
  tokenAmount: number
  toggleShowConfetti: (showConfetti: boolean) => void
  decrement: () => void
}

const ClaimComponent = (props: claimProps) => {
  const { account: address } = useWeb3React()
  const { decrement, toggleShowConfetti, tokenAmount } = props
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [closed, setClosed] = useState(false)
  const { claimCallback: claimUni } = useClaimCallback(address)

  const tokenType = 'UNI'
  const amountStr = !!(tokenAmount % 1) ? tokenAmount.toFixed(2) : tokenAmount.toFixed(0)

  const claim = async () => {
    toggleShowConfetti(false)
    setIsClaiming(true)

    claimUni()
      .then(() => {
        setIsClaiming(false)
        setClaimed(true)
        toggleShowConfetti(true)
        decrement()
      })
      .catch((err) => {
        setIsClaiming(false)
      })
  }

  if (closed) return null

  return claimed || isClaiming ? (
    <ClaimComponentWrapper>
      <ImgWrapper>
        <Img src={uniIcon} alt="uni-icon" />
        {isClaiming && (
          <CustomLightSpinner
            style={{ position: 'absolute', top: 6, left: 155 }}
            src={Circle}
            alt="loader"
            size={'90px'}
          />
        )}
      </ImgWrapper>
      <Text textAlign="center" fontWeight="500" marginTop={44}>
        {isClaiming ? 'Claiming' : 'Claimed'}
      </Text>
      <Text textAlign="center" color={vars.color.genieBlue} marginTop={12} fontSize="36px" fontWeight="700">
        {amountStr} {tokenType}
      </Text>
      <Text textAlign="center" marginTop={12} marginBottom={69}>
        {isClaiming && <Text color={vars.color.grey300}> Confirm this transaction in your wallet</Text>}
        {!isClaiming && <Text>🎉 Welcome to the Unicorn realm! 🎉</Text>}
      </Text>
      {!isClaiming && <CloseClaimButton onClick={() => setClosed(true)}>Close</CloseClaimButton>}
    </ClaimComponentWrapper>
  ) : (
    <ClaimComponentWrapper>
      <Body backgroundUrl={UniBackground}>
        <Text paddingLeft={16} paddingRight={16} fontWeight={600} fontSize={16} marginTop={20}>
          UNI Token Airdrop
        </Text>
        <Text paddingLeft={16} paddingRight={16} fontSize="36px" marginTop={12} fontWeight={700}>
          {amountStr} {tokenType}
        </Text>
      </Body>
      <Section>
        <div style={{ marginBottom: 65 }}>
          <Text lineHeight="20px" fontSize={14}>
            As a long time supporter of Uniswap you&apos;ve been awarded {amountStr} UNI tokens used for voting and
            governance on Uniswap. You can earn more UNI by staking your liquidity.
          </Text>
          <div style={{ marginTop: 12 }}>
            <Link href="https://uniswap.org/governance">Read more about the token utility</Link>
          </div>
        </div>
      </Section>
      <ClaimButton onClick={claim}>Claim {tokenType}</ClaimButton>
    </ClaimComponentWrapper>
  )
}

export default function RewardsClaim() {
  const [isOpen, setIsOpen] = useState(false)
  const { account: address } = useWeb3React()
  const [rewardsClaimsCount, setRewardsClaimCount] = useState(0)
  const [showConfetti, toggleShowConfetti] = useState(false)
  const unclaimedUniAmount: number = parseFloat(useUserUnclaimedAmount(address)?.toFixed(0) || '0')

  useEffect(() => {
    let newCount = 0
    if (unclaimedUniAmount > 0) newCount++

    setRewardsClaimCount(newCount)
  }, [isOpen, unclaimedUniAmount])

  const dismiss = () => {
    setIsOpen(false)
    setRewardsClaimCount(0)
    toggleShowConfetti(false)
  }

  return (
    <>
      <ClaimsModal showConfetti={showConfetti} isOpen={isOpen} onDismiss={dismiss} minHeight={false}>
        <FullWrap>
          <Section>
            <Text fontWeight={400} color={themeVars.colors.explicitWhite} textAlign="center" fontSize="36px">
              Claim Rewards
            </Text>
            <Text
              color={themeVars.colors.explicitWhite}
              textAlign="center"
              fontSize="16px"
              marginBottom={24}
              marginTop={12}
              fontWeight={400}
              lineHeight="24px"
            >
              {rewardsClaimsCount === 0
                ? `You've claimed all your rewards 🎉`
                : `You have ${rewardsClaimsCount} rewards ready to claim`}
            </Text>
            <CloseIcon onClick={dismiss}>
              <img src={IconCloseButton} alt="close-icon" />
            </CloseIcon>
          </Section>
          <>
            {unclaimedUniAmount > 0 && (
              <ClaimComponent
                decrement={() => setRewardsClaimCount(0)}
                tokenAmount={unclaimedUniAmount}
                toggleShowConfetti={toggleShowConfetti}
              />
            )}
          </>
        </FullWrap>
      </ClaimsModal>
    </>
  )
}
