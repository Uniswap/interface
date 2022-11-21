import { Trans } from '@lingui/macro'
import { Box } from 'nft/components/Box'
import { subhead } from 'nft/css/common.css'
import { X } from 'react-feather'
import { useShowNftPromoBanner } from 'state/user/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { Z_INDEX } from 'theme/zIndex'

import nftPromoImage from '../nftExploreBanner/nftArt1.png'

const BackgroundColor = styled.a<{ show: boolean }>`
  background-color: ${({ theme }) => theme.backgroundSurface};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 12px;
  bottom: 48px;
  box-shadow: ${({ theme }) => theme.deepShadow};
  display: ${({ show }) => (show ? 'block' : 'none')};
  height: 100px;
  position: fixed;
  right: clamp(0px, 1vw, 16px);
  text-decoration: none;
  width: 391px;
  z-index: ${Z_INDEX.sticky};
`

const PopupContainer = styled.div`
  background-color: ${({ theme }) => theme.backgroundSurface};
  border-radius: 12px;
  color: ${({ theme }) => theme.textPrimary};
  height: 100px;
  display: flex;
  flex-direction: column;
  transition: ${({
    theme: {
      transition: { duration, timing },
    },
  }) => `${duration.slow} opacity ${timing.in}`};
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
  flex-direction: column;
  flex: 0.93;
  align-items: flex-start;
  justify-content: flex-start;
  z-index: 4;
  position: relative;
`

export default function NftExploreBanner() {
  const theme = useTheme()
  const [showNftPromoBanner, toggleShowNftPromoBanner] = useShowNftPromoBanner()

  console.log('this is showing now', showNftPromoBanner)
  return (
    <BackgroundColor
      show={showNftPromoBanner}
      target="_blank"
      style={{ textDecoration: 'none' }}
      href="https://org-git-fred-wallet-type-updates-uniswap.vercel.app/wallet"
      rel="noreferrer"
    >
      {/* <TraceEvent events={[Event.onClick]} name={EventName.EXPLORE_BANNER_CLICKED} element={ElementName.EXPLORE_BANNER}> */}
      <PopupContainer>
        <InnerContainer>
          {/* <BackdropImage /> */}
          <Box
            as="img"
            style={{
              width: '25%',
              aspectRatio: '1',
              transition: 'transform 0.25s ease 0s',
            }}
            src={nftPromoImage}
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
              <Trans>Buy and sell NFTs across more listings at better prices. Explore NFTs</Trans>
            </BannerBodyText>
          </TextContainer>
          {/* <GradientBlackOverlay /> */}
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
      {/* </TraceEvent> */}
    </BackgroundColor>
  )
}
