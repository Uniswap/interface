import { useShowMoonpayText } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { MenuState, miniPortfolioMenuStateAtom } from 'components/AccountDrawer/constants'
import ConnectionErrorView from 'components/WalletModal/ConnectionErrorView'
import { UniswapMobileWalletConnectorOption } from 'components/WalletModal/UniswapMobileWalletConnectorOption'
import { UniswapWalletOptions } from 'components/WalletModal/UniswapWalletOptions'
import { OtherWalletsOption, WalletConnectorOption } from 'components/WalletModal/WalletConnectorOption'
import { useRecentConnectorId } from 'components/Web3Provider/constants'
import { useOrderedWalletConnectors } from 'features/wallet/connection/hooks/useOrderedWalletConnectors'
import { useAtom } from 'jotai'
import { Fragment, useReducer } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { transitions } from 'theme/styles'
import { Flex, Separator, Text } from 'ui/src'
import { DoubleChevron } from 'ui/src/components/icons/DoubleChevron'
import { DoubleChevronInverted } from 'ui/src/components/icons/DoubleChevronInverted'
import { JuiceSwapLogo } from 'ui/src/components/icons/JuiceSwapLogo'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { isMobileWeb } from 'utilities/src/platform'

export default function WalletModal() {
  const { t } = useTranslation()
  const showMoonpayText = useShowMoonpayText()
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  const [expandMoreWallets, toggleExpandMoreWallets] = useReducer((s) => !s, true)
  const [, setMenu] = useAtom(miniPortfolioMenuStateAtom)

  const connectors = useOrderedWalletConnectors({ showSecondaryConnectors: isMobileWeb })
  const recentConnectorId = useRecentConnectorId()

  const px = 12

  return (
    <Flex
      backgroundColor="$surface1"
      pt="$spacing16"
      px={px}
      pb="$spacing20"
      flex={1}
      gap="$gap16"
      data-testid="wallet-modal"
    >
      <ConnectionErrorView />
      <Flex row justifyContent={isEmbeddedWalletEnabled ? 'center' : 'space-between'} width="100%">
        <Text variant="subheading2">
          {isEmbeddedWalletEnabled ? t('nav.logInOrConnect.title') : t('common.connectAWallet.button')}
        </Text>
      </Flex>
      {isEmbeddedWalletEnabled ? (
        <Flex justifyContent="center" alignItems="center" py={8}>
          <JuiceSwapLogo size={48} color="$accent1" />
        </Flex>
      ) : (
        <UniswapWalletOptions />
      )}
      {isEmbeddedWalletEnabled ? null : (
        <Flex
          row
          alignItems="center"
          py={8}
          userSelect="none"
          onPress={toggleExpandMoreWallets}
          {...ClickableTamaguiStyle}
        >
          <Separator />
          <Flex row alignItems="center" mx={18}>
            <Text variant="body3" color="$neutral2" whiteSpace="nowrap">
              <Trans i18nKey="wallet.other" />
            </Text>
            {expandMoreWallets ? (
              <DoubleChevron size={20} color="$neutral3" />
            ) : (
              <DoubleChevronInverted size={20} color="$neutral3" />
            )}
          </Flex>
          <Separator />
        </Flex>
      )}
      <Flex gap="$gap12">
        <Flex row alignItems="flex-start">
          <Flex
            borderRadius="$rounded16"
            overflow="hidden"
            width="100%"
            maxHeight={expandMoreWallets ? '100vh' : 0}
            opacity={expandMoreWallets ? 1 : 0}
            transition={`${transitions.duration.fast} ${transitions.timing.inOut}`}
            data-testid="option-grid"
          >
            {(recentConnectorId === CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID || isMobileWeb) &&
              isEmbeddedWalletEnabled && (
                <>
                  <UniswapMobileWalletConnectorOption />
                  <Separator />
                </>
              )}
            {connectors.map((c, index) => (
              <Fragment key={c.name}>
                <WalletConnectorOption walletConnectorMeta={c} />
                {index < connectors.length - 1 || isEmbeddedWalletEnabled ? <Separator /> : null}
              </Fragment>
            ))}
            {isEmbeddedWalletEnabled && !isMobileWeb && (
              <OtherWalletsOption onPress={() => setMenu(MenuState.OTHER_WALLETS)} />
            )}
          </Flex>
        </Flex>
        <Flex gap="$gap8">
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
