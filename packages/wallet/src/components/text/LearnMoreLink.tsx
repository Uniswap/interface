import { useTranslation } from 'react-i18next'
import { Text, TouchableArea } from 'ui/src'
import { openUri } from 'wallet/src/utils/linking'

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
