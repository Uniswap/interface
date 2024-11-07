import { AddressDisplay } from 'components/AccountDetails/AddressDisplay'
import { SecondaryIdentifiers } from 'components/AccountDrawer/Status'
import Identicon from 'components/Identicon'
import { GetHelpHeader } from 'components/Modal/GetHelpHeader'
import useENSName from 'hooks/useENSName'
import { useCallback } from 'react'
import { useModalIsOpen, useOpenModal, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { ThemedText } from 'theme/components'
import { AdaptiveWebModal, Flex, QRCodeDisplay, Text, useSporeColors } from 'ui/src'
import { NetworkLogos } from 'uniswap/src/components/network/NetworkLogos'
import { useAddressColorProps } from 'uniswap/src/features/address/color'
import { SUPPORTED_CHAIN_IDS } from 'uniswap/src/features/chains/types'
import { useUnitagByAddress } from 'uniswap/src/features/unitags/hooks'
import { Trans } from 'uniswap/src/i18n'

const UNICON_SIZE = 50
const QR_CODE_SIZE = 240

export function AddressQRModal({ accountAddress }: { accountAddress: Address }) {
  const colors = useSporeColors()
  const toggleModal = useToggleModal(ApplicationModal.RECEIVE_CRYPTO_QR)
  const isOpen = useModalIsOpen(ApplicationModal.RECEIVE_CRYPTO_QR)
  const openReceiveCryptoModal = useOpenModal({ name: ApplicationModal.RECEIVE_CRYPTO })
  const { ENSName } = useENSName(accountAddress)
  const { unitag } = useUnitagByAddress(accountAddress)
  const hasSecondaryIdentifier = ENSName || unitag?.username
  const addressColor = useAddressColorProps(accountAddress)

  const goBack = useCallback(() => {
    toggleModal()
    openReceiveCryptoModal()
  }, [toggleModal, openReceiveCryptoModal])

  return (
    <AdaptiveWebModal isOpen={isOpen} onClose={toggleModal} width={420}>
      <Flex pb="$spacing16" gap="$spacing24">
        <GetHelpHeader goBack={goBack} closeModal={toggleModal} />
        <Flex gap="$spacing12">
          <Flex alignItems="center">
            <ThemedText.SubHeader>
              <AddressDisplay enableCopyAddress address={accountAddress} />
            </ThemedText.SubHeader>
            {hasSecondaryIdentifier && (
              <Text variant="heading3">
                <SecondaryIdentifiers
                  account={accountAddress!}
                  ensUsername={ENSName}
                  uniswapUsername={unitag?.username}
                />
              </Text>
            )}
          </Flex>
          <QRCodeDisplay
            ecl="M"
            color={addressColor}
            containerBackgroundColor={colors.surface1.val}
            size={QR_CODE_SIZE}
            eyeSize={180}
            encodedValue={accountAddress!}
          >
            <Flex
              justifyContent="center"
              alignItems="center"
              p="$spacing4"
              backgroundColor="$surface1"
              borderRadius="$roundedFull"
            >
              <Identicon size={UNICON_SIZE} account={accountAddress} />
            </Flex>
          </QRCodeDisplay>
          <Text color="$neutral2" lineHeight={20} textAlign="center" variant="body3">
            <Trans
              i18nKey="qrScanner.wallet.title"
              values={{ numOfNetworks: Object.keys(SUPPORTED_CHAIN_IDS).length }}
            />
          </Text>
          <NetworkLogos chains={SUPPORTED_CHAIN_IDS} />
        </Flex>
      </Flex>
    </AdaptiveWebModal>
  )
}
