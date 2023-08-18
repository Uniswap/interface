import { useTranslation } from 'react-i18next'
import { TransferScreen, useTransferContext } from 'src/app/features/transfer/TransferContext'
import { Button, Flex, Icons, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { AmountAndRecipientSummary } from './AmountAndRecipientSummary'
import { NetworkAndWalletSummary } from './NetworkAndWalletSummary'

export function SendReviewScreen(): JSX.Element {
  return (
    <Flex grow gap="$spacing28">
      <Flex row>
        <Top />
      </Flex>

      <Flex row flex={1}>
        <AmountAndRecipientSummary />
      </Flex>

      <Flex centered row borderTopColor="$neutral3" borderTopWidth={1} paddingTop="$spacing24">
        <NetworkAndWalletSummary />
      </Flex>

      <Flex centered row>
        <Buttons />
      </Flex>
    </Flex>
  )
}

function Top(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex grow gap="$spacing16">
      <Flex centered backgroundColor="$accent2" borderRadius={12} height={48} width={48}>
        <Icons.SendAction
          color="$accent1"
          fillOpacity={1}
          height={iconSizes.icon24}
          width={iconSizes.icon24}
        />
      </Flex>

      <Flex
        borderBottomColor="$neutral3"
        borderBottomWidth={1}
        flex={1}
        marginRight={iconSizes.icon24}
        paddingBottom="$spacing16">
        <Text fontSize={24} fontWeight="300">
          {t('Review send')}
        </Text>
      </Flex>
    </Flex>
  )
}

function Buttons(): JSX.Element {
  const { t } = useTranslation()
  const { setScreen } = useTransferContext()

  return (
    <Flex grow row alignItems="center" gap="$spacing8">
      <Button flex={1} theme="secondary" onPress={(): void => setScreen(TransferScreen.SendForm)}>
        {t('Cancel')}
      </Button>

      <Button flex={1} theme="primary">
        {t('Send')}
      </Button>
    </Flex>
  )
}
