import React, { memo } from 'react'
import { useWindowSize } from 'hooks/useWindowSize'
import styled from 'styled-components'
import { X } from 'react-feather'
import { ExternalLink } from 'theme'
import useTheme from 'hooks/useTheme'
import { Flex } from 'rebass'
import { useLocalStorage } from 'react-use'
import { Autoplay, Navigation, Pagination } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react/swiper-react'

import B1_Desktop from 'assets/banners/banner_1_desktop.png'
import B1_Tablet from 'assets/banners/banner_1_tablet.png'
import B1_Mobile from 'assets/banners/banner_1_mobile.png'
import B2_Desktop from 'assets/banners/banner_2_desktop.png'
import B2_Tablet from 'assets/banners/banner_2_tablet.png'
import B2_Mobile from 'assets/banners/banner_2_mobile.png'

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
      img: w >= 768 ? B2_Desktop : w >= 500 ? B2_Tablet : B2_Mobile,
      link:
        'https://blog.kyber.network/kyberswap-leads-dex-integration-with-bittorrent-chain-providing-liquidity-and-accessibility-across-2da780082b19?source=collection_home---4------0-----------------------',
    },
    {
      img: w >= 768 ? B1_Desktop : w >= 500 ? B1_Tablet : B1_Mobile,
      link:
        'https://blog.kyber.network/kyberswap-leads-dex-integration-with-bittorrent-chain-providing-liquidity-and-accessibility-across-2da780082b19?source=collection_home---4------0-----------------------',
    },
  ]

  if (!showBanner) return null

  return (
    <BannerWrapper margin={margin || 'auto'} padding={padding} maxWidth={maxWidth || '1028px'} width="100%">
      <Swiper
        autoplay={{ delay: 20000 }}
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
