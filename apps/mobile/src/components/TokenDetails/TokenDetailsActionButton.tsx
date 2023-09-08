import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { ButtonEmphasis, ButtonSize } from 'src/components/buttons/Button'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { getButtonProperties } from 'src/components/buttons/utils'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import Trace from 'src/components/Trace/Trace'
import { ElementName, SectionName } from 'src/features/telemetry/constants'
import { getContrastPassingTextColor } from 'src/utils/colors'

export function TokenDetailsActionButtons({
  onPressSwap,
  tokenColor,
}: {
  onPressSwap: () => void
  tokenColor?: Maybe<string>
}): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const { textVariant, paddingX, paddingY, borderRadius, borderColor } = getButtonProperties(
    ButtonEmphasis.Secondary,
    ButtonSize.Large
  )

  return (
    <Flex
      row
      bg="surface1"
      borderTopColor="surface3"
      borderTopWidth={1}
      gap="spacing8"
      pb="spacing16"
      pt="spacing12"
      px="spacing16">
      <Trace logPress element={ElementName.Swap} section={SectionName.TokenDetails}>
        <TouchableArea
          hapticFeedback
          alignItems="center"
          borderColor={borderColor}
          borderRadius={borderRadius}
          borderWidth={1}
          flexGrow={1}
          px={paddingX}
          py={paddingY}
          style={{ backgroundColor: tokenColor ?? theme.colors.accent1 }}
          onPress={onPressSwap}>
          <Text
            color={tokenColor ? getContrastPassingTextColor(tokenColor) : 'sporeWhite'}
            variant={textVariant}>
            {t('Swap')}
          </Text>
        </TouchableArea>
      </Trace>
    </Flex>
  )
}
