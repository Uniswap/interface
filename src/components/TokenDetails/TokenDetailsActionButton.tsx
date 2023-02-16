import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import SendIcon from 'src/assets/icons/send.svg'
import { Button, ButtonEmphasis, ButtonSize } from 'src/components/buttons/Button'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { getButtonProperties } from 'src/components/buttons/utils'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ElementName } from 'src/features/telemetry/constants'
import { getContrastPassingTextColor } from 'src/utils/colors'

export function TokenDetailsActionButtons({
  onPressSwap,
  onPressSend,
  showSend,
  tokenColor,
}: {
  onPressSwap?: () => void
  onPressSend?: () => void
  showSend?: boolean
  tokenColor?: NullUndefined<string>
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
      bg="background0"
      borderTopColor="backgroundOutline"
      borderTopWidth={1}
      gap="spacing8"
      pb="spacing16"
      pt="spacing12"
      px="spacing16">
      <TouchableArea
        hapticFeedback
        alignItems="center"
        borderColor={borderColor}
        borderRadius={borderRadius}
        borderWidth={1}
        disabled={!onPressSwap}
        flexGrow={1}
        px={paddingX}
        py={paddingY}
        style={{ backgroundColor: tokenColor ?? theme.colors.magentaVibrant }}
        onPress={onPressSwap}>
        <Text
          color={getContrastPassingTextColor(tokenColor ?? theme.colors.magentaVibrant)}
          variant={textVariant}>
          {t('Swap')}
        </Text>
      </TouchableArea>

      {showSend && (
        <Button
          IconName={SendIcon}
          disabled={!onPressSend}
          emphasis={ButtonEmphasis.Secondary}
          name={ElementName.Send}
          size={ButtonSize.Large}
          onPress={onPressSend}
        />
      )}
    </Flex>
  )
}
