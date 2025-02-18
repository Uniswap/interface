import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DeprecatedButton,
  Flex,
  Image,
  Text,
  TouchableArea,
  UniversalImage,
  UniversalImageResizeMode,
  useSporeColors,
} from 'ui/src'
import { ALL_NETWORKS_LOGO, ALL_NETWORKS_LOGO_UNICHAIN } from 'ui/src/assets'
import { GlobeFilled } from 'ui/src/components/icons/GlobeFilled'
import { X } from 'ui/src/components/icons/X'
import { borderRadii, iconSizes, zIndexes } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isInterface } from 'utilities/src/platform'

export type NetworkLogosProps = {
  chains: UniverseChainId[]
}

export function NetworkLogos({ chains }: NetworkLogosProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const unichainPromoEnabled = useFeatureFlag(FeatureFlags.UnichainPromo)

  const [isShowingModal, setIsShowingModal] = useState(false)
  const closeModal = useCallback(() => setIsShowingModal(false), [])
  const openModal = useCallback(() => setIsShowingModal(true), [])

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

  const logo = unichainPromoEnabled ? ALL_NETWORKS_LOGO_UNICHAIN : ALL_NETWORKS_LOGO

  return (
    <>
      {/* TRIGGER BUTTON */}
      <DeprecatedButton
        backgroundColor="$surface2"
        alignSelf="center"
        borderRadius="$rounded16"
        aria-label={t('extension.connection.networks')}
        p="$padding8"
        pr="$padding12"
        hoverStyle={{ backgroundColor: colors.surface3Hovered.val }}
        pressStyle={{ backgroundColor: colors.surface3Hovered.val }}
        onPress={openModal}
      >
        <UniversalImage
          allowLocalUri
          uri={logo}
          size={{
            width: iconSizes.icon20,
            height: iconSizes.icon20,
            resizeMode: UniversalImageResizeMode.Contain,
          }}
        />
        <Text color="$neutral2" variant="buttonLabel4">
          {t('extension.connection.networks')}
        </Text>
      </DeprecatedButton>
      {/* SHEET/MODAL */}
      <Modal name={ModalName.QRCodeNetworkInfo} isModalOpen={isShowingModal} onClose={closeModal}>
        <Flex gap="$spacing12" px="$padding16" pb="$spacing4" alignItems="center" mt="$gap12">
          {/* X BUTTON */}
          {isInterface && (
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

          <DeprecatedButton width="100%" color="$neutral1" mt="$spacing12" theme="secondary" onPress={closeModal}>
            {t('common.button.close')}
          </DeprecatedButton>
        </Flex>
      </Modal>
    </>
  )
}
