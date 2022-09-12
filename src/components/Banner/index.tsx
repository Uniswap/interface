import React, { memo, useMemo } from 'react'
import { X } from 'react-feather'
import { useLocalStorage } from 'react-use'
import { Flex } from 'rebass'
import styled from 'styled-components'
import { Autoplay, Navigation, Pagination } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react'

import KyberSwapTradingCampaignDesktop from 'assets/banners/kyberswap-trading-campaign-polygon-desktop.png'
import KyberSwapTradingCampaignMobile from 'assets/banners/kyberswap-trading-campaign-polygon-mobile.png'
import KyberSwapTradingCampaignTablet from 'assets/banners/kyberswap-trading-campaign-polygon-tablet.png'
import PolygonDesktop from 'assets/banners/polygon-desktop.png'
import PolygonMobile from 'assets/banners/polygon-mobile.png'
import PolygonTablet from 'assets/banners/polygon-tablet.png'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
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
  const { mixpanelHandler } = useMixpanel()

  const ALL_BANNERS = useMemo(
    () => [
      {
        // KyberSwap Trading Campaign ATH
        id: 'kyberSwap-trading-campaign-polygon',
        name: 'KyberSwap Trading Campaign ATH',
        start: new Date('2022-08-15T11:00:00.000Z'),
        end: new Date('2022-08-30T23:59:59.000Z'),
        img: isInModal
          ? KyberSwapTradingCampaignMobile
          : w > 768
          ? KyberSwapTradingCampaignDesktop
          : w > 500
          ? KyberSwapTradingCampaignTablet
          : KyberSwapTradingCampaignMobile,
        link: 'https://kyberswap.com/campaigns/kyberswap-trading-campaigns-with-polygon-chain-5?networkId=137&utm_source=partner&utm_medium=banner&utm_campaign=polygontradingcontest&utm_content=onsite',
      },
      {
        // Polygon LM
        id: 'polygon-lm',
        name: 'Polygon LM',
        start: new Date('2022-08-17T00:00:00.000Z'),
        end: new Date('2022-09-17T00:00:00.000Z'),
        img: isInModal ? PolygonMobile : w > 768 ? PolygonDesktop : w > 500 ? PolygonTablet : PolygonMobile,
        link: 'https://kyberswap.com/farms?tab=elastic&networkId=137',
      },
    ],
    [isInModal, w],
  )

  const [_showBanner, setShowBanner] = useLocalStorage('show-banner-' + ALL_BANNERS[0].id, true)
  const banners = useMemo(
    () =>
      ALL_BANNERS.filter(b => {
        const date = new Date()
        return date >= b.start && date <= b.end
      }),
    [ALL_BANNERS],
  )
  const showBanner = _showBanner && banners.length

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
              <ExternalLink
                href={banner.link}
                onClick={() => {
                  mixpanelHandler(MIXPANEL_TYPE.BANNER_CLICK, {
                    banner_name: banner.name,
                    banner_url: banner.link,
                  })
                }}
              >
                <img src={banner.img} alt="banner" width="100%" />
              </ExternalLink>
              <Close
                color={theme.white}
                role="button"
                onClick={() => {
                  mixpanelHandler(MIXPANEL_TYPE.CLOSE_BANNER_CLICK, {
                    banner_name: banner.name,
                    banner_url: banner.link,
                  })
                  setShowBanner(false)
                }}
              />
            </Wrapper>
          </SwiperSlide>
        ))}
      </Swiper>
    </BannerWrapper>
  )
}

export default memo(Banner)
