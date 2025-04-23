import { MenuState, miniPortfolioMenuStateAtom } from 'components/AccountDrawer/constants'
import { useShowMoonpayText } from 'components/AccountDrawer/MiniPortfolio/hooks'
import ConnectionErrorView from 'components/WalletModal/ConnectionErrorView'
import { AlternativeOption, Option } from 'components/WalletModal/Option'
import PrivacyPolicyNotice from 'components/WalletModal/PrivacyPolicyNotice'
import { UniswapWalletOptions } from 'components/WalletModal/UniswapWalletOptions'
import { useOrderedConnections } from 'components/WalletModal/useOrderedConnections'
import { useRecentConnectorId } from 'components/Web3Provider/constants'
import { useIsUniExtensionAvailable } from 'hooks/useUniswapWalletOptions'
import { useAtom } from 'jotai'
import { useReducer } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { transitions } from 'theme/styles'
import { Flex, Separator, Text } from 'ui/src'
import { DoubleChevron } from 'ui/src/components/icons/DoubleChevron'
import { DoubleChevronInverted } from 'ui/src/components/icons/DoubleChevronInverted'
import { UniswapLogo } from 'ui/src/components/icons/UniswapLogo'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { AccountCTAsExperimentGroup, Experiments } from 'uniswap/src/features/gating/experiments'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useExperimentGroupName, useFeatureFlag } from 'uniswap/src/features/gating/hooks'

export default function WalletModal() {
  const { t } = useTranslation()
  const showMoonpayText = useShowMoonpayText()
  const isUniExtensionAvailable = useIsUniExtensionAvailable()
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  const [expandMoreWallets, toggleExpandMoreWallets] = useReducer((s) => !s, !isEmbeddedWalletEnabled)
  const [, setMenu] = useAtom(miniPortfolioMenuStateAtom)
  const connectors = useOrderedConnections()
  const recentConnectorId = useRecentConnectorId()

  const isSignIn = useExperimentGroupName(Experiments.AccountCTAs) === AccountCTAsExperimentGroup.SignInSignUp
  const isLogIn = useExperimentGroupName(Experiments.AccountCTAs) === AccountCTAsExperimentGroup.LogInCreateAccount

  return (
    <Flex
      backgroundColor="$surface1"
      pt={isUniExtensionAvailable ? 16 : 14}
      px="$spacing16"
      pb="$spacing20"
      flex={1}
      gap="$gap16"
      data-testid="wallet-modal"
    >
      <ConnectionErrorView />
      <Flex row justifyContent={isEmbeddedWalletEnabled ? 'center' : 'space-between'} width="100%">
        <Text variant="subheading2">
          {isEmbeddedWalletEnabled
            ? t('nav.signInOrConnect.title')
            : isSignIn
              ? t('nav.signIn.button')
              : isLogIn
                ? t('nav.logIn.button')
                : t('common.connectAWallet.button')}
        </Text>
      </Flex>
      {isEmbeddedWalletEnabled ? (
        <Flex justifyContent="center" alignItems="center" py={8}>
          <UniswapLogo size={48} color="$accent1" />
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
          onPress={() => isUniExtensionAvailable && toggleExpandMoreWallets()}
          {...(isUniExtensionAvailable ? ClickableTamaguiStyle : {})}
        >
          <Separator />
          <Flex row alignItems="center" mx={18}>
            <Text variant="body3" color="$neutral2" whiteSpace="nowrap">
              <Trans i18nKey="wallet.other" />
            </Text>
            {isUniExtensionAvailable ? (
              expandMoreWallets ? (
                <DoubleChevronInverted size={20} color="$neutral3" />
              ) : (
                <DoubleChevron size={20} color="$neutral3" />
              )
            ) : null}
          </Flex>
          <Separator />
        </Flex>
      )}
      <Flex gap="$gap12">
        <Flex row alignItems="flex-start">
          <Flex
            gap={2}
            borderRadius="$rounded16"
            overflow="hidden"
            width="100%"
            maxHeight={expandMoreWallets ? 0 : '100vh'}
            opacity={expandMoreWallets ? 0 : 1}
            transition={`${transitions.duration.fast} ${transitions.timing.inOut}`}
            data-testid="option-grid"
          >
            {recentConnectorId === CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID &&
              isEmbeddedWalletEnabled && (
                <Option connectorId={CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID} />
              )}
            {connectors.map((c) => (
              <Option connectorId={c.id} key={c.uid} detected={c.isInjected} />
            ))}
            {isEmbeddedWalletEnabled && (
              <Option connectorId={AlternativeOption.OTHER_WALLETS} onPress={() => setMenu(MenuState.OTHER_WALLETS)} />
            )}
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
