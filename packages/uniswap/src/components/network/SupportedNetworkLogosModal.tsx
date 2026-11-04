import { UniverseChainId } from '@universe/chains'
import { isWebApp } from '@universe/environment'
import { Button, Flex, Text, TouchableArea, borderRadii, iconSizes, zIndexes } from '@universe/mycelium'
import { GlobeFilled } from '@universe/mycelium/icons/GlobeFilled'
import { X } from '@universe/mycelium/icons/X'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Image } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export type SupportedNetworkLogosModalProps = {
  chains: UniverseChainId[]
  isShowingModal: boolean
  closeModal: () => void
}

export function SupportedNetworkLogosModal({
  chains,
  isShowingModal,
  closeModal,
}: SupportedNetworkLogosModalProps): JSX.Element {
  const { t } = useTranslation()

  const chainPills = useMemo(
    () => (
      <Flex row flexWrap="wrap" justifyContent="center" gap="$gap12">
        {chains.map((chain) => {
          const { label, logo } = getChainInfo(chain)
          return (
            <Flex
              key={chain}
              row
              centered
              maxContent
              p="$spacing4"
              backgroundColor="$surface2"
              borderRadius="$rounded8"
              gap="$gap8"
            >
              {logo && (
                <Image
                  objectFit="contain"
                  source={logo}
                  style={{
                    width: iconSizes.icon16,
                    height: iconSizes.icon16,
                    borderRadius: borderRadii.rounded4,
                  }}
                />
              )}

              <Text color="$neutral1" variant="body4">
                {label}
              </Text>
            </Flex>
          )
        })}
      </Flex>
    ),
    [chains],
  )

  return (
    <Modal name={ModalName.QRCodeNetworkInfo} isModalOpen={isShowingModal} onClose={closeModal}>
      <Flex gap="$spacing12" px="$padding16" pb="$spacing4" alignItems="center" mt="$gap12">
        {/* X BUTTON */}
        {isWebApp && (
          <TouchableArea alignSelf="flex-end" zIndex={zIndexes.default} onPress={closeModal}>
            <X color="$neutral2" size="$icon.24" />
          </TouchableArea>
        )}
        {/* HEADER */}
        <Flex centered p="$padding12" backgroundColor="$surface3" borderRadius="$rounded12">
          <GlobeFilled color="$neutral1" size="$icon.20" />
        </Flex>
        <Text color="$neutral1" mt="$spacing2" textAlign="center" variant="subheading1">
          {t('qrScanner.wallet.networks')}
        </Text>
        {/* CONTENT */}
        {chainPills}
        {/* FOOTER */}
        <LearnMoreLink
          textColor="$neutral1"
          textVariant="buttonLabel3"
          url={UniswapHelpUrls.articles.supportedNetworks}
        />

        <Flex row width="100%">
          <Button mt="$spacing12" emphasis="secondary" onPress={closeModal}>
            {t('common.button.close')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
