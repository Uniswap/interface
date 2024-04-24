import { Trans } from '@lingui/macro'
import PerpModal from 'components/Perpetual'
import { SupportedChainId } from 'constants/chains'
import { useModalOpen, useShowClaimPopup, useTogglePerpModal, useToggleSelfClaimModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { useUserHasAvailableClaim } from 'state/claim/hooks'
import { useUserHasSubmittedClaim } from 'state/transactions/hooks'
import styled from 'styled-components/macro'

import tokenLogo from '../../assets/images/krom_logo.png'
import KromatikaLogo from '../../assets/images/KROM_Transparent_1.png'
import { ReactComponent as PhoneScreenLogo } from '../../assets/svg/phone-logo.svg'
import { KROM } from '../../constants/tokens'
import useUSDCPrice from '../../hooks/useUSDCPrice'
import { useActiveWeb3React } from '../../hooks/web3'
import { ExternalLink, TYPE } from '../../theme'
import ClaimModal from '../claim/ClaimModal'
import { CardNoise } from '../earn/styled'
import Menu from '../Menu'
import NavigationLinks from '../NavigationLinks'
import { Dots } from '../swap/styleds'
import Web3Status from '../Web3Status'
import NetworkSelector from './NetworkSelector'

const HeaderFrame = styled.div<{ showBackground: boolean }>`
  display: grid;
  grid-template-columns: minmax(240px, 1fr) 1fr 1fr;
  justify-content: space-between;
  align-items: center;
  flex-direction: row;
  width: 100%;
  top: 0;
  position: relative;
  padding: 1rem;
  z-index: 1;
  /* Background slide effect on scroll. */
  background-color: transparent;
  background-position: ${({ showBackground }) => (showBackground ? '0 -100%' : '0 0')};
  background-size: 100% 200%;
  transition: background-position 0.1s, box-shadow 0.1s;
  background-blend-mode: hard-light;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: minmax(175px, 1fr) 1fr 1fr;
  `};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem 1rem;
    grid-template-columns: 1fr 1fr 1fr;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 0.5rem;
    grid-template-columns: minmax(36px, 1fr) 1fr 1fr;
  `};
`

const MainLogo = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  max-height: 40px;
  img {
    width: auto;
    height: 40px;
  }
  svg {
    height: 54px;
    width: 54px;
    ${({ theme }) => theme.mediaWidth.upToMedium`
      height: 48px;
      width: 48px;
   `};
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `}
`

const PhoneLogo = styled.div`
  display: none;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: flex;
  `}
`

const HeaderControls = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-self: flex-end;
`

const HeaderElement = styled.div`
  display: flex;
  align-items: center;

  &:not(:first-child) {
    margin-left: 0.5em;
  }

  /* addresses safari's lack of support for "gap" */

  & > *:not(:first-child) {
    margin-left: 8px;
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    align-items: center;
  `};
`

const AccountElement = styled.div<{ active: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme, active }) => (!active ? theme.bg1 : theme.bg1)};
  border-radius: 20px;
  white-space: nowrap;
  width: 100%;

  :focus {
    border: 1px solid blue;
  }
`

const UNIAmount = styled(AccountElement)`
  color: white;
  padding: 4px 8px;
  height: 36px;
  font-weight: 500;
  background: radial-gradient(174.47% 188.91% at 1.84% 0%, #ff007a 0%, #2172e5 100%), #edeef2;
`

const UNIWrapper = styled.span`
  width: fit-content;
  position: relative;
  cursor: pointer;

  :hover {
    opacity: 0.8;
  }

  :active {
    opacity: 0.9;
  }
`

const Title = styled.a`
  display: flex;
  align-items: center;
  justify-self: flex-start;
  pointer-events: auto;
  text-decoration: none;
  margin: 0 8px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    justify-self: center;
  `};

  :hover {
    cursor: pointer;
  }
`

const UniIcon = styled.div`
  transition: transform 0.3s ease;
  overflow: hidden;
