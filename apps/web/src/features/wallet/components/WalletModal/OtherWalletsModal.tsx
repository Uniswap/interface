import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex, Text, TouchableArea, Separator } from '@universe/mycelium'
import { BackArrow } from '@universe/mycelium/icons/BackArrow'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { useRecentConnectorId } from '~/connection/constants'
import { useOrderedWallets } from '~/connection/hooks/useOrderedWalletConnectors'
import { ConnectionErrorView } from '~/features/wallet/components/WalletModal/ConnectionErrorView'
import { PrivacyPolicyNotice } from '~/features/wallet/components/WalletModal/PrivacyPolicyNotice'
import { UniswapMobileWalletConnectorOption } from '~/features/wallet/components/WalletModal/UniswapMobileWalletConnectorOption'
import { WalletConnectorOption } from '~/features/wallet/components/WalletModal/WalletConnectorOption'
import { useShowMoonpayText } from '~/state/accountDrawer/hooks'
import { MenuStateVariant, useMenuState, useSetMenu } from '~/state/accountDrawer/menuState'
import { transitions } from '~/theme/styles'

export function OtherWalletsModal() {
  const { t } = useTranslation()
  const showMoonpayText = useShowMoonpayText()
  const setMenu = useSetMenu()
  const { menuState } = useMenuState()
  const returnTo =
    menuState.variant === MenuStateVariant.OTHER_WALLETS
      ? (menuState.returnTo ?? MenuStateVariant.MAIN)
      : MenuStateVariant.MAIN
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
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
      testID="other-wallet-modal"
    >
      <ConnectionErrorView />
      <Flex row justifyContent="center" width="100%">
        <TouchableArea testID="wallet-back" onPress={() => setMenu({ variant: returnTo })} mr="auto">
          <BackArrow color="$neutral2" size={20} />
        </TouchableArea>
        <Text variant="subheading2" mr="auto" ml={-20}>
          {returnTo === MenuStateVariant.SWITCH
            ? t('common.connectAWallet.button.switch')
            : t('common.connectAWallet.button')}
        </Text>
      </Flex>

      <Flex gap="$gap16">
        <Flex row grow alignItems="flex-start">
          <Flex
            borderRadius="$rounded16"
            overflow="hidden"
            width="100%"
            transition={`${transitions.duration.fast} ${transitions.timing.inOut}`}
            testID="option-grid"
          >
            {/* If uniswap mobile was the last used connector it will be show on the primary window */}
            {/* If Embedded Wallet is enabled, it will be shown on the primary window */}
            {recentConnectorId !== CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID &&
              !isEmbeddedWalletEnabled && (
                <>
                  <UniswapMobileWalletConnectorOption />
                  {wallets.length > 0 && <Separator />}
                </>
              )}
            {wallets.map((wallet, index) => (
              <React.Fragment key={wallet.name}>
                <WalletConnectorOption wallet={wallet} />
                {index < wallets.length - 1 &&
                  (isEmbeddedWalletEnabled ? <Flex height={2} backgroundColor="$surface1" /> : <Separator />)}
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
                {t('moonpay.poweredBy')}
              </Text>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Flex>
  )
}
