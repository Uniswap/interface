import { Status } from 'components/AccountDrawer/Status'
import { GetHelpHeader } from 'components/Modal/GetHelpHeader'
import { ProviderOption } from 'components/ReceiveCryptoModal/ProviderOption'
import { useAccount } from 'hooks/useAccount'
import { useTranslation } from 'react-i18next'
import { useOpenModal, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { CopyToClipboard } from 'theme/components'
import { Flex, GeneratedIcon, HeightAnimator, IconButton, Separator, Text, TouchableArea } from 'ui/src'
import { CopySheets } from 'ui/src/components/icons/CopySheets'
import { QrCode } from 'ui/src/components/icons/QrCode'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useENSName } from 'uniswap/src/features/ens/api'
import { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { useCexTransferProviders } from 'uniswap/src/features/fiatOnRamp/useCexTransferProviders'
import { useUnitagByAddress } from 'uniswap/src/features/unitags/hooks'

function ActionIcon({ Icon }: { Icon: GeneratedIcon }) {
  return <IconButton emphasis="secondary" size="xxsmall" icon={<Icon />} />
}

function AccountCardItem({ onClose }: { onClose: () => void }): JSX.Element {
  const account = useAccount()
  const { unitag } = useUnitagByAddress(account.address)
  const { data: ENSName } = useENSName(account.address)
  const openAddressQRModal = useOpenModal({ name: ApplicationModal.RECEIVE_CRYPTO_QR })

  const onPressShowWalletQr = (): void => {
    onClose()
    openAddressQRModal()
  }

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
          <Status
            account={account.address!}
            ensUsername={ENSName}
            uniswapUsername={unitag?.username}
            showAddressCopy={false}
          />
        </Flex>
        <Flex centered row gap="$spacing12" px="$spacing8">
          <CopyToClipboard toCopy={account.address!}>
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
  setConnectedProvider: (provider: FORServiceProvider) => void
  setErrorProvider: (provider: FORServiceProvider) => void
}

export function ChooseProvider({ setConnectedProvider, setErrorProvider }: ChooseProviderProps): JSX.Element {
  const { t } = useTranslation()
  const account = useAccount()
  const toggleModal = useToggleModal(ApplicationModal.RECEIVE_CRYPTO)
  const providers = useCexTransferProviders()

  return (
    <Flex grow gap="$spacing24" mb="$spacing16">
      <GetHelpHeader link={uniswapUrls.helpArticleUrls.transferCryptoHelp} closeModal={toggleModal} />
      <Flex gap="$spacing4" p="$spacing8">
        <Text color="$neutral1" mt="$spacing2" textAlign="center" variant="subheading1">
          {t('fiatOnRamp.receiveCrypto.title')}
        </Text>
        <Text color="$neutral2" mt="$spacing2" textAlign="center" variant="body3">
          {t('fiatOnRamp.receiveCrypto.transferFunds')}
        </Text>
      </Flex>
      <Flex gap="$spacing12">
        <AccountCardItem onClose={toggleModal} />
        {providers.length > 0 && (
          <HeightAnimator animation="fastHeavy">
            <Flex gap="$spacing12">
              <Flex centered row shrink gap="$spacing12">
                <Separator />
                <Text color="$neutral2" textAlign="center" variant="body3">
                  {t('fiatOnRamp.receiveCrypto.modal.sectionTitle.fromAccount')}
                </Text>
                <Separator />
              </Flex>
              {account.address && (
                <Flex grow gap="$spacing12">
                  {providers.map((serviceProvider) => (
                    <ProviderOption
                      key={serviceProvider.name}
                      serviceProvider={serviceProvider}
                      walletAddress={account.address!}
                      setConnectedProvider={setConnectedProvider}
                      setErrorProvider={setErrorProvider}
                    />
                  ))}
                </Flex>
              )}
            </Flex>
          </HeightAnimator>
        )}
      </Flex>
    </Flex>
  )
}
