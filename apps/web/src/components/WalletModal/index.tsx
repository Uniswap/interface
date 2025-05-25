import { useShowMoonpayText } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { MenuState, miniPortfolioMenuStateAtom } from 'components/AccountDrawer/constants'
import { Page, downloadAppModalPageAtom } from 'components/NavBar/DownloadApp/Modal'
import ConnectionErrorView from 'components/WalletModal/ConnectionErrorView'
import { DownloadWalletRow } from 'components/WalletModal/DownloadWalletRow'
import { AlternativeOption, Option } from 'components/WalletModal/Option'
import PrivacyPolicyNotice from 'components/WalletModal/PrivacyPolicyNotice'
import { UniswapWalletOptions } from 'components/WalletModal/UniswapWalletOptions'
import { useOrderedConnections } from 'components/WalletModal/useOrderedConnections'
import { useRecentConnectorId } from 'components/Web3Provider/constants'
import { useModalState } from 'hooks/useModalState'
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
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isMobileWeb } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'

export default function WalletModal() {
  const { t } = useTranslation()
  const showMoonpayText = useShowMoonpayText()
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  const [expandMoreWallets, toggleExpandMoreWallets] = useReducer((s) => !s, !isEmbeddedWalletEnabled)
  const [, setMenu] = useAtom(miniPortfolioMenuStateAtom)
  const connectors = useOrderedConnections({ showSecondaryConnectors: isMobileWeb })
  const recentConnectorId = useRecentConnectorId()

  const showDownloadHeader =
    !connectors.some((c) => c.id === CONNECTION_PROVIDER_IDS.UNISWAP_EXTENSION_RDNS) &&
    recentConnectorId !== CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID &&
    isEmbeddedWalletEnabled
  const { openModal: openGetTheAppModal } = useModalState(ModalName.GetTheApp)
  const [, setPage] = useAtom(downloadAppModalPageAtom)
  const handleOpenGetTheAppModal = useEvent(() => {
    openGetTheAppModal()
    setPage(Page.GetApp)
  })
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
      {showDownloadHeader && (
        <Flex display="flex" $md={{ display: 'none' }}>
          <DownloadWalletRow
            onPress={handleOpenGetTheAppModal}
            mx={-8}
            mt={-12}
            width={`calc(100% + ${px * 2 - 8}px)`}
            borderTopLeftRadius="$rounded16"
            borderTopRightRadius="$rounded16"
            iconSize={16}
            titleTextVariant="buttonLabel4"
          />
        </Flex>
      )}
      <Flex row justifyContent={isEmbeddedWalletEnabled ? 'center' : 'space-between'} width="100%">
        <Text variant="subheading2">
          {isEmbeddedWalletEnabled ? t('nav.logInOrConnect.title') : t('common.connectAWallet.button')}
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
          onPress={toggleExpandMoreWallets}
          {...ClickableTamaguiStyle}
        >
          <Separator />
          <Flex row alignItems="center" mx={18}>
            <Text variant="body3" color="$neutral2" whiteSpace="nowrap">
              <Trans i18nKey="wallet.other" />
            </Text>
            {expandMoreWallets ? (
              <DoubleChevronInverted size={20} color="$neutral3" />
            ) : (
              <DoubleChevron size={20} color="$neutral3" />
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
            maxHeight={expandMoreWallets && !isEmbeddedWalletEnabled ? 0 : '100vh'}
            opacity={expandMoreWallets && !isEmbeddedWalletEnabled ? 0 : 1}
            transition={`${transitions.duration.fast} ${transitions.timing.inOut}`}
            data-testid="option-grid"
          >
            {(recentConnectorId === CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID || isMobileWeb) &&
              isEmbeddedWalletEnabled && (
                <>
                  <Option connectorId={CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID} />
                  <Separator />
                </>
              )}
            {connectors.map((c, index) => (
              <>
                <Option connectorId={c.id} key={c.uid} detected={c.isInjected} />
                {index < connectors.length - 1 || isEmbeddedWalletEnabled ? <Separator /> : null}
              </>
            ))}
            {isEmbeddedWalletEnabled && !isMobileWeb && (
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
      {showDownloadHeader && (
        <Flex display="none" $md={{ display: 'flex' }}>
          <DownloadWalletRow
            onPress={handleOpenGetTheAppModal}
            mx={-8}
            mt={-12}
            width={`calc(100% + ${px * 2 - 8}px)`}
            borderTopLeftRadius="$rounded16"
            borderTopRightRadius="$rounded16"
            iconSize={20}
            titleTextVariant="buttonLabel4"
          />
        </Flex>
      )}
    </Flex>
  )
}
