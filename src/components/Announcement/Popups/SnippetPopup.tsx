import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { X } from 'react-feather'
import { Flex } from 'rebass'
import styled, { css } from 'styled-components'
import { Navigation, Pagination } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react/swiper-react'

import NotificationImage from 'assets/images/notification_default.png'
import CtaButton from 'components/Announcement/Popups/CtaButton'
import { useNavigateToUrl } from 'components/Announcement/helper'
import {
  AnnouncementTemplatePopup,
  PopupContentAnnouncement,
  PopupItemType,
  PopupType,
} from 'components/Announcement/type'
import { AutoColumn } from 'components/Column'
import { Z_INDEXS } from 'constants/styles'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { useDetailAnnouncement, useRemovePopup } from 'state/application/hooks'

const IMAGE_HEIGHT = '124px'
const PADDING_MOBILE = '16px'

const ItemWrapper = styled.div`
  background-color: ${({ theme }) => rgba(theme.tabActive, 0.95)};
  height: ${IMAGE_HEIGHT};
  border-radius: 8px;
  display: flex;
  position: relative;
  ${({ theme }) => theme.mediaWidth.upToSmall`
     height: 124px;
  `}
`

const ContentColumn = styled(AutoColumn)`
  padding: 16px 40px 16px 16px;
  gap: 14px;
  flex: 1;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 16px 40px 16px 16px;
  `}
`

const Image = styled.img`
  max-width: 200px;
  height: ${IMAGE_HEIGHT};
  border-radius: 8px;
  object-fit: cover;
  cursor: pointer;
  ${({ theme }) => theme.mediaWidth.upToSmall`
     display: none;
  `}
`

const Title = styled.div`
  max-width: 100%;
  font-size: 14px;
  line-height: 20px;
  height: 42px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  display: block;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
`

const StyledCtaButton = styled(CtaButton)`
  font-size: 14px;
`

const SeeMore = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  font-weight: 500;
`

function SnippetPopupItem({
  data,
  index,
  showDetailAnnouncement,
}: {
  index: number
  data: PopupItemType<PopupContentAnnouncement>
  showDetailAnnouncement: (index: number) => void
}) {
  const { templateBody = {} } = data.content
  const { ctas = [], name, thumbnailImageURL } = templateBody as AnnouncementTemplatePopup

  const removePopup = useRemovePopup()
  const toggle = () => {
    showDetailAnnouncement(index)
    removePopup(data)
  }
  const navigate = useNavigateToUrl()
  const ctaInfo = ctas[0]
  const hasCta = Boolean(ctaInfo?.name && ctaInfo?.url)

  const { mixpanelHandler } = useMixpanel()
  const trackingClickCta = () => {
    mixpanelHandler(MIXPANEL_TYPE.ANNOUNCEMENT_CLICK_CTA_POPUP, {
      announcement_type: PopupType.SNIPPET,
      announcement_title: name,
    })
  }

  const onClickCta = () => {
    navigate(ctaInfo?.url)
    removePopup(data)
    trackingClickCta()
  }

  return (
    <ItemWrapper>
      <Image onClick={toggle} src={thumbnailImageURL || NotificationImage} />
      <ContentColumn>
        <Title onClick={toggle}>{name}</Title>
        <Flex
          alignItems="flex-end"
          style={{
            position: 'relative',
            justifyContent: hasCta ? 'space-between' : 'flex-start',
            gap: '12px',
            alignItems: 'flex-end',
          }}
        >
          {hasCta && <StyledCtaButton data={ctaInfo} color="link" onClick={onClickCta} />}
          <SeeMore onClick={toggle}>
            <Trans>Read More</Trans>
          </SeeMore>
        </Flex>
      </ContentColumn>
    </ItemWrapper>
  )
}

const Wrapper = styled.div`
  position: fixed;
  left: 30px;
  bottom: 30px;
  z-index: ${Z_INDEXS.POPUP_NOTIFICATION};
  width: 470px;

  // custom swiper below
  --swiper-navigation-size: 12px;
  > div.swiper {
    border-radius: 8px;
  }
  .swiper-button-prev,
  .swiper-button-next {
    color: ${({ theme }) => theme.text};
    background: ${({ theme }) => rgba(theme.border, 0.8)};
    width: 24px;
    height: 24px;
    margin-top: 0;
    border-radius: 50%;
    transform: translateY(-50%);
    visibility: hidden;
  }
  &:hover {
    .swiper-button-prev,
    .swiper-button-next {
      visibility: visible;
    }
  }
  .swiper-pagination {
    display: none;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    ${css`
      left: 0;
      right: 0;
      width: 100%;
      padding: 0px ${PADDING_MOBILE};
      --swiper-navigation-size: 10px;
    `}`}
`

const Close = styled(X)`
  position: absolute;
  right: 12px;
  top: 12px;
  cursor: pointer;
  z-index: 1;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    right: calc(12px + ${PADDING_MOBILE});
  `}
`
export default function SnippetPopup({
  data,
  clearAll,
}: {
  data: PopupItemType<PopupContentAnnouncement>[]
  clearAll: () => void
}) {
  const theme = useTheme()
  const [, setAnnouncementDetail] = useDetailAnnouncement()
  const showDetailAnnouncement = (selectedIndex: number) => {
    setAnnouncementDetail({
      announcements: data.map(e => e.content.templateBody) as AnnouncementTemplatePopup[],
      selectedIndex,
      hasMore: false,
    })
    clearAll()
  }

  const { mixpanelHandler } = useMixpanel()
  const trackingClose = () =>
    mixpanelHandler(MIXPANEL_TYPE.ANNOUNCEMENT_CLICK_CLOSE_POPUP, { message_title: 'snippet_popups' })

  return (
    <Wrapper>
      <Swiper
        slidesPerView={1}
        navigation
        autoHeight
        pagination
        loop={data.length > 1}
        observer
        observeParents
        modules={[Navigation, Pagination]}
      >
        {data.map((banner, index) => (
          <SwiperSlide key={banner.key}>
            <SnippetPopupItem index={index} data={banner} showDetailAnnouncement={showDetailAnnouncement} />
          </SwiperSlide>
        ))}
      </Swiper>
      <Close
        size={18}
        color={theme.subText}
        onClick={() => {
          clearAll()
          trackingClose()
        }}
      />
    </Wrapper>
  )
}
