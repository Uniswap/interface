import { useTranslation } from 'react-i18next'
import { Text, TextProps, TouchableArea } from 'ui/src'
import { openUri } from 'uniswap/src/utils/linking'

const onPressLearnMore = async (url: string): Promise<void> => {
  await openUri(url)
}

export const LearnMoreLink = ({
  url,
  textVariant = 'buttonLabel3',
  textColor = '$accent1',
}: {
  url: string
  textVariant?: TextProps['variant']
  textColor?: TextProps['color']
}): JSX.Element => {
  const { t } = useTranslation()
  return (
    <TouchableArea onPress={(): Promise<void> => onPressLearnMore(url)}>
      <Text color={textColor} variant={textVariant}>
        {t('common.button.learn')}
      </Text>
    </TouchableArea>
  )
}
