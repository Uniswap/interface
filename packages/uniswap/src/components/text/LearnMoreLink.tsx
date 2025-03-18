import { useTranslation } from 'react-i18next'
import { Text, TextProps, TouchableArea, TouchableAreaProps } from 'ui/src'
import { openUri } from 'uniswap/src/utils/linking'
import { isMobileApp } from 'utilities/src/platform'

const onPressLearnMore = async (url: string): Promise<void> => {
  await openUri(url)
}

export const LearnMoreLink = ({
  url,
  textVariant = 'buttonLabel2',
  textColor = '$accent1',
  centered = false,
  display,
}: {
  url: string
  textVariant?: TextProps['variant']
  textColor?: TextProps['color']
  centered?: boolean
  display?: TouchableAreaProps['display']
}): JSX.Element => {
  const { t } = useTranslation()
  return isMobileApp ? (
    <Text
      color={textColor}
      variant={textVariant}
      textAlign={centered ? 'center' : undefined}
      onPress={(): Promise<void> => onPressLearnMore(url)}
    >
      {t('common.button.learn')}
    </Text>
  ) : (
    <TouchableArea display={display} onPress={(): Promise<void> => onPressLearnMore(url)}>
      <Text color={textColor} variant={textVariant} textAlign={centered ? 'center' : undefined}>
        {t('common.button.learn')}
      </Text>
    </TouchableArea>
  )
}
