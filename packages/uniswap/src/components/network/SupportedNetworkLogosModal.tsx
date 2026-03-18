import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Image, Text, TouchableArea } from 'ui/src'
import { GlobeFilled } from 'ui/src/components/icons/GlobeFilled'
import { X } from 'ui/src/components/icons/X'
import { borderRadii, iconSizes, zIndexes } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isWebApp } from 'utilities/src/platform'

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
              p="$spacing4"
              backgroundColor="$surface2"
              width="max-content"
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
          url={uniswapUrls.helpArticleUrls.supportedNetworks}
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
