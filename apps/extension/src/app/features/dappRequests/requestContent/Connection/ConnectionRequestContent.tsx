import { useTranslation } from 'react-i18next'
import { DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import { Flex, Text } from 'ui/src'

export function ConnectionRequestContent(): JSX.Element {
  const { t } = useTranslation()

  return (
    <DappRequestContent
      showAllNetworks
      confirmText={t('common.button.connect')}
      title={t('dapp.request.connect.title')}
    >
      <Flex
        backgroundColor="$surface2"
        borderColor="$surface3"
        borderRadius="$rounded12"
        borderWidth="$spacing1"
        p="$spacing12"
      >
        <Text color="$neutral2" variant="body4">
          {t('dapp.request.connect.helptext')}
        </Text>
      </Flex>
    </DappRequestContent>
  )
}
