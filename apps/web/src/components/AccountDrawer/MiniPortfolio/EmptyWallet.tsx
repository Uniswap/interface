import { EmptyWalletCards } from 'components/emptyWallet/EmptyWalletCards'
import { Trans } from 'react-i18next'
import { Flex, Separator, Text } from 'ui/src'
import { ElementName } from 'uniswap/src/features/telemetry/constants'

export const EmptyWallet = () => {
  return (
    <Flex gap="$spacing20">
      <Separator />
      <Flex>
        <Text variant="subheading2" color="$neutral1">
          <Trans i18nKey="onboarding.welcome.title" />
        </Text>
        <Text variant="body3" color="$neutral2">
          <Trans i18nKey="home.tokens.empty.welcome.description" />
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
