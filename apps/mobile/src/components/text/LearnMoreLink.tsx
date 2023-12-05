import { useTranslation } from 'react-i18next'
import { openUri } from 'src/utils/linking'
import { Text, TouchableArea } from 'ui/src'

const onPressLearnMore = async (url: string): Promise<void> => {
  await openUri(url)
}

export const LearnMoreLink = ({ url }: { url: string }): JSX.Element => {
  const { t } = useTranslation()
  return (
    <TouchableArea onPress={(): Promise<void> => onPressLearnMore(url)}>
      <Text color="$accent1" variant="buttonLabel3">
        {t('Learn more')}
      </Text>
    </TouchableArea>
  )
}
