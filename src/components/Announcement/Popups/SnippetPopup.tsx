import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useState } from 'react'
import { ChevronsUp, X } from 'react-feather'
import { Flex } from 'rebass'
import styled, { css } from 'styled-components'
import { Navigation, Pagination } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react/swiper-react'

import NotificationImage from 'assets/images/notification_default.png'
import CtaButton from 'components/Announcement/Popups/CtaButton'
import { useNavigateCtaPopup } from 'components/Announcement/helper'
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
import { useRemovePopup } from 'state/application/hooks'

const IMAGE_HEIGHT = '140px'
const PADDING_MOBILE = '16px'

const ItemWrapper = styled.div<{ expand: boolean }>`
  background-color: ${({ theme }) => rgba(theme.tabActive, 0.95)};
  height: ${IMAGE_HEIGHT};
  border-radius: 8px;
  display: flex;
  position: relative;
  ${({ expand }) =>
    expand &&
    css`
      height: unset;
      padding: 20px 20px 12px 20px;
    `};
  ${({ theme }) => theme.mediaWidth.upToSmall`
     height: unset;
  `}
`

const ContentColumn = styled(AutoColumn)<{ expand: boolean }>`
  padding: ${({ expand }) => (expand ? '14px' : '14px 40px 14px 14px')};
  gap: 14px;
  flex: 1;
  ${({ theme, expand }) => theme.mediaWidth.upToSmall`
    padding: ${expand ? '14px' : '36px 40px 14px 14px'};
  `}
`

const Image = styled.img<{ expand: boolean }>`
  max-width: ${IMAGE_HEIGHT};
  height: ${IMAGE_HEIGHT};
  border-radius: 8px;
  object-fit: cover;
  ${({ expand }) =>
    expand &&
    css`
      display: none;
    `}
  ${({ theme }) => theme.mediaWidth.upToSmall`
     display: none;
  `}
`

const Desc = styled.div<{ expand: boolean }>`
  max-width: 100%;
  line-height: 14px;
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  ${({ expand }) =>
    !expand
      ? css`
          display: block;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        `
      : css`
          line-height: 16px;
        `};
  > * {
    margin: 0;
  }
`

const Title = styled.div<{ expand: boolean }>`
  max-width: 100%;
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  ${({ expand }) =>
    expand
      ? css`
          word-break: break-all;
        `
      : css`
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        `};
`

const SeeMore = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
`

const StyledCtaButton = styled(CtaButton)`
  min-width: 140px;
  width: fit-content;
  height: 36px;
`

function SnippetPopupItem({
  data,
  expand,
  setExpand,
}: {
  expand: boolean
  data: PopupItemType<PopupContentAnnouncement>
  setExpand: (v: boolean) => void
}) {
  const { templateBody = {} } = data.content
  const { ctas = [], name, content, thumbnailImageURL } = templateBody as AnnouncementTemplatePopup
  const removePopup = useRemovePopup()
  const toggle = () => {
    setExpand(!expand)
  }
  const navigate = useNavigateCtaPopup()
  const ctaInfo = { ...ctas[0], name: ctas[0]?.name || t`Close` }
  const isCtaClose = !ctas[0]?.name || !ctas[0]?.url

  const { mixpanelHandler } = useMixpanel()
  const trackingClickCta = () => {
    mixpanelHandler(MIXPANEL_TYPE.ANNOUNCEMENT_CLICK_CTA_POPUP, {
      announcement_type: PopupType.SNIPPET,
      announcement_title: name,
    })
  }

  return (
    <ItemWrapper expand={expand}>
      <Image expand={expand} src={thumbnailImageURL || NotificationImage} />
      <ContentColumn expand={expand}>
        <Title expand={expand}>{name}</Title>
        <Desc expand={expand} dangerouslySetInnerHTML={{ __html: content }} />
        <Flex
          alignItems="flex-end"
          style={{ position: 'relative', justifyContent: expand ? 'center' : 'flex-start', gap: '12px' }}
        >
          <StyledCtaButton
            data={ctaInfo}
            color="primary"
            onClick={() => {
              navigate(ctaInfo.url)
              if (isCtaClose) removePopup(data)
              trackingClickCta()
            }}
          />
          <SeeMore onClick={toggle}>
            <ChevronsUp size={16} style={{ transform: `rotate(${expand ? 180 : 0}deg)` }} />
            {expand ? <Trans>See Less</Trans> : <Trans>See More</Trans>}
          </SeeMore>
        </Flex>
      </ContentColumn>
    </ItemWrapper>
  )
}

const Wrapper = styled.div<{ expand: boolean }>`
  position: fixed;
  left: 30px;
  bottom: 30px;
  z-index: ${Z_INDEXS.POPUP_NOTIFICATION};
  width: 480px;

  // custom swiper below
  --swiper-navigation-size: 12px;
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
    top: 10px;
    bottom: unset;
    ${({ expand }) =>
      !expand &&
      css`
        width: ${IMAGE_HEIGHT};
      `}
    .swiper-pagination-bullet {
      width: 8px;
      height: 8px;
      opacity: 1;
      background: none;
      border: 1px solid ${({ theme }) => theme.subText};
      &.swiper-pagination-bullet-active {
        background: ${({ theme }) => theme.primary};
        border: none;
      }
    }
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    ${css`
      left: 0;
      right: 0;
      width: 100%;
      padding: 0px ${PADDING_MOBILE};
      --swiper-navigation-size: 10px;
      .swiper-pagination {
        width: 100%;
      }
      .swiper-button-prev,
      .swiper-button-next {
        visibility: visible;
      }
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
  const [expand, setExpand] = useState(false)
  const { mixpanelHandler } = useMixpanel()
  const trackingClose = () =>
    mixpanelHandler(MIXPANEL_TYPE.ANNOUNCEMENT_CLICK_CLOSE_POPUP, { message_title: 'snippet_popups' })

  return (
    <Wrapper expand={expand}>
      <Swiper
        slidesPerView={1}
        navigation
        autoHeight
        pagination
        loop
        observer
        observeParents
        modules={[Navigation, Pagination]}
      >
        {data.map(banner => (
          <SwiperSlide key={banner.key}>
            <SnippetPopupItem expand={expand} setExpand={setExpand} data={banner} />
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
