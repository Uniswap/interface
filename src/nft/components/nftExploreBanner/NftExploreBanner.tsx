import { Trans } from '@lingui/macro'
import { LARGE_MEDIA_BREAKPOINT, SMALL_MOBILE_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { Box } from 'nft/components/Box'
import { bodySmall, subhead } from 'nft/css/common.css'
import { X } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { useShowNftPromoBanner } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { StyledInternalLink } from 'theme'
import { Z_INDEX } from 'theme/zIndex'

import nftPromoImage1 from '../nftExploreBanner/nftArt1.png'
import nftPromoImage2 from '../nftExploreBanner/nftArt2.png'
import nftPromoImage3 from '../nftExploreBanner/nftArt3.png'

function getRandom(list: any[]) {
  return list[Math.floor(Math.random() * list.length)]
}
const randomizedNftImage = getRandom([nftPromoImage1, nftPromoImage2, nftPromoImage3])

const PopupContainer = styled.div<{ show: boolean }>`
  background-color: ${({ theme }) => theme.backgroundSurface};
  box-shadow: ${({ theme }) => theme.deepShadow};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 12px;
  cursor: pointer;
  color: ${({ theme }) => theme.textPrimary};
  display: ${({ show }) => (show ? 'flex' : 'none')};
  flex-direction: column;
  position: fixed;
  right: clamp(0px, 1vw, 16px);
  z-index: ${Z_INDEX.sticky};
  transition: ${({
    theme: {
      transition: { duration, timing },
    },
  }) => `${duration.slow} opacity ${timing.in}`};
  width: 98vw;
  bottom: 55px;
  @media screen and (min-width: ${LARGE_MEDIA_BREAKPOINT}) {
    bottom: 48px;
  }
  @media screen and (min-width: ${SMALL_MOBILE_MEDIA_BREAKPOINT}) {
    width: 391px;
  }
  :hover {
    border: double 1px transparent;
    border-radius: 12px;
    background-image: ${({ theme }) =>
      `linear-gradient(${theme.backgroundSurface}, ${theme.backgroundSurface}), 
      radial-gradient(circle at top left, hsla(299, 100%, 87%, 1), hsla(299, 100%, 61%, 1))`};
    background-origin: border-box;
    background-clip: padding-box, border-box;
  }
`

const InnerContainer = styled.div`
  overflow: hidden;
  display: flex;
  position: relative;
  gap: 8px;
  padding: 8px;
`

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: center;
`

const StyledXButton = styled(X)`
  color: ${({ theme }) => theme.textSecondary};
  &:hover {
    opacity: ${({ theme }) => theme.opacity.hover};
  }
  &:active {
    opacity: ${({ theme }) => theme.opacity.click};
  }
`

const StyledImageContainer = styled(Box)`
  width: 23%;
  cursor: pointer;
  aspectratio: 1;
  transition: transform 0.25s ease 0s;
  object-fit: contain;
`

export default function NftExploreBanner() {
  const [showNftPromoBanner, stopShowingNftPromoBanner] = useShowNftPromoBanner()
  const navigate = useNavigate()

  const navigateToNfts = () => {
    navigate('/nfts')
    stopShowingNftPromoBanner()
  }

  return (
    <PopupContainer show={showNftPromoBanner} onClick={navigateToNfts}>
      <InnerContainer>
        <StyledImageContainer as="img" src={randomizedNftImage} draggable={false} />
        <TextContainer>
          {/* <HeaderText> */}
          <div className={subhead}>
            <Trans>Introducing Uniswap NFT</Trans>
          </div>
          {/* </HeaderText> */}

          {/* <Description> */}
          <div className={bodySmall}>
            <Trans>Buy and sell NFTs across more listings at better prices.</Trans>{' '}
            <StyledInternalLink to="/nfts">
              <Trans>Explore NFTs</Trans>
            </StyledInternalLink>{' '}
          </div>
        </TextContainer>
        {/* </Description> */}
        <StyledXButton
          size={20}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            stopShowingNftPromoBanner()
          }}
        />
      </InnerContainer>
    </PopupContainer>
  )
}
