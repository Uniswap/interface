import React, { memo, useMemo } from 'react'
import { X } from 'react-feather'
import { useLocalStorage } from 'react-use'
import { Flex } from 'rebass'
import styled from 'styled-components'
import { Autoplay, Navigation, Pagination } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react'

import KyberSwapTradingCampaignCronosDesktop from 'assets/banners/kyberswap-trading-campaign-cronos-desktop.png'
import KyberSwapTradingCampaignCronosMobile from 'assets/banners/kyberswap-trading-campaign-cronos-mobile.png'
import KyberSwapTradingCampaignCronosTablet from 'assets/banners/kyberswap-trading-campaign-cronos-tablet.png'
import useTheme from 'hooks/useTheme'
import { useWindowSize } from 'hooks/useWindowSize'
import { ExternalLink } from 'theme'

const BannerWrapper = styled(Flex)`
  --swiper-navigation-size: 12px;

  .swiper-button-prev,
  .swiper-button-next {
    color: #ffffff;
    background: rgba(0, 0, 0, 0.25);
    width: 32px;
    height: 32px;
    margin-top: 0;
    border-radius: 50%;
    transform: translateY(-50%);
    visibility: hidden;
  }

  .swiper-pagination-bullet {
    height: 5px;
    width: 5px;
    background: #d5dbde;
  }

  .swiper-pagination-bullet-active {
    width: 20px;
    border-radius: 4px;
    background: #ffffff;
  }

  &:hover {
    .swiper-button-prev,
    .swiper-button-next {
      visibility: visible;
    }
  }
`

const Wrapper = styled.div`
  margin: auto;
  position: relative;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;

  img {
    border-radius: 8px;
  }
  @media screen and (min-width: 1100px) {
    max-width: 1054px;
  }
  @media screen and (min-width: 1240px) {
    max-width: 1154px;
  }
  @media screen and (min-width: 1320px) {
    max-width: 1226px;
  }
  @media screen and (min-width: 1500px) {
    max-width: 1394px;
  }
`

const Close = styled(X)`
  position: absolute;
  top: 0;
  right: 0;
  background: ${({ theme }) => theme.buttonBlack + '66'};
  padding: 4px;
  cursor: pointer;
  border-bottom-left-radius: 8px;
`

function Banner({
  margin,
  padding,
  maxWidth,
  isInModal = false,
}: {
  margin?: string
  padding?: string
  maxWidth?: string
  isInModal?: boolean
}) {
  const size = useWindowSize()
  const w = size?.width || 0
  const theme = useTheme()

  const ALL_BANNERS = [
    {
      // KyberSwap Trading Campaign Cronos
      id: 'kyberSwap-trading-campaign-cronos',
      start: new Date('2022-07-26T00:00:00.000Z'),
      end: new Date('2022-08-03T23:59:59.000Z'),
      img: isInModal
        ? KyberSwapTradingCampaignCronosMobile
        : w > 768
        ? KyberSwapTradingCampaignCronosDesktop
        : w > 500
        ? KyberSwapTradingCampaignCronosTablet
        : KyberSwapTradingCampaignCronosMobile,
      link: 'https://kyberswap.com/campaigns?selectedCampaignId=2&networkId=25&utm_source=kyberswap&utm_medium=banner&utm_campaign=cronostradingcontest&utm_content=onsite',
    },
  ]

  const [_showBanner, setShowBanner] = useLocalStorage('show-banner-' + ALL_BANNERS[0].id, true)
  const banners = ALL_BANNERS.filter(b => {
    const date = new Date()
    return date >= b.start && date <= b.end
  })
  const showBanner = useMemo(() => _showBanner && banners.length, [_showBanner, banners.length])

  if (!showBanner) return null

  return (
    <BannerWrapper margin={margin || 'auto'} padding={padding} maxWidth={maxWidth || '1394px'} width="100%">
      <Swiper
        autoplay={banners.length > 1 ? { delay: isInModal ? 2000 : 20000 } : false}
        slidesPerView={1}
        navigation={true}
        pagination={true}
        loop={true}
        modules={[Navigation, Pagination, Autoplay]}
      >
        {banners.map((banner, index) => (
          <SwiperSlide key={index}>
            <Wrapper>
              <ExternalLink href={banner.link}>
                <img src={banner.img} alt="banner" width="100%" />
              </ExternalLink>
              <Close color={theme.white} role="button" onClick={() => setShowBanner(false)} />
            </Wrapper>
          </SwiperSlide>
        ))}
      </Swiper>
    </BannerWrapper>
  )
}

export default memo(Banner)
