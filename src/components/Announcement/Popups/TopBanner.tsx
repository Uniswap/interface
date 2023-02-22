import { rgba } from 'polished'
import { useEffect, useRef, useState } from 'react'
import { X } from 'react-feather'
import { useMedia } from 'react-use'
import styled, { css, keyframes } from 'styled-components'

import CtaButton from 'components/Announcement/Popups/CtaButton'
import { useNavigateCtaPopup } from 'components/Announcement/helper'
import { AnnouncementTemplatePopup, PopupContentAnnouncement, PopupType } from 'components/Announcement/type'
import Announcement from 'components/Icons/Announcement'
import useTheme from 'hooks/useTheme'
import { useActivePopups, useRemoveAllPopupByType } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'

const BannerWrapper = styled.div<{ color?: string }>`
  width: 100%;
  padding: 10px 12px 10px 20px;
  background: ${({ theme, color }) => rgba(color ?? theme.warning, 0.7)};
  display: flex;
  align-items: center;
  justify-content: space-between;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    align-items: flex-start;
    flex-direction: column;
    padding: 12px;
    gap: 12px;
  `}
`

const StyledClose = styled(X)`
  color: white;
  :hover {
    cursor: pointer;
  }
`

const Content = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  gap: 8px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 14px;
    flex: 1;
    width: 100%;
  `}
`

const TextWrapper = styled.div`
  margin-left: 4px;
  margin-right: 1rem;
  color: ${({ theme }) => theme.text};
  overflow: hidden;
  ${({ theme }) => theme.mediaWidth.upToSmall`${css`
    max-width: 100%;
    flex: 1;
    height: 20px;
    position: relative;
    margin: 0;
  `}
  `}
`

const marquee = () => keyframes`
  0% { transform: translateX(0%) ; }
  50% { transform: translateX(-110%) ; }
  50.1% { transform: translateX(110%) ; }
  100% { transform: translateX(0%) ; }
`
const TextContent = styled.div<{ isOverflow: boolean; animationDuration: number }>`
  line-height: 20px;
  color: ${({ theme }) => theme.text};
  font-size: 14px;
  ${({ theme, isOverflow, animationDuration }) => theme.mediaWidth.upToSmall`
     ${
       isOverflow
         ? css`
             animation: ${marquee} ${animationDuration || 15}s linear infinite;
           `
         : css`
             width: 100%;
             text-align: center;
           `
     };
    white-space: nowrap;
    position: absolute;
  `}
  > p {
    margin: 0;
  }
`
const StyledCtaButton = styled(CtaButton)`
  min-width: 140px;
  width: fit-content;
  height: 36px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `}
`

function TopBanner() {
  const theme = useTheme()
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const { topPopups } = useActivePopups()
  const popupInfo = topPopups[topPopups.length - 1]

  const removeAllPopupByType = useRemoveAllPopupByType()
  const hideBanner = () => removeAllPopupByType(PopupType.TOP_BAR)

  const refContent = useRef<HTMLDivElement>(null)
  const contentNode = refContent.current
  const [isOverflowParent, setIsOverflowParent] = useState(false)

  const navigate = useNavigateCtaPopup()
  const [animationDuration, setAnimationDuration] = useState(15)

  useEffect(() => {
    if (contentNode?.parentElement) {
      const isOverflowParent = contentNode.clientWidth > contentNode.parentElement?.clientWidth
      setIsOverflowParent(isOverflowParent)
      setAnimationDuration((contentNode.clientWidth / contentNode.parentElement?.clientWidth) * 10)
    }
  }, [contentNode])

  if (!popupInfo) return null
  const { templateBody } = popupInfo.content as PopupContentAnnouncement
  const { content, ctas = [], type } = templateBody as AnnouncementTemplatePopup
  const ctaUrl = ctas[0]?.url
  const ctaName = ctas[0]?.name
  return (
    <BannerWrapper color={type === 'NORMAL' ? theme.apr : theme.warning}>
      {!isMobile && <div />}
      <Content>
        {!isMobile && <Announcement style={{ minWidth: '24px' }} />}
        <TextWrapper>
          <TextContent
            animationDuration={animationDuration}
            ref={refContent}
            isOverflow={isOverflowParent}
            dangerouslySetInnerHTML={{
              __html: content,
            }}
          />
        </TextWrapper>
        {isMobile && <StyledClose size={24} onClick={hideBanner} />}
      </Content>
      {ctaName && ctaUrl && (
        <StyledCtaButton
          data={ctas[0]}
          color="gray"
          onClick={() => {
            navigate(ctaUrl)
            hideBanner()
          }}
        />
      )}
      {!isMobile && <StyledClose size={24} onClick={hideBanner} style={{ marginLeft: 8, minWidth: '20px' }} />}
    </BannerWrapper>
  )
}

export default TopBanner
