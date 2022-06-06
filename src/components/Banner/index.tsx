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

import LM_Desktop from 'assets/banners/LM-desktop.png'
import LM_Tablet from 'assets/banners/LM-tablet.png'
import LM_Mobile from 'assets/banners/LM-mobile-300dpi.png'

import ReferralCampaignDesktop from 'assets/banners/referral-campaign-desktop.png'
import ReferralCampaignTablet from 'assets/banners/referral-campaign-tablet.png'
import ReferralCampaignMobile from 'assets/banners/referral-campaign-mobile.png'

import CommunityAMALivestreamWithCEODesktop from 'assets/banners/community-ama-livestream-with-ceo-desktop.png'
import CommunityAMALivestreamWithCEOTablet from 'assets/banners/community-ama-livestream-with-ceo-tablet.png'
import CommunityAMALivestreamWithCEOMobile from 'assets/banners/community-ama-livestream-with-ceo-mobile.png'

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

  const [showBanner, setShowBanner] = useLocalStorage('put-up-banner', true)

  const banners = [
    {
      // Community AMA livestream with CEO
      start: new Date(1654473600000), // June 6, 2022 0:00:00
      end: new Date(1654819199000), // June 9, 2022 23:59:59
      img: isInModal
        ? CommunityAMALivestreamWithCEOMobile
        : w >= 768
        ? CommunityAMALivestreamWithCEODesktop
        : w >= 500
        ? CommunityAMALivestreamWithCEOTablet
        : CommunityAMALivestreamWithCEOMobile,
      link: 'https://twitter.com/KyberNetwork/status/1533697331463303169',
    },
    {
      // REFERRAL CAMPAIGN
      start: new Date(1653004800000), // May 20, 2022 0:00:00
      end: new Date(1653609599000), // May 26, 2022 23:59:59
      img: isInModal
        ? ReferralCampaignMobile
        : w >= 768
        ? ReferralCampaignDesktop
        : w >= 500
        ? ReferralCampaignTablet
        : ReferralCampaignMobile,
      link: isInModal
        ? 'https://blog.kyber.network/introducing-kyberswaps-referral-campaign-2000-in-knc-rewards-up-for-grabs-when-you-share-1966da343e28#%2Fswap%3FnetworkId=1&utm_source=onsite-banner&utm_medium=window-popup&utm_campaign=referral-May2022'
        : 'https://blog.kyber.network/introducing-kyberswaps-referral-campaign-2000-in-knc-rewards-up-for-grabs-when-you-share-1966da343e28#%2Fswap%3FnetworkId=1&utm_source=onsite-banner&utm_medium=home-top-banner&utm_campaign=referral-May2022',
    },
    {
      // BTTC Liquidity Mining.
      start: new Date(1650585600000), // April 22, 2022 0:00:00
      end: new Date(1654041599000), // May 31, 2022 23:59:59
      img: isInModal ? B2_Mobile : w >= 768 ? B2_Desktop : w >= 500 ? B2_Tablet : B2_Mobile,
      // img: B2_Mobile,
      link:
        'https://blog.kyber.network/kyberswap-leads-dex-integration-with-bittorrent-chain-providing-liquidity-and-accessibility-across-2da780082b19?source=collection_home---4------0-----------------------',
    },
    {
      // BTTC Liquidity Mining.
      start: new Date(1650585600000), // April 22, 2022 0:00:00
      end: new Date(1654041599000), // May 31, 2022 23:59:59
      img: isInModal ? B1_Mobile : w >= 768 ? B1_Desktop : w >= 500 ? B1_Tablet : B1_Mobile,
      link:
        'https://blog.kyber.network/kyberswap-leads-dex-integration-with-bittorrent-chain-providing-liquidity-and-accessibility-across-2da780082b19?source=collection_home---4------0-----------------------',
    },
    {
      // AVAX LM
      start: new Date(1647820800000), // March 21, 2022 0:00:00
      end: new Date(1654041599000), // May 31, 2022 23:59:59
      img: isInModal ? LM_Mobile : w >= 768 ? LM_Desktop : w >= 500 ? LM_Tablet : LM_Mobile,
      link:
        'https://kyberswap.com/?utm_source=kyberswap&utm_medium=banner&utm_campaign=avaxphase2&utm_content=lm#/farms?networkId=43114',
    },
  ].filter(b => {
    const date = new Date()
    return date >= b.start && date <= b.end
  })

  if (!showBanner) return null

  return (
    <BannerWrapper margin={margin || 'auto'} padding={padding} maxWidth={maxWidth || '1394px'} width="100%">
      <Swiper
        autoplay={{ delay: isInModal ? 2000 : 20000 }}
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
