import { FORQuoteItem } from 'uniswap/src/features/fiatOnRamp/FORQuoteItem'
import { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { useCexTransferProviderPress } from '~/components/ReceiveCryptoModal/useCexTransferProviderPress'

interface ProviderOptionProps {
  serviceProvider: FORServiceProvider
  setConnectedProvider: (provider: FORServiceProvider) => void
  setErrorProvider: (provider: FORServiceProvider) => void
}

export function ProviderOption({ serviceProvider, setConnectedProvider, setErrorProvider }: ProviderOptionProps) {
  const { onPress, isLoading } = useCexTransferProviderPress(serviceProvider, {
    onWidgetOpened: setConnectedProvider,
    onWidgetError: setErrorProvider,
  })

  return (
    <FORQuoteItem
      key={serviceProvider.name}
      serviceProvider={serviceProvider}
      isLoading={isLoading}
      onPress={onPress}
    />
  )
}
