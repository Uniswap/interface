import { useShowMoonpayText } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { MenuStateVariant, useSetMenu } from 'components/AccountDrawer/menuState'
import ConnectionErrorView from 'components/WalletModal/ConnectionErrorView'
import PrivacyPolicyNotice from 'components/WalletModal/PrivacyPolicyNotice'
import { UniswapMobileWalletConnectorOption } from 'components/WalletModal/UniswapMobileWalletConnectorOption'
import { WalletConnectorOption } from 'components/WalletModal/WalletConnectorOption'
import { useRecentConnectorId } from 'components/Web3Provider/constants'
import { useOrderedWallets } from 'features/wallet/connection/hooks/useOrderedWalletConnectors'
import React from 'react'
import { Trans } from 'react-i18next'
import { transitions } from 'theme/styles'
import { Flex, Separator, Text } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'

export function OtherWalletsModal() {
  const showMoonpayText = useShowMoonpayText()
  const setMenu = useSetMenu()

  const wallets = useOrderedWallets({ showSecondaryConnectors: true })
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
          onPress={() => setMenu({ variant: MenuStateVariant.MAIN })}
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
            borderRadius="$rounded16"
            overflow="hidden"
            width="100%"
            transition={`${transitions.duration.fast} ${transitions.timing.inOut}`}
            data-testid="option-grid"
          >
            {/* If uniswap mobile was the last used connector it will be show on the primary window */}
            {recentConnectorId !== CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID && (
              <>
                <UniswapMobileWalletConnectorOption />
                {wallets.length > 0 && <Separator />}
              </>
            )}
            {wallets.map((wallet, index) => (
              <React.Fragment key={wallet.name}>
                <WalletConnectorOption wallet={wallet} />
                {index < wallets.length - 1 && <Separator />}
              </React.Fragment>
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
