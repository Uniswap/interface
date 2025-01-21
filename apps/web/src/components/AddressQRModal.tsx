import { AddressDisplay } from 'components/AccountDetails/AddressDisplay'
import Identicon from 'components/Identicon'
import { GetHelpHeader } from 'components/Modal/GetHelpHeader'
import { useCallback } from 'react'
import { Trans } from 'react-i18next'
import { useModalIsOpen, useOpenModal, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { CopyHelper, ThemedText } from 'theme/components'
import { Flex, QRCodeDisplay, Text, useSporeColors } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { NetworkLogos } from 'uniswap/src/components/network/NetworkLogos'
import { useAddressColorProps } from 'uniswap/src/features/address/color'
import { useOrderedChainIds } from 'uniswap/src/features/chains/hooks/useOrderedChainIds'
import { SUPPORTED_CHAIN_IDS } from 'uniswap/src/features/chains/types'
import { useENSName } from 'uniswap/src/features/ens/api'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useUnitagByAddress } from 'uniswap/src/features/unitags/hooks'
import { shortenAddress } from 'utilities/src/addresses'

const UNICON_SIZE = 50
const QR_CODE_SIZE = 240

export function AddressQRModal({ accountAddress }: { accountAddress: Address }) {
  const colors = useSporeColors()
  const toggleModal = useToggleModal(ApplicationModal.RECEIVE_CRYPTO_QR)
  const isOpen = useModalIsOpen(ApplicationModal.RECEIVE_CRYPTO_QR)
  const openReceiveCryptoModal = useOpenModal({ name: ApplicationModal.RECEIVE_CRYPTO })
  const { data: ENSName } = useENSName(accountAddress)
  const { unitag } = useUnitagByAddress(accountAddress)
  const hasSecondaryIdentifier = ENSName || unitag?.username
  const addressColor = useAddressColorProps(accountAddress)
  const orderedChainIds = useOrderedChainIds(SUPPORTED_CHAIN_IDS)

  const goBack = useCallback(() => {
    toggleModal()
    openReceiveCryptoModal()
  }, [toggleModal, openReceiveCryptoModal])

  return (
    <Modal isModalOpen={isOpen} onClose={toggleModal} maxWidth={420} name={ModalName.AddressQR}>
      <Flex pb="$spacing16" gap="$spacing24">
        <GetHelpHeader goBack={goBack} closeModal={toggleModal} />
        <Flex gap="$spacing12">
          <Flex alignItems="center">
            <ThemedText.SubHeader>
              <AddressDisplay enableCopyAddress address={accountAddress} />
            </ThemedText.SubHeader>
            {hasSecondaryIdentifier && (
              <CopyHelper iconSize={14} iconPosition="right" toCopy={accountAddress}>
                <Text variant="body4" color="neutral2">
                  {shortenAddress(accountAddress)}
                </Text>
              </CopyHelper>
            )}
          </Flex>
          <QRCodeDisplay
            ecl="M"
            color={addressColor}
            containerBackgroundColor={colors.surface1.val}
            size={QR_CODE_SIZE}
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
            <Trans i18nKey="qrScanner.wallet.title" values={{ numOfNetworks: Object.keys(orderedChainIds).length }} />
          </Text>
          <NetworkLogos chains={orderedChainIds} />
        </Flex>
      </Flex>
    </Modal>
  )
}
