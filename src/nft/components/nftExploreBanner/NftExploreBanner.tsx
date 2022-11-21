import { Trans } from '@lingui/macro'
import { Box } from 'nft/components/Box'
import { subhead } from 'nft/css/common.css'
import { X } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { useShowNftPromoBanner } from 'state/user/hooks'
import styled, { useTheme } from 'styled-components/macro'
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
  height: 100px;
  display: ${({ show }) => (show ? 'flex' : 'none')};
  flex-direction: column;
  bottom: 48px;
  position: fixed;
  right: clamp(0px, 1vw, 16px);
  text-decoration: none;
  width: ${Math.min(391, window.innerWidth - 5)}px;
  z-index: ${Z_INDEX.sticky};
  transition: ${({
    theme: {
      transition: { duration, timing },
    },
  }) => `${duration.slow} opacity ${timing.in}`};
  :hover {
    border: double 1px transparent;
    border-radius: 12px;
    background-image: ${({ theme }) =>
      `linear-gradient(${theme.backgroundSurface}, ${theme.backgroundSurface}), 
      radial-gradient(circle at top left, hsla(299, 100%, 61%, 1), hsla(299, 100%, 87%, 1))`};
    background-origin: border-box;
    background-clip: padding-box, border-box;
  }
`

const InnerContainer = styled.div`
  overflow: hidden;
  display: flex;
  position: relative;
  gap: 8px;
  height: 100%;
  padding: 8px;
`

const BannerBodyText = styled.p`
  font-size: 14px;
  line-height: 20px;
  margin: 0;
`

const TextContainer = styled.div`
  display: flex;
  cursor: pointer;
  flex-direction: column;
  flex: 0.93;
  align-items: flex-start;
  justify-content: center;
  z-index: 4;
  position: relative;
`

export default function NftExploreBanner() {
  const theme = useTheme()
  const [showNftPromoBanner, toggleShowNftPromoBanner] = useShowNftPromoBanner()
  const navigate = useNavigate()

  const navigateToNfts = () => {
    navigate('/nfts')
  }

  return (
    <PopupContainer show={showNftPromoBanner} onClick={navigateToNfts}>
      <InnerContainer>
        <Box
          as="img"
          style={{
            width: '25%',
            cursor: 'pointer',
            aspectRatio: '1',
            transition: 'transform 0.25s ease 0s',
          }}
          src={randomizedNftImage}
          objectFit="contain"
          draggable={false}
        />
        <TextContainer>
          {/* <HeaderText> */}
          <div className={subhead}>
            <Trans>Introducing Uniswap NFT</Trans>
          </div>
          {/* </HeaderText> */}

          {/* <Description> */}
          <BannerBodyText>
            <Trans>Buy and sell NFTs across more listings at better prices.</Trans>{' '}
            <StyledInternalLink to="/nfts">Explore NFTs</StyledInternalLink>{' '}
          </BannerBodyText>
        </TextContainer>
        {/* </Description> */}
        <X
          size={20}
          color={theme.textSecondary}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleShowNftPromoBanner()
          }}
          style={{ cursor: 'pointer', position: 'absolute', right: 10, zIndex: 5 }}
        />
      </InnerContainer>
    </PopupContainer>
  )
}
