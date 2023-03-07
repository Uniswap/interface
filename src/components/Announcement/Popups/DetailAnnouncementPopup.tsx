import { t } from '@lingui/macro'
import { rgba } from 'polished'
import { ChevronLeft, ChevronRight, X } from 'react-feather'
import { useMedia } from 'react-use'
import styled from 'styled-components'

import NotificationImage from 'assets/images/notification_default.png'
import CtaButton from 'components/Announcement/Popups/CtaButton'
import { useNavigateCtaPopup } from 'components/Announcement/helper'
import { AnnouncementTemplatePopup } from 'components/Announcement/type'
import Modal from 'components/Modal'
import Row from 'components/Row'
import { Z_INDEXS } from 'constants/styles'
import useTheme from 'hooks/useTheme'
import { useDetailAnnouncement } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { escapeScriptHtml } from 'utils/string'

const PaginationButton = styled.div`
  background: ${({ theme }) => rgba(theme.border, 0.7)};
  opacity: 0.7;
  color: ${({ theme }) => theme.text};
  border-radius: 30px;
  cursor: pointer;
  position: absolute;
  width: 28px;
  height: 28px;
  top: 0;
  bottom: 0;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
`

const CloseButton = styled(X)`
  position: absolute;
  cursor: pointer;
  right: 12px;
  top: 12px;
  min-width: 24px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    right: -10px;
    top: -10px;
  `}
`
const Wrapper = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  height: 580px;
  position: relative;

  ${PaginationButton},${CloseButton} {
    display: none;
  }
  :hover {
    ${PaginationButton},${CloseButton} {
      display: flex;
    }
  }
  ${({ theme }) => theme.mediaWidth.upToMedium`
    gap: 16px;
    padding: 20px 20px 16px 20px;
    ${PaginationButton},${CloseButton} {
      display: flex;
    }
  `};
`
const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  gap: 16px;
  flex: 1;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    gap: 20px;
  `}
  a:focus-visible {
    outline: none;
  }
  &::-webkit-scrollbar {
    display: block;
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.subText};
    border-radius: 8px;
  }
`

const Title = styled.div`
  font-weight: 500;
  font-size: 20px;
  line-height: 24px;
  word-break: break-word;
`

const ButtonWrapper = styled(Row)`
  gap: 24px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 12px;
  `}
`

const Image = styled.img`
  border-radius: 20px;
  max-height: 270px;
  width: 100%;
  object-fit: contain;
  margin: auto;
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

const Desc = styled.div`
  word-break: break-word;
  font-size: 14px;
  line-height: 20px;
  > * {
    margin: 0;
  }
`

const formatCtaName = (ctaName: string, ctaUrl: string) => {
  const formatName = ctaName.replace('{{.ctaName}}', '') // fallback backend return empty data
  if (!ctaUrl) return formatName || t`Close`
  return formatName || t`Detail`
}

export default function DetailAnnouncementPopup({
  fetchMore,
}: {
  fetchMore: () => Promise<{ hasMore: boolean; announcements: AnnouncementTemplatePopup[] } | undefined>
}) {
  const theme = useTheme()
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const [{ selectedIndex, announcements = [], hasMore }, setAnnouncementDetail] = useDetailAnnouncement()

  const navigate = useNavigateCtaPopup()

  const onDismiss = () => setAnnouncementDetail({ selectedIndex: null, announcements: [], hasMore: false })
  const onNext = async () => {
    const nextIndex = (selectedIndex ?? 0) + 1
    if (nextIndex < announcements.length) {
      setAnnouncementDetail({ selectedIndex: nextIndex })
      return
    }
    if (hasMore) {
      const data = await fetchMore()
      if (data) setAnnouncementDetail({ ...data, selectedIndex: nextIndex })
    }
  }
  const onBack = () => setAnnouncementDetail({ selectedIndex: Math.max(0, (selectedIndex ?? 0) - 1) })

  if (selectedIndex === null || !announcements[selectedIndex]) return null

  const { name, thumbnailImageURL, content, ctaURL, ctaName = '' } = announcements[selectedIndex]
  const ctas = [{ url: ctaURL, name: formatCtaName(ctaName, ctaURL) }]

  const onClickCta = (ctaUrl: string) => {
    onDismiss()
    navigate(ctaUrl)
  }

  return (
    <Modal
      enableSwipeGesture={false}
      isOpen={true}
      maxWidth={isMobile ? undefined : '480px'}
      onDismiss={onDismiss}
      zindex={Z_INDEXS.MODAL}
    >
      <Wrapper>
        <div style={{ position: 'relative' }}>
          <Image src={thumbnailImageURL || NotificationImage} />
          <CloseButton color={theme.subText} onClick={onDismiss} />
        </div>
        <ContentWrapper>
          <Title>{name}</Title>
          <Desc
            dangerouslySetInnerHTML={{
              __html: escapeScriptHtml(content),
            }}
          />
        </ContentWrapper>
        <ButtonWrapper justify="center">
          {ctas.length > 0 &&
            ctas.map(item => (
              <StyledCtaButton
                key={item.url}
                data={item}
                color={item.name === t`Close` ? 'outline' : 'primary'}
                onClick={() => onClickCta(item.url)}
              />
            ))}
        </ButtonWrapper>
        {announcements.length > 1 && (
          <>
            <PaginationButton onClick={onBack} style={{ left: 4 }}>
              <ChevronLeft size={18} />
            </PaginationButton>
            <PaginationButton onClick={onNext} style={{ right: 4 }}>
              <ChevronRight size={18} />
            </PaginationButton>
          </>
        )}
      </Wrapper>
    </Modal>
  )
}
