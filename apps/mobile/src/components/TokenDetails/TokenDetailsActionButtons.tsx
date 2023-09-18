import React from 'react'
import { useTranslation } from 'react-i18next'
import { ButtonEmphasis, ButtonSize } from 'src/components/buttons/Button'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { getButtonProperties } from 'src/components/buttons/utils'
import Trace from 'src/components/Trace/Trace'
import { ElementName, SectionName } from 'src/features/telemetry/constants'
import { Flex, Text, useSporeColors } from 'ui/src'
import { getContrastPassingTextColor } from 'wallet/src/utils/colors'

function CTAButton({
  title,
  element,
  onPress,
  tokenColor,
}: {
  title: string
  element: ElementName
  onPress: () => void
  tokenColor?: Maybe<string>
}): JSX.Element {
  const colors = useSporeColors()
  const { textVariant, paddingX, paddingY, borderRadius, borderColor } = getButtonProperties(
    ButtonEmphasis.Secondary,
    ButtonSize.Large
  )

  return (
    <Trace logPress element={element} section={SectionName.TokenDetails}>
      <TouchableArea
        hapticFeedback
        alignItems="center"
        borderColor={borderColor}
        borderRadius={borderRadius}
        borderWidth={1}
        flexGrow={1}
        px={paddingX}
        py={paddingY}
        style={{ backgroundColor: tokenColor ?? colors.accent1.val }}
        onPress={onPress}>
        <Text
          color={tokenColor ? getContrastPassingTextColor(tokenColor) : '$sporeWhite'}
          variant={textVariant}>
          {title}
        </Text>
      </TouchableArea>
    </Trace>
  )
}

export function TokenDetailsActionButtons({
  onPressBuy,
  onPressSell,
  tokenColor,
}: {
  onPressBuy: () => void
  onPressSell: () => void
  tokenColor?: Maybe<string>
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex
      row
      bg="$surface1"
      borderTopColor="$surface3"
      borderTopWidth={1}
      gap="$spacing8"
      pb="$spacing16"
      pt="$spacing12"
      px="$spacing16">
      <CTAButton
        element={ElementName.Buy}
        title={t('Buy')}
        tokenColor={tokenColor}
        onPress={onPressBuy}
      />
      <CTAButton
        element={ElementName.Sell}
        title={t('Sell')}
        tokenColor={tokenColor}
        onPress={onPressSell}
      />
    </Flex>
  )
}
