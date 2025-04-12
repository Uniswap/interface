import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Text, TextProps, TouchableArea, TouchableAreaProps, isWeb } from 'ui/src'
import { openUri } from 'uniswap/src/utils/linking'
import { isMobileApp } from 'utilities/src/platform'

const onPressLearnMore = (url: string): Promise<void> => openUri(url)

export const LearnMoreLink = ({
  url,
  textVariant = 'buttonLabel2',
  textColor = '$accent1',
  centered = false,
  display,
  componentType = 'TouchableArea',
}: {
  url: string
  textVariant?: TextProps['variant']
  textColor?: TextProps['color']
  centered?: boolean
  display?: TouchableAreaProps['display']
  componentType?: 'Button' | 'TouchableArea'
}): JSX.Element => {
  const { t } = useTranslation()

  const handleOnPress = useCallback(() => onPressLearnMore(url), [url])

  if (componentType === 'Button') {
    return (
      <Button size={isWeb ? 'medium' : 'large'} emphasis="text-only" onPress={handleOnPress}>
        <Button.Text color={textColor}>{t('common.button.learn')}</Button.Text>
      </Button>
    )
  }

  return isMobileApp ? (
    <Text color={textColor} variant={textVariant} textAlign={centered ? 'center' : undefined} onPress={handleOnPress}>
      {t('common.button.learn')}
    </Text>
  ) : (
    <TouchableArea display={display} style={{ textAlign: centered ? 'center' : 'left' }} onPress={handleOnPress}>
      <Text color={textColor} variant={textVariant}>
        {t('common.button.learn')}
      </Text>
    </TouchableArea>
  )
}
