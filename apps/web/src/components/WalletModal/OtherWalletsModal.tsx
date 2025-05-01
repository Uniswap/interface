import { MenuState, miniPortfolioMenuStateAtom } from 'components/AccountDrawer/constants'
import { useShowMoonpayText } from 'components/AccountDrawer/MiniPortfolio/hooks'
import ConnectionErrorView from 'components/WalletModal/ConnectionErrorView'
import { Option } from 'components/WalletModal/Option'
import PrivacyPolicyNotice from 'components/WalletModal/PrivacyPolicyNotice'
import { useOrderedConnections } from 'components/WalletModal/useOrderedConnections'
import { useRecentConnectorId } from 'components/Web3Provider/constants'
import { useAtom } from 'jotai'
import { Trans } from 'react-i18next'
import { transitions } from 'theme/styles'
import { Flex, Text } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'

export function OtherWalletsModal() {
  const showMoonpayText = useShowMoonpayText()
  const [, setMenu] = useAtom(miniPortfolioMenuStateAtom)
  const connectors = useOrderedConnections({ showSecondaryConnectors: true })
  const recentConnectorId = useRecentConnectorId()

  return (
    <Flex
      backgroundColor="$surface1"
      pt="$spacing16"
      px="$spacing16"
      pb="$spacing20"
      flex={1}
      gap="$gap16"
      data-testid="other-wallet-modal"
    >
      <ConnectionErrorView />
      <Flex row justifyContent="center" width="100%">
        <BackArrow
          color="$neutral2"
          size={20}
          onPress={() => setMenu(MenuState.DEFAULT)}
          mr="auto"
          hoverStyle={{ opacity: 0.8 }}
          cursor="pointer"
        />
        <Text variant="subheading2" mr="auto" ml={-20}>
          <Trans i18nKey="common.connectAWallet.button" />
        </Text>
      </Flex>

      <Flex gap="$gap16">
        <Flex row grow alignItems="flex-start">
          <Flex
            gap={2}
            borderRadius="$rounded16"
            overflow="hidden"
            width="100%"
            transition={`${transitions.duration.fast} ${transitions.timing.inOut}`}
            data-testid="option-grid"
          >
            {/* If uniswap mobile was the last used connector it will be show on the primary window */}
            {recentConnectorId !== CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID && (
              <Option connectorId={CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID} />
            )}
            {connectors.map((c) => (
              <Option connectorId={c.id} key={c.uid} detected={c.isInjected} />
            ))}
          </Flex>
        </Flex>
        <Flex gap="$gap8">
          <Flex px="$spacing4">
            <PrivacyPolicyNotice />
          </Flex>
          {showMoonpayText && (
            <Flex borderTopWidth={1} pt="$spacing8" borderColor="$surface3" px="$spacing4">
              <Text variant="body4" color="$neutral3">
                <Trans i18nKey="moonpay.poweredBy" />
              </Text>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Flex>
  )
}
