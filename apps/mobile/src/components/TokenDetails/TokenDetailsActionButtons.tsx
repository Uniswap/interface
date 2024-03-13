import React from 'react'
import { useTranslation } from 'react-i18next'
import Trace from 'src/components/Trace/Trace'
import { Button, Flex } from 'ui/src'
import { validColor } from 'ui/src/theme'
import { ElementName, ElementNameType, SectionName } from 'wallet/src/telemetry/constants'
import { getContrastPassingTextColor } from 'wallet/src/utils/colors'

function CTAButton({
  title,
  element,
  onPress,
  tokenColor,
}: {
  title: string
  element: ElementNameType
  onPress: () => void
  tokenColor?: Maybe<string>
}): JSX.Element {
  return (
    <Trace logPress element={element} section={SectionName.TokenDetails}>
      <Button
        fill
        hapticFeedback
        color={tokenColor ? getContrastPassingTextColor(tokenColor) : '$sporeWhite'}
        pressStyle={{ opacity: 0.6 }}
        // idk why this eslint warning is coming up because it auto-sorts it back on format to invalid order
        // eslint-disable-next-line react/jsx-sort-props
        onPress={onPress}
        size="large"
        backgroundColor={validColor(tokenColor) ?? '$accent1'}>
        {title}
      </Button>
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
      backgroundColor="$surface1"
      borderTopColor="$surface3"
      borderTopWidth={1}
      gap="$spacing8"
      pb="$spacing16"
      pt="$spacing12"
      px="$spacing16">
      <CTAButton
        element={ElementName.Buy}
        title={t('common.button.buy')}
        tokenColor={tokenColor}
        onPress={onPressBuy}
      />
      <CTAButton
        element={ElementName.Sell}
        title={t('common.button.sell')}
        tokenColor={tokenColor}
        onPress={onPressSell}
      />
    </Flex>
  )
}