`

const TokenPrice = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  background-color: ${({ theme }) => (theme.darkMode ? theme.bg2 : theme.bg3)};
  border: 2px solid ${({ theme }) => (theme.darkMode ? theme.bg3 : theme.bg0)};
  border-radius: 20px;

  :hover {
    background-color: ${({ theme }) => (theme.darkMode ? theme.bg2 : theme.bg0)};
    border: 2px solid ${({ theme }) => theme.bg3};
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 0.5rem;
  `};
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `};
`

const StyledLogoIcon = styled.img`
  width: 20px;
  height: 20px;
  margin-right: 8px;
`

function TopLevelModals() {
  const open = useModalOpen(ApplicationModal.PERP_POPUP)
  const toggle = useTogglePerpModal()
  return <PerpModal isOpen={open} onDismiss={toggle} />
}

export default function Header() {
  const { account, chainId } = useActiveWeb3React()
  const toggleClaimModal = useToggleSelfClaimModal()

  const kromToken = chainId ? KROM[chainId] : undefined
  const kromPrice = useUSDCPrice(kromToken)

  const availableClaim: boolean = useUserHasAvailableClaim(account)
  const { claimTxn } = useUserHasSubmittedClaim(account ?? undefined)
  const showClaimPopup = useShowClaimPopup()

  const pools: { [chainId: number]: string } = {
    [SupportedChainId.MAINNET]: 'https://info.uniswap.org/#/pools/0x6ae0cdc5d2b89a8dcb99ad6b3435b3e7f7290077',
    [SupportedChainId.ARBITRUM_ONE]:
      'https://info.uniswap.org/#/arbitrum/pools/0x54651ca452ad2d7e35babcff40760b7af0404213',
    [SupportedChainId.OPTIMISM]: 'https://info.uniswap.org/#/optimism/pools/0xe62bd99a9501ca33d98913105fc2bec5bae6e5dd',
    [SupportedChainId.POLYGON]: ' https://info.uniswap.org/#/polygon/pools/0xba589ba3af52975a12acc6de69c9ab3ac1ae7804',
    [SupportedChainId.BASE]: 'https://info.uniswap.org/#/pools/0x6ae0cdc5d2b89a8dcb99ad6b3435b3e7f7290077', // todo*: add krom pool on base when deployed
  }

  return (
    <>
      <HeaderFrame showBackground={true}>
        <ClaimModal />
        <Title href=".">
          <UniIcon>
            <MainLogo>
              <img src={KromatikaLogo} alt={'Kromatika logo'} />
            </MainLogo>
            <PhoneLogo>
              <PhoneScreenLogo width="48px" height="48px" title="logo" z-index="1" />
            </PhoneLogo>
          </UniIcon>
        </Title>
        <NavigationLinks />
        <HeaderControls>
          <HeaderElement>
            {chainId && (
              <ExternalLink href={pools[chainId]} style={{ textDecoration: 'none' }}>
                {kromPrice ? (
                  <TokenPrice>
                    <StyledLogoIcon src={tokenLogo} />
                    <TYPE.body fontSize={16}>${kromPrice?.toSignificant(2)}</TYPE.body>
                  </TokenPrice>
                ) : null}
              </ExternalLink>
            )}
          </HeaderElement>
          <HeaderElement>
            <NetworkSelector />
          </HeaderElement>
          <HeaderElement>
            {availableClaim && !showClaimPopup && (
              <UNIWrapper onClick={toggleClaimModal}>
                <UNIAmount active={!!account && !availableClaim} style={{ pointerEvents: 'auto' }}>
                  <TYPE.white padding="0 2px">
                    {claimTxn && !claimTxn?.receipt ? (
                      <Dots>
                        <Trans>Claiming UNI</Trans>
                      </Dots>
                    ) : (
                      <Trans>Claim UNI</Trans>
                    )}
                  </TYPE.white>
                </UNIAmount>
                <CardNoise />
              </UNIWrapper>
            )}
            <Web3Status />
          </HeaderElement>
          <HeaderElement>
            <Menu />
          </HeaderElement>
        </HeaderControls>
      </HeaderFrame>
      <TopLevelModals />
    </>
  )
}
