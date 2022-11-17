import { impactAsync } from 'expo-haptics'
import React, { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Chevron } from 'src/components/icons/Chevron'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'

export function FiatOnRampBanner(props: ComponentProps<typeof Box>) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const dispatch = useAppDispatch()

  const onPress = () => {
    impactAsync()
    dispatch(openModal({ name: ModalName.FiatOnRamp }))
  }

  return (
    <TouchableArea bg="magentaVibrant" borderRadius="md" p="sm" onPress={onPress} {...props}>
      <Flex gap="xxs">
        <Flex row justifyContent="space-between">
          <Text color="textOnBrightPrimary" variant="buttonLabelMedium">
            {t('Buy crypto')}
          </Text>
          <Chevron
            color={theme.colors.textOnBrightPrimary}
            direction="e"
            width={theme.iconSizes.md}
          />
        </Flex>

        <Text color="textOnBrightPrimary" opacity={0.72} variant="bodySmall">
          {t('Get the lowest fees in DeFi when you buy crypto on Uniswap Wallet.')}
        </Text>
      </Flex>
    </TouchableArea>
  )
}
