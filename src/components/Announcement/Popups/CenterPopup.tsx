import { t } from '@lingui/macro'
import { X } from 'react-feather'
import { useMedia } from 'react-use'
import styled from 'styled-components'

import CtaButton from 'components/Announcement/Popups/CtaButton'
import { useNavigateCtaPopup } from 'components/Announcement/helper'
import {
  AnnouncementTemplatePopup,
  PopupContentAnnouncement,
  PopupItemType,
  PopupType,
} from 'components/Announcement/type'
import Modal from 'components/Modal'
import Row, { RowBetween } from 'components/Row'
import { Z_INDEXS } from 'constants/styles'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'

const Wrapper = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-height: 100%;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    gap: 20px;
    padding: 20px;
  `}
`
const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  gap: 24px;
  flex: 1;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    gap: 20px;
  `}
`

const Title = styled.div`
  font-weight: 500;
  font-size: 20px;
  line-height: 24px;
  word-break: break-all;
`

const ButtonWrapper = styled(Row)`
  gap: 24px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 12px;
  `}
`

const Image = styled.img`
  border-radius: 20px;
  max-height: 50vh;
  width: 100%;
  object-fit: contain;
  margin: auto;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    max-height: unset;
  `}
`

const StyledCtaButton = styled(CtaButton)`
  width: fit-content;
  min-width: 220px;
  height: 36px;
  max-width: 100%;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: fit-content;
    min-width: 100px;
    max-width: 100%;
  `}
`

export default function CenterPopup({
  data,
  clearAll,
}: {
  data: PopupItemType<PopupContentAnnouncement>
  clearAll: () => void
}) {
  const theme = useTheme()
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const { mixpanelHandler } = useMixpanel()
  const { templateBody = {} } = data.content
  const {
    name = t`Important Announcement!`,
    content,
    ctas = [],
    thumbnailImageURL,
  } = templateBody as AnnouncementTemplatePopup
  const navigate = useNavigateCtaPopup()
  const trackingClose = () => mixpanelHandler(MIXPANEL_TYPE.ANNOUNCEMENT_CLICK_CLOSE_POPUP, { message_title: name })
  const onClickCta = (ctaUrl?: string) => {
    clearAll()
    ctaUrl && navigate(ctaUrl)
    mixpanelHandler(MIXPANEL_TYPE.ANNOUNCEMENT_CLICK_CTA_POPUP, {
      announcement_type: PopupType.CENTER,
      announcement_title: name,
    })
  }

  return (
    <Modal isOpen={true} maxWidth={isMobile ? undefined : '800px'} onDismiss={clearAll} zindex={Z_INDEXS.MODAL}>
      <Wrapper>
        <RowBetween align="center">
          <Title>{name}</Title>
          <X
            cursor={'pointer'}
            color={theme.subText}
            onClick={() => {
              clearAll()
              trackingClose()
            }}
            style={{ minWidth: '24px' }}
          />
        </RowBetween>
        <ContentWrapper>
          {thumbnailImageURL && <Image src={thumbnailImageURL} />}
          <div
            style={{ fontSize: 14, lineHeight: '20px' }}
            dangerouslySetInnerHTML={{
              __html: content,
            }}
          />
          <ButtonWrapper justify="center">
            {ctas.length > 0 ? (
              ctas.map(item => (
                <StyledCtaButton
                  key={item.url}
                  data={item}
                  color="primary"
                  onClick={() => {
                    onClickCta(item.url)
                  }}
                />
              ))
            ) : (
              <StyledCtaButton
                data={{ name: t`Close`, url: '' }}
                color="primary"
                onClick={() => {
                  onClickCta()
                }}
              />
            )}
          </ButtonWrapper>
        </ContentWrapper>
      </Wrapper>
    </Modal>
  )
}
