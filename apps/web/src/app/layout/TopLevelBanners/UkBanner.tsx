import { clickableStyle, Flex, type FlexCompatProps, Text, type TextCompatProps } from '@universe/mycelium'
import { forwardRef, type ForwardRefExoticComponent, type RefAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useModalState } from '~/hooks/useModalState'
import { useAppSelector } from '~/state/hooks'
import { InterfaceState } from '~/state/webReducer'

const BannerWrapper: ForwardRefExoticComponent<FlexCompatProps & RefAttributes<HTMLDivElement>> = forwardRef<
  HTMLDivElement,
  FlexCompatProps
>(function BannerWrapper(props, ref) {
  return (
    <Flex
      ref={ref}
      gap="$gap8"
      position="relative"
      justifyContent="center"
      backgroundColor="$surface1"
      p={20}
      borderBottomWidth={1}
      borderColor="$surface3"
      width="100%"
      zIndex="$fixed"
      {...props}
    />
  )
})

const BannerTextWrapper: ForwardRefExoticComponent<TextCompatProps & RefAttributes<HTMLElement>> = forwardRef<
  HTMLElement,
  TextCompatProps
>(function BannerTextWrapper(props, ref) {
  return (
    <Text
      ref={ref}
      variant="body2"
      lineHeight="24px"
      whiteSpace="nowrap"
      overflow="hidden"
      color="$neutral2"
      textOverflow="ellipsis"
      {...props}
    />
  )
})

export const useRenderUkBanner = () => {
  const originCountry = useAppSelector((state: InterfaceState) => state.user.originCountry)
  return Boolean(originCountry) && originCountry === 'GB'
}

export function UkBanner() {
  const { t } = useTranslation()
  const { openModal: openDisclaimer } = useModalState(ModalName.UkDisclaimer)

  return (
    <BannerWrapper>
      <BannerTextWrapper>{t('notice.uk.label') + ' ' + t('notice.uk')}</BannerTextWrapper>
      <Flex alignItems="center" width="100%">
        <Text variant="body2" lineHeight="24px" color="$accent1" onPress={openDisclaimer} {...clickableStyle}>
          {t('common.readMore')}
        </Text>
      </Flex>
    </BannerWrapper>
  )
}
