import { AccountOption } from 'components/ReceiveCryptoModal/AccountOption'
import { ProviderOption } from 'components/ReceiveCryptoModal/ProviderOption'
import { ReceiveModalState } from 'components/ReceiveCryptoModal/types'
import { useOpenReceiveCryptoModal } from 'components/ReceiveCryptoModal/useOpenReceiveCryptoModal'
import { useActiveAddresses } from 'features/accounts/store/hooks'
import { ProviderConnectedView } from 'pages/Swap/Buy/ProviderConnectedView'
import { ProviderConnectionError } from 'pages/Swap/Buy/ProviderConnectionError'
import { useTranslation } from 'react-i18next'
import { CopyToClipboard } from 'theme/components/CopyHelper'
import { Flex, GeneratedIcon, IconButton, Separator, Text, TouchableArea } from 'ui/src'
import { CopySheets } from 'ui/src/components/icons/CopySheets'
import { QrCode } from 'ui/src/components/icons/QrCode'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { useENSName } from 'uniswap/src/features/ens/api'
import { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { useCexTransferProviders } from 'uniswap/src/features/fiatOnRamp/useCexTransferProviders'

function ActionIcon({ Icon }: { Icon: GeneratedIcon }) {
  return <IconButton emphasis="secondary" size="xxsmall" icon={<Icon />} />
}

function AccountCardItem({ address }: { address: Address }): JSX.Element {
  const { data: unitag } = useUnitagsAddressQuery({
    params: address ? { address } : undefined,
  })
  const { data: ENSName } = useENSName(address)

  const onPressShowWalletQr = useOpenReceiveCryptoModal({
    modalState: ReceiveModalState.QR_CODE,
    qrCodeAddress: address,
  })

  return (
    <Flex row alignItems="flex-start" gap="$spacing12">
      <Flex
        fill
        row
        borderColor="$surface3"
        borderRadius="$rounded20"
        borderWidth="$spacing1"
        gap="$spacing12"
        p="$spacing12"
      >
        <Flex fill>
          <AccountOption account={address} ensUsername={ENSName} uniswapUsername={unitag?.username} />
        </Flex>
        <Flex centered row gap="$spacing12" px="$spacing8">
          <CopyToClipboard toCopy={address}>
            <ActionIcon Icon={CopySheets} />
          </CopyToClipboard>
          <TouchableArea onPress={onPressShowWalletQr}>
            <ActionIcon Icon={QrCode} />
          </TouchableArea>
        </Flex>
      </Flex>
    </Flex>
  )
}

type ChooseProviderProps = {
  providersOnly?: boolean
  errorProvider?: FORServiceProvider
  connectedProvider?: FORServiceProvider
  setConnectedProvider: (provider: FORServiceProvider) => void
  setErrorProvider: (provider: FORServiceProvider | undefined) => void
}

export function ChooseProvider({
  providersOnly = false,
  errorProvider,
  connectedProvider,
  setConnectedProvider,
  setErrorProvider,
}: ChooseProviderProps): JSX.Element {
  const { t } = useTranslation()
  const activeAddresses = useActiveAddresses()
  const providers = useCexTransferProviders()

  if (errorProvider) {
    return (
      <ProviderConnectionError onBack={() => setErrorProvider(undefined)} selectedServiceProvider={errorProvider} />
    )
  }

  if (connectedProvider) {
    return <ProviderConnectedView selectedServiceProvider={connectedProvider} />
  }

  return (
    <Flex grow gap="$spacing24" mb="$spacing16">
      <Flex gap="$spacing4" p="$spacing8" pt="$spacing24">
        <Text color="$neutral1" mt="$spacing2" textAlign="center" variant="subheading1">
          {providersOnly ? t('home.empty.cexTransfer') : t('fiatOnRamp.receiveCrypto.title')}
        </Text>
        <Text color="$neutral2" mt="$spacing2" textAlign="center" variant="body3">
          {providersOnly ? t('home.empty.cexTransfer.description') : t('fiatOnRamp.receiveCrypto.transferFunds')}
        </Text>
      </Flex>
      <Flex gap="$spacing12">
        {!providersOnly && (
          <>
            {activeAddresses.evmAddress && <AccountCardItem address={activeAddresses.evmAddress} />}
            {activeAddresses.svmAddress && <AccountCardItem address={activeAddresses.svmAddress} />}
          </>
        )}
        {providers.length > 0 && (
          <Flex gap="$spacing12">
            {!providersOnly && (
              <Flex centered row shrink gap="$spacing12">
                <Separator />
                <Text color="$neutral2" textAlign="center" variant="body3">
                  {t('fiatOnRamp.receiveCrypto.modal.sectionTitle.fromAccount')}
                </Text>
                <Separator />
              </Flex>
            )}
            {activeAddresses.evmAddress !== undefined && (
              <Flex grow gap="$spacing12">
                {providers.map((serviceProvider) => (
                  <ProviderOption
                    key={serviceProvider.name}
                    serviceProvider={serviceProvider}
                    walletAddress={activeAddresses.evmAddress ?? ''}
                    setConnectedProvider={setConnectedProvider}
                    setErrorProvider={setErrorProvider}
                  />
                ))}
              </Flex>
            )}
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
