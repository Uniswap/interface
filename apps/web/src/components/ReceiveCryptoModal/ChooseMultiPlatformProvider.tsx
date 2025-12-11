import { useActiveAddresses } from 'features/accounts/store/hooks'
import { deprecatedStyled } from 'lib/styled-components'
import { ProviderConnectedView } from 'pages/Swap/Buy/ProviderConnectedView'
import { ProviderConnectionError } from 'pages/Swap/Buy/ProviderConnectionError'
import { ConnectingViewWrapper } from 'pages/Swap/Buy/shared'
import { useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { addFiatOnRampTransaction } from 'state/fiatOnRampTransactions/reducer'
import { FiatOnRampTransactionStatus, FiatOnRampTransactionType } from 'state/fiatOnRampTransactions/types'
import { ExternalLink } from 'theme/components/Links'
import { Flex, Text, TouchableArea, useIsDarkMode, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { UNISWAP_WEB_URL } from 'uniswap/src/constants/urls'
import { MAINNET_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/mainnet'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { SOLANA_CHAIN_INFO } from 'uniswap/src/features/chains/svm/info/solana'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useFiatOnRampAggregatorTransferWidgetQuery } from 'uniswap/src/features/fiatOnRamp/api'
import { ServiceProviderLogoStyles } from 'uniswap/src/features/fiatOnRamp/constants'
import { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { getOptionalServiceProviderLogo } from 'uniswap/src/features/fiatOnRamp/utils'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { FiatOnRampEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { shortenAddress } from 'utilities/src/addresses'
import { useEvent } from 'utilities/src/react/hooks'
import { v4 as uuid } from 'uuid'

const StyledLink = deprecatedStyled(ExternalLink)`
  font-weight: 535;
  color: ${({ theme }) => theme.neutral3};
`

interface ChooseMultiPlatformProviderProps {
  selectedServiceProvider: FORServiceProvider
  closeModal?: () => void
  errorProvider?: FORServiceProvider
  connectedProvider?: FORServiceProvider
  setConnectedProvider: (provider: FORServiceProvider) => void
  setErrorProvider: (provider: FORServiceProvider | undefined) => void
}

function ProviderPlatform({
  address,
  platform,
  selectedServiceProvider,
  setConnectedProvider,
  setErrorProvider,
}: {
  address: Address | undefined
  platform: Platform
  selectedServiceProvider: FORServiceProvider
  setConnectedProvider: (provider: FORServiceProvider) => void
  setErrorProvider: (provider: FORServiceProvider | undefined) => void
}) {
  const { t } = useTranslation()
  const { chains: evmChains } = useEnabledChains({ platform: Platform.EVM })

  const externalTransactionId = useMemo(() => uuid(), [])

  const widgetQueryParams = useMemo(() => {
    return {
      serviceProvider: selectedServiceProvider.serviceProvider,
      walletAddress: address ?? '', // satisfy typecheck: useFiatOnRampAggregatorTransferWidgetQuery will only query if walletAddress is defined
      externalSessionId: externalTransactionId,
      redirectUrl: `${UNISWAP_WEB_URL}/buy`,
    }
  }, [selectedServiceProvider, address, externalTransactionId])

  // TODO(WEB-4417): use the widgetUrl from the /transfer-service-providers response instead of prefetching for every provider.
  const { data, error, isLoading } = useFiatOnRampAggregatorTransferWidgetQuery(widgetQueryParams, {
    skip: !address,
  })

  const handleOpenWidget = useEvent(() => {
    if (data && address) {
      window.open(data.widgetUrl, '_blank')
      setConnectedProvider(selectedServiceProvider)
      addFiatOnRampTransaction({
        externalSessionId: externalTransactionId,
        account: address,
        status: FiatOnRampTransactionStatus.INITIATED,
        forceFetched: false,
        addedAt: Date.now(),
        type: FiatOnRampTransactionType.TRANSFER,
        syncedWithBackend: false,
        provider: selectedServiceProvider.serviceProvider,
      })
      sendAnalyticsEvent(FiatOnRampEventName.FiatOnRampTransferWidgetOpened, {
        externalTransactionId,
        serviceProvider: selectedServiceProvider.serviceProvider,
      })
    } else if (error) {
      setErrorProvider(selectedServiceProvider)
    }
  })

  return (
    <TouchableArea
      disabled={Boolean(isLoading || !data || error)}
      disabledStyle={{
        cursor: 'wait',
      }}
      height="unset"
      animation="200ms"
      position="relative"
      onPress={handleOpenWidget}
      hoverStyle={{ backgroundColor: '$surface1Hovered' }}
    >
      <Flex
        backgroundColor="$surface1"
        borderColor="$surface3"
        borderRadius="$rounded20"
        borderWidth="$spacing1"
        p="$spacing12"
        style={{ transition: 'background-color 0.2s ease-in-out' }}
      >
        <Flex row alignItems="center" gap="$spacing12" width="100%" justifyContent="space-between">
          {platform === Platform.EVM ? (
            <Flex row alignItems="center" gap="$spacing12">
              <NetworkLogo chainId={null} size={iconSizes.icon36} animation="100ms" />
              <Flex row centered gap="$spacing4">
                <Text color="$neutral1" variant="body2">
                  {MAINNET_CHAIN_INFO.name}
                </Text>
                <Text color="$neutral2" variant="body4">
                  {`+${evmChains.length - 1} ${t('extension.connection.networks').toLowerCase()}`}
                </Text>
              </Flex>
            </Flex>
          ) : (
            <Flex row alignItems="center" gap="$spacing12">
              <NetworkLogo chainId={UniverseChainId.Solana} size={iconSizes.icon36} animation="100ms" />
              <Text color="$neutral1" variant="body2">
                {SOLANA_CHAIN_INFO.name}
              </Text>
            </Flex>
          )}

          <Text animation="100ms" color="$neutral2" variant="body4">
            {shortenAddress({ address })}
          </Text>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}

export function ChooseMultiPlatformProvider({
  selectedServiceProvider,
  closeModal,
  errorProvider,
  connectedProvider,
  setConnectedProvider,
  setErrorProvider,
}: ChooseMultiPlatformProviderProps) {
  const isDarkMode = useIsDarkMode()
  const { t } = useTranslation()
  const colors = useSporeColors()

  const activeAddresses = useActiveAddresses()

  if (errorProvider) {
    return (
      <ProviderConnectionError onBack={() => setErrorProvider(undefined)} selectedServiceProvider={errorProvider} />
    )
  }
  if (connectedProvider) {
    return <ProviderConnectedView selectedServiceProvider={connectedProvider} />
  }

  return (
    <ConnectingViewWrapper showDottedBackground={false} closeModal={closeModal}>
      <Flex alignItems="center" gap="$spacing48">
        <Flex alignItems="center" gap="$spacing24">
          <img
            style={ServiceProviderLogoStyles.uniswapLogoWrapper}
            height={120}
            src={getOptionalServiceProviderLogo(selectedServiceProvider.logos, isDarkMode)}
            width={120}
          />
          <Flex alignItems="center" gap="$spacing8">
            <Text variant="subheading1">{t('fiatOnRamp.chooseMultiPlatformProvider.chooseNetwork')}</Text>
            <Text variant="body2" textAlign="center" color="$neutral2">
              {t('fiatOnRamp.chooseMultiPlatformProvider.description')}
            </Text>
          </Flex>
          <Flex width="100%" gap="$spacing12">
            <ProviderPlatform
              address={activeAddresses.evmAddress}
              platform={Platform.EVM}
              selectedServiceProvider={selectedServiceProvider}
              setConnectedProvider={setConnectedProvider}
              setErrorProvider={setErrorProvider}
            />
            <ProviderPlatform
              address={activeAddresses.svmAddress}
              platform={Platform.SVM}
              selectedServiceProvider={selectedServiceProvider}
              setConnectedProvider={setConnectedProvider}
              setErrorProvider={setErrorProvider}
            />
          </Flex>
        </Flex>

        <Text variant="body4" textAlign="center" color="$neutral3">
          <Trans
            i18nKey="fiatOnRamp.disclaimer"
            values={{
              serviceProvider: selectedServiceProvider.name,
            }}
            components={{
              tosLink: (
                <StyledLink color={colors.neutral3.val} href="https://uniswap.org/terms-of-service/">
                  {t('common.termsOfService')}
                </StyledLink>
              ),
              privacyLink: (
                <StyledLink color={colors.neutral3.val} href="https://uniswap.org/privacy-policy">
                  {t('common.privacyPolicy')}
                </StyledLink>
              ),
            }}
          />
        </Text>
      </Flex>
    </ConnectingViewWrapper>
  )
}
