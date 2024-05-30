import { useTranslation } from 'react-i18next'
import { Text, TextProps, TouchableArea } from 'ui/src'
import { openUri } from 'wallet/src/utils/linking'

const onPressLearnMore = async (url: string): Promise<void> => {
  await openUri(url)
}

export const LearnMoreLink = ({
  url,
  textVariant = 'buttonLabel3',
}: {
  url: string
  textVariant?: TextProps['variant']
}): JSX.Element => {
  const { t } = useTranslation()
  return (
    <TouchableArea onPress={(): Promise<void> => onPressLearnMore(url)}>
      <Text color="$accent1" variant={textVariant}>
        {t('common.button.learn')}
      </Text>
    </TouchableArea>
  )
}
