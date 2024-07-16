import { Trans, t } from 'i18n'
import styled from 'lib/styled-components'
import { useOpenModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { useAppSelector } from 'state/hooks'
import { AppState } from 'state/reducer'
import { BREAKPOINTS } from 'theme'
import { ButtonText, ThemedText } from 'theme/components'
import { Z_INDEX } from 'theme/zIndex'

const BannerWrapper = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  background-color: ${({ theme }) => theme.surface1};
  padding: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.surface3};
  z-index: ${Z_INDEX.fixed};
  box-sizing: border-box;
  -webkit-box-sizing: border-box;
  -moz-box-sizing: border-box;
`

const BannerContents = styled.div`
  max-width: ${({ theme }) => `${theme.maxWidth}px`};
  width: 100%;
  display: flex;

  @media only screen and (max-width: ${BREAKPOINTS.md}px) {
    flex-direction: column;
  }
`

const BannerTextWrapper = styled(ThemedText.BodySecondary)`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media only screen and (max-width: ${BREAKPOINTS.md}px) {
    @supports (-webkit-line-clamp: 2) {
      white-space: initial;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  }

  @media only screen and (max-width: ${BREAKPOINTS.sm}px) {
    @supports (-webkit-line-clamp: 3) {
      white-space: initial;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
    }
  }
`

const ReadMoreWrapper = styled(ButtonText)`
  flex-shrink: 0;
  width: max-content;

  :focus {
    text-decoration: none;
  }
`

export const useRenderUkBanner = () => {
  const originCountry = useAppSelector((state: AppState) => state.user.originCountry)
  return Boolean(originCountry) && originCountry === 'GB'
}

export const bannerText = t('notice.uk')

export function UkBanner() {
  const openDisclaimer = useOpenModal(ApplicationModal.UK_DISCLAIMER)

  return (
    <BannerWrapper>
      <BannerContents>
        <BannerTextWrapper lineHeight="24px">{t('notice.uk.label') + ' ' + bannerText}</BannerTextWrapper>
        <ReadMoreWrapper>
          <ThemedText.BodySecondary lineHeight="24px" color="accent1" onClick={openDisclaimer}>
            <Trans i18nKey="common.readMore" />
          </ThemedText.BodySecondary>
        </ReadMoreWrapper>
      </BannerContents>
    </BannerWrapper>
  )
}
