import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, useSporeColors } from 'ui/src'
import { opacify, validColor } from 'ui/src/theme'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName, ElementNameType, SectionName } from 'uniswap/src/features/telemetry/constants'
import { getContrastPassingTextColor } from 'uniswap/src/utils/colors'

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
  const colors = useSporeColors()

  return (
    <Trace logPress element={element} section={SectionName.TokenDetails}>
      <Button
        fill
        hapticFeedback
        color={tokenColor ? getContrastPassingTextColor(tokenColor) : '$sporeWhite'}
        pressStyle={{ backgroundColor: validColor(opacify(60, tokenColor ?? colors.accent1.val)) }}
        // idk why this eslint warning is coming up because it auto-sorts it back on format to invalid order
        // eslint-disable-next-line react/jsx-sort-props
        onPress={onPress}
        size="large"
        backgroundColor={validColor(tokenColor) ?? '$accent1'}
      >
        {title}
      </Button>
    </Trace>
  )
}

export function TokenDetailsActionButtons({
  onPressBuy,
  onPressSell,
  tokenColor,
  userHasBalance,
}: {
  onPressBuy: () => void
  onPressSell: () => void
  tokenColor?: Maybe<string>
  userHasBalance: boolean
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
      px="$spacing16"
    >
      <CTAButton
        element={ElementName.Buy}
        title={t('common.button.buy')}
        tokenColor={tokenColor}
        onPress={onPressBuy}
      />
      {userHasBalance && (
        <CTAButton
          element={ElementName.Sell}
          title={t('common.button.sell')}
          tokenColor={tokenColor}
          onPress={onPressSell}
        />
      )}
    </Flex>
  )
}
