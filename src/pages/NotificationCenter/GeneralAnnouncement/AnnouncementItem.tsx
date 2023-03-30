import { useState } from 'react'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'
import styled, { CSSProperties, css } from 'styled-components'

import NotificationImage from 'assets/images/notification_default.png'
import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import CtaButton from 'components/Announcement/Popups/CtaButton'
import { useNavigateToUrl } from 'components/Announcement/helper'
import { Announcement } from 'components/Announcement/type'
import { MEDIA_WIDTHS } from 'theme'
import { escapeScriptHtml } from 'utils/string'
import { formatTime } from 'utils/time'

const HEIGHT = '92px'

const Wrapper = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.border};
  background-color: ${({ theme }) => theme.background};
  font-size: 12px;
  padding: 16px 0px;
  gap: 14px;
  display: flex;
  align-items: flex-start;
  cursor: pointer;
  :first-child {
    padding-top: 0;
  }
  ${({ theme }) => theme.mediaWidth.upToMedium`
    :first-child {
      padding: 16px 0px;
  }
  `}
`

const Title = styled.div<{ expand: boolean }>`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  ${({ expand }) =>
    !expand &&
    css`
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `}
`

const Desc = styled.div<{ expand: boolean }>`
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  word-break: break-word;
  display: block;
  display: -webkit-box;
  max-width: 100%;
  line-height: 16px;

  ${({ expand }) =>
    !expand
      ? css`
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          height: 34px;
          > * {
            margin: 0;
          }
        `
      : css`
          display: block;
          > * {
            :first-child {
              margin-top: 0;
            }
            :last-child {
              margin-bottom: 0;
            }
          }
        `}
`

const Time = styled.div<{ isLeft?: boolean }>`
  color: ${({ theme }) => theme.subText};
  text-align: ${({ isLeft }) => (isLeft ? 'left' : 'right')};
  width: 100%;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    font-size: 10px;
  `}
`

const RowItem = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
  flex: 1;
  justify-content: space-between;
  overflow: hidden;
  height: ${HEIGHT};
  max-width: 100%;
`

const Image = styled.img`
  width: 140px;
  max-height: ${HEIGHT};
  border-radius: 8px;
  object-fit: scale-down;
`
const ArrowWrapper = styled.div`
  width: 20px;
  height: 20px;
  color: ${({ theme }) => theme.subText};
  display: flex;
  justify-content: center;
  align-items: center;
  svg {
    transition: all 150ms ease-in-out;
  }
  &[data-expanded='true'] {
    svg {
      transform: rotate(180deg);
    }
  }
`
export default function AnnouncementItem({
  announcement,
  style,
}: {
  announcement: Announcement
  style?: CSSProperties
}) {
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const [expand, setExpand] = useState(false)
  const { templateBody } = announcement

  const { name, startAt, content, thumbnailImageURL, ctaURL, ctaName } = templateBody
  const navigate = useNavigateToUrl()
  const onClickCta: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.stopPropagation()
    navigate(ctaURL)
  }
  return (
    <Wrapper onClick={() => setExpand(!expand)} style={style}>
      <Image src={thumbnailImageURL || NotificationImage} />
      <RowItem style={{ maxHeight: expand ? 'unset' : '100%', height: expand ? 'auto' : 'unset' }}>
        <Flex justifyContent="space-between" width="100%">
          <Title expand={expand}>{name} </Title>
          <Flex alignItems={'center'}>
            {!upToMedium && <Time>{formatTime(startAt)} </Time>}
            <ArrowWrapper data-expanded={expand}>
              <DropdownSVG />
            </ArrowWrapper>
          </Flex>
        </Flex>
        {upToMedium && <Time isLeft>{formatTime(startAt)} </Time>}
        <Desc expand={expand} dangerouslySetInnerHTML={{ __html: escapeScriptHtml(content) }} />
        {expand && ctaName && ctaURL && (
          <CtaButton color="link" data={{ url: ctaURL, name: ctaName }} onClick={onClickCta} />
        )}
      </RowItem>
    </Wrapper>
  )
}
