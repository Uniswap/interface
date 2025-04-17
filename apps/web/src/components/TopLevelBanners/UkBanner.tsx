import { useTranslation } from 'react-i18next'
import { useOpenModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { useAppSelector } from 'state/hooks'
import { InterfaceState } from 'state/webReducer'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Flex, Text, styled } from 'ui/src'

const BannerWrapper = styled(Flex, {
  gap: '$gap8',
  position: 'relative',
  justifyContent: 'center',
  backgroundColor: '$surface1',
  p: 20,
  borderBottomWidth: 1,
  borderColor: '$surface3',
  maxWidth: '$maxWidth',
  width: '100%',
  zIndex: '$fixed',
  '$platform-web': {
    boxSizing: 'border-box',
    WebkitBoxSizing: 'border-box',
    MozBoxSizing: 'border-box',
  },
})

const BannerTextWrapper = styled(Text, {
  variant: 'body2',
  lineHeight: '24px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  color: '$neutral2',
  textOverflow: 'ellipsis',
})

export const useRenderUkBanner = () => {
  const originCountry = useAppSelector((state: InterfaceState) => state.user.originCountry)
  return Boolean(originCountry) && originCountry === 'GB'
}

export function UkBanner() {
  const { t } = useTranslation()
  const openDisclaimer = useOpenModal({ name: ApplicationModal.UK_DISCLAIMER })

  return (
    <BannerWrapper>
      <BannerTextWrapper>{t('notice.uk.label') + ' ' + t('notice.uk')}</BannerTextWrapper>
      <Flex alignItems="center" width="100%">
        <Text variant="body2" lineHeight="24px" color="$accent1" onPress={openDisclaimer} {...ClickableTamaguiStyle}>
          {t('common.readMore')}
        </Text>
      </Flex>
    </BannerWrapper>
  )
}
