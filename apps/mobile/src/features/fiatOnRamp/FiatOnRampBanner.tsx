import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import Trace from 'src/components/Trace/Trace'
import { openModal } from 'src/features/modals/modalSlice'
import { MobileEventName, ModalName } from 'src/features/telemetry/constants'
import { Flex, Icons, Text, TouchableArea, TouchableAreaProps, useSporeColors } from 'ui/src'
import FiatOnRampBackground from 'ui/src/assets/backgrounds/fiat-onramp-banner.svg'
import { iconSizes } from 'ui/src/theme'

export function FiatOnRampBanner(props: TouchableAreaProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const dispatch = useAppDispatch()

  return (
    <Trace logPress pressEvent={MobileEventName.FiatOnRampBannerPressed}>
      <TouchableArea
        backgroundColor="$DEP_fiatBanner"
        borderRadius="$rounded12"
        overflow="hidden"
        p="$spacing12"
        onPress={(): void => {
          dispatch(openModal({ name: ModalName.FiatOnRamp }))
        }}
        {...props}
        hapticFeedback>
        <Flex fill position="absolute" right={0} top={0}>
          <FiatOnRampBackground color={colors.sporeWhite.val} />
        </Flex>
        <Flex gap="$spacing4">
          <Flex row justifyContent="space-between">
            <Text color="$sporeWhite" variant="buttonLabel2">
              {t('Buy crypto')}
            </Text>
            <Icons.RotatableChevron color="$sporeWhite" direction="end" width={iconSizes.icon20} />
          </Flex>
          <Text color="$sporeWhite" opacity={0.72} variant="subheading2">
            {t('Get tokens at the best prices in web3 with Uniswap Wallet.')}
          </Text>
        </Flex>
      </TouchableArea>
    </Trace>
  )
}
