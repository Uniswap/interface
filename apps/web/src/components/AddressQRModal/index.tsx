import { AddressDisplay } from 'components/AccountDetails/AddressDisplay'
import { SecondaryIdentifiers } from 'components/AccountDrawer/Status'
import Identicon from 'components/Identicon'
import { GetHelpHeader } from 'components/Modal/GetHelpHeader'
import { PRODUCTION_CHAIN_IDS } from 'constants/chains'
import useENSName from 'hooks/useENSName'
import styled from 'lib/styled-components'
import { useCallback } from 'react'
import { useModalIsOpen, useOpenModal, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { ExternalLink, ThemedText } from 'theme/components'
import { AdaptiveWebModal, Flex, QRCodeDisplay, Text, useSporeColors } from 'ui/src'
import { NetworkLogos } from 'uniswap/src/components/network/NetworkLogos'
import { useAddressColorProps } from 'uniswap/src/features/address/color'
import { useUnitagByAddress } from 'uniswap/src/features/unitags/hooks'
import { Trans } from 'uniswap/src/i18n'

const HelpCenterLink = styled(ExternalLink)`
  font-size: 14px;
  margin: 4px auto 0 auto;
`

const UNICON_SIZE = 50
const QR_CODE_SIZE = 240

export function AddressQRModal({ accountAddress }: { accountAddress: Address }) {
  const colors = useSporeColors()
  const toggleModal = useToggleModal(ApplicationModal.RECEIVE_CRYPTO_QR)
  const isOpen = useModalIsOpen(ApplicationModal.RECEIVE_CRYPTO_QR)
  const openReceiveCryptoModal = useOpenModal(ApplicationModal.RECEIVE_CRYPTO)
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
            {hasSecondaryIdentifier && (
              <Text variant="heading3">
                <SecondaryIdentifiers
                  account={accountAddress!}
                  ensUsername={ENSName}
                  uniswapUsername={unitag?.username}
                />
              </Text>
            )}
            <ThemedText.SubHeader>
              <AddressDisplay enableCopyAddress address={accountAddress} />
            </ThemedText.SubHeader>
          </Flex>
          <QRCodeDisplay
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
            <Trans i18nKey="fiatOnRamp.receiveCrypto.modal.addressQr.supportedNetworks" />
          </Text>
          <NetworkLogos showFirstChainLabel borderRadius="$roundedFull" chains={PRODUCTION_CHAIN_IDS} />
          <HelpCenterLink href="https://support.uniswap.org/hc/en-us/articles/14569415293325-Networks-on-Uniswap">
            <Trans i18nKey="common.button.learn" />
          </HelpCenterLink>
        </Flex>
      </Flex>
    </AdaptiveWebModal>
  )
}
