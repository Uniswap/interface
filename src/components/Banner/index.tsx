import React, { memo } from 'react'
import AvaxContestDesktop from 'assets/banners/Avax-Contest-Desktop.png'
import AvaxContestMobile from 'assets/banners/Avax-Contest-mobile.png'
import AvaxContestTablet from 'assets/banners/Avax-Contest-Tablet.png'
import AvaxLMDesktop from 'assets/banners/Avax-LM-desktop.png'
import AvaxLMMobile from 'assets/banners/Avax-LM-mobile.png'
import AvaxLMTablet from 'assets/banners/Avax-LM-tablet.png'
import { useWindowSize } from 'hooks/useWindowSize'
import styled from 'styled-components'
import { X } from 'react-feather'
import { ExternalLink } from 'theme'
import useTheme from 'hooks/useTheme'
import { Flex } from 'rebass'
import { useLocalStorage } from 'react-use'
import { Autoplay, Navigation, Pagination } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react/swiper-react'

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

function Banner({ margin, padding, maxWidth }: { margin?: string; padding?: string; maxWidth?: string }) {
  const size = useWindowSize()
  const w = size?.width || 0
  const theme = useTheme()

  const [showBanner, setShowBanner] = useLocalStorage('put-up-banner', true)

  const banners = [
    {
      img: w >= 768 ? AvaxLMDesktop : w >= 500 ? AvaxLMTablet : AvaxLMMobile,
      link:
        'https://kyberswap.com/?utm_source=kyberswap&utm_medium=banner&utm_campaign=avaxphase2&utm_content=lm#/farms?networkId=43114',
    },
    {
      img: w >= 768 ? AvaxContestDesktop : w >= 500 ? AvaxContestTablet : AvaxContestMobile,
      link:
        'https://medium.com/@kyberteam/50-000-in-rewards-for-kyberswaps-sure-win-trading-contest-with-avax-9af822f6ae12',
    },
  ]

  if (!showBanner) return null

  return (
    <BannerWrapper margin={margin || 'auto'} padding={padding} maxWidth={maxWidth || '1028px'} width="100%">
      <Swiper
        autoplay={{ delay: 60000 }}
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
