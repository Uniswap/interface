import { useTranslation } from 'react-i18next'
import { Flex, Separator, Text } from 'ui/src'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { EmptyWalletCards } from '~/components/emptyWallet/EmptyWalletCards'

export const EmptyWallet = () => {
  const { t } = useTranslation()
  return (
    <Flex gap="$spacing20">
      <Separator />
      <Flex>
        <Text variant="subheading2" color="$neutral1">
          {t('onboarding.welcome.title')}
        </Text>
        <Text variant="body3" color="$neutral2">
          {t('home.tokens.empty.welcome.description')}
        </Text>
      </Flex>
      <EmptyWalletCards
        buyElementName={ElementName.EmptyStateBuy}
        receiveElementName={ElementName.EmptyStateReceive}
        cexTransferElementName={ElementName.EmptyStateCEXTransfer}
      />
    </Flex>
  )
}
