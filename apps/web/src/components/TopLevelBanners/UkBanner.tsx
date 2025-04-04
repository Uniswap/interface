import styled from 'lib/styled-components'
import { useTranslation } from 'react-i18next'
import { useOpenModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { useAppSelector } from 'state/hooks'
import { InterfaceState } from 'state/webReducer'
import { ButtonText, ThemedText } from 'theme/components'
import { Z_INDEX } from 'theme/zIndex'
import { breakpoints } from 'ui/src/theme'

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

  @media only screen and (max-width: ${breakpoints.lg}px) {
    flex-direction: column;
  }
`

const BannerTextWrapper = styled(ThemedText.BodySecondary)`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media only screen and (max-width: ${breakpoints.lg}px) {
    @supports (-webkit-line-clamp: 2) {
      white-space: initial;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  }

  @media only screen and (max-width: ${breakpoints.md}px) {
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
  const originCountry = useAppSelector((state: InterfaceState) => state.user.originCountry)
  return Boolean(originCountry) && originCountry === 'GB'
}

export function UkBanner() {
  const { t } = useTranslation()
  const openDisclaimer = useOpenModal({ name: ApplicationModal.UK_DISCLAIMER })

  return (
    <BannerWrapper>
      <BannerContents>
        <BannerTextWrapper lineHeight="24px">{t('notice.uk.label') + ' ' + t('notice.uk')}</BannerTextWrapper>
        <ReadMoreWrapper>
          <ThemedText.BodySecondary lineHeight="24px" color="accent1" onClick={openDisclaimer}>
            {t('common.readMore')}
          </ThemedText.BodySecondary>
        </ReadMoreWrapper>
      </BannerContents>
    </BannerWrapper>
  )
}
