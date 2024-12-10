import { useTranslation } from 'react-i18next'
import { Text, TextProps, TouchableArea } from 'ui/src'
import { openUri } from 'uniswap/src/utils/linking'

const onPressLearnMore = async (url: string): Promise<void> => {
  await openUri(url)
}

export const LearnMoreLink = ({
  url,
  textVariant = 'buttonLabel2',
  textColor = '$accent1',
  centered = false,
}: {
  url: string
  textVariant?: TextProps['variant']
  textColor?: TextProps['color']
  centered?: boolean
}): JSX.Element => {
  const { t } = useTranslation()
  return (
    <TouchableArea onPress={(): Promise<void> => onPressLearnMore(url)}>
      <Text color={textColor} variant={textVariant} textAlign={centered ? 'center' : undefined}>
        {t('common.button.learn')}
      </Text>
    </TouchableArea>
  )
}
