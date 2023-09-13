import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { BoxProps } from 'src/components/layout'
import { Text } from 'src/components/Text'
import Trace from 'src/components/Trace/Trace'
import { openModal } from 'src/features/modals/modalSlice'
import { MobileEventName, ModalName } from 'src/features/telemetry/constants'
import { Flex, Icons } from 'ui/src'
import FiatOnRampBackground from 'ui/src/assets/backgrounds/fiat-onramp-banner.svg'
import { iconSizes } from 'ui/src/theme'

export function FiatOnRampBanner(props: BoxProps): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const dispatch = useAppDispatch()

  const onPress = (): void => {
    dispatch(openModal({ name: ModalName.FiatOnRamp }))
  }

  return (
    <Trace logPress pressEvent={MobileEventName.FiatOnRampBannerPressed}>
      <TouchableArea
        borderRadius="rounded12"
        overflow="hidden"
        p="spacing12"
        style={styles.container}
        onPress={onPress}
        {...props}
        hapticFeedback>
        <Flex fill gap="$none" position="absolute" right={0} top={0}>
          <FiatOnRampBackground color={theme.colors.sporeWhite} />
        </Flex>
        <Flex gap="$spacing4">
          <Flex row justifyContent="space-between">
            <Text color="sporeWhite" variant="buttonLabelMedium">
              {t('Buy crypto')}
            </Text>
            <Icons.RotatableChevron color="$sporeWhite" direction="e" width={iconSizes.icon20} />
          </Flex>

          <Text color="sporeWhite" opacity={0.72} variant="subheadSmall">
            {t('Get tokens at the best prices in web3 with Uniswap Wallet.')}
          </Text>
        </Flex>
      </TouchableArea>
    </Trace>
  )
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#FB36D0' },
})
