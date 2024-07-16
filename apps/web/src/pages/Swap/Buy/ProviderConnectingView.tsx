import { useBuyFormContext } from 'pages/Swap/Buy/BuyFormContext'
import { ConnectingViewWrapper } from 'pages/Swap/Buy/shared'
import { Trans } from 'react-i18next'
import { Text, useIsDarkMode } from 'ui/src'
import { FiatOnRampConnectingView } from 'uniswap/src/features/fiatOnRamp/FiatOnRampConnectingView'
import { ServiceProviderLogoStyles } from 'uniswap/src/features/fiatOnRamp/constants'
import { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { getOptionalServiceProviderLogo } from 'uniswap/src/features/fiatOnRamp/utils'

interface ProviderConnectingViewProps {
  closeModal: () => void
  selectedServiceProvider: FORServiceProvider
}

export function ProviderConnectingView({ closeModal, selectedServiceProvider }: ProviderConnectingViewProps) {
  const isDarkMode = useIsDarkMode()
  const { derivedBuyFormInfo, buyFormState } = useBuyFormContext()
  const { quoteCurrency, inputAmount } = buyFormState
  const { meldSupportedFiatCurrency } = derivedBuyFormInfo
  return (
    <ConnectingViewWrapper closeModal={closeModal}>
      <FiatOnRampConnectingView
        serviceProviderName={selectedServiceProvider.name}
        amount={(meldSupportedFiatCurrency?.symbol ?? '$') + parseFloat(inputAmount).toFixed(2)}
        quoteCurrencyCode={quoteCurrency.currencyInfo?.currency.symbol}
        serviceProviderLogo={
          <img
            style={ServiceProviderLogoStyles.uniswapLogoWrapper}
            height={ServiceProviderLogoStyles.icon.height}
            src={getOptionalServiceProviderLogo(selectedServiceProvider?.logos, isDarkMode)}
            width={ServiceProviderLogoStyles.icon.height}
          />
        }
      />
      <Text variant="body3" textAlign="center" color="$neutral2">
        <Trans i18nKey="fiatOnRamp.disclaimer" values={{ serviceProvider: selectedServiceProvider.name }} />
      </Text>
    </ConnectingViewWrapper>
  )
}
