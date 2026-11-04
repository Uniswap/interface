import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex, Text } from '@universe/mycelium'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image } from 'ui/src'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useEvent } from 'utilities/src/react/hooks'
import UNIWALLET_ICON from '~/assets/wallets/uniswap-wallet-icon.png'
import { OptionContainer } from '~/features/wallet/components/WalletModal/OptionContainer'
import { useModalState } from '~/hooks/useModalState'
import { useAccountDrawer } from '~/state/accountDrawer/hooks'

interface BackgroundImageProps {
  backgroundImage?: string
  isHovered?: boolean
}

function BackgroundImage({ backgroundImage, isHovered }: BackgroundImageProps) {
  return (
    <Flex
      position="absolute"
      top={0}
      left={0}
      width="100%"
      height="100%"
      borderRadius="$rounded16"
      zIndex={0}
      opacity={isHovered ? 0.54 : 1}
      maxHeight={72}
      style={{
        background: `url(${backgroundImage})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        // Scoped to opacity (the only animated property) — the legacy Tamagui `fast` preset
        transition: 'opacity 100ms cubic-bezier(0.17, 0.67, 0.45, 1)',
      }}
    />
  )
}

export const DownloadWalletOption = () => {
  const { t } = useTranslation()
  const accountDrawer = useAccountDrawer()
  const { openModal: openGetTheAppModal } = useModalState(ModalName.GetTheApp)
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  // Hovered state is passed from the background component to the background image which is layered underneath the option container
  const [optionHovered, setOptionHovered] = useState(false)

  const onClickDownload = useEvent(() => {
    openGetTheAppModal()
    accountDrawer.toggle()
  })

  return (
    <Trace logPress element={ElementName.ExtensionDownloadConnector}>
      {/* The white background is needed so that when hovered the background image always becomes lighter even when the app is in dark mode */}
      <Flex
        maxHeight={72}
        width="100%"
        backgroundColor="$white"
        borderRadius={16}
        position="relative"
        onHoverIn={() => setOptionHovered(true)}
        onHoverOut={() => setOptionHovered(false)}
        testID="download-uniswap-wallet"
      >
        <BackgroundImage backgroundImage="/images/extension_promo/background_connector.png" isHovered={optionHovered} />
        <OptionContainer onPress={onClickDownload} hideBackground>
          <Image
            src={UNIWALLET_ICON}
            alt="uniswap-app-icon"
            height={isEmbeddedWalletEnabled ? 32 : 40}
            width={isEmbeddedWalletEnabled ? 32 : 40}
            borderRadius={12}
          />
          <Flex row gap={4}>
            <Flex>
              <Text variant="buttonLabel2" color="$white" whiteSpace="nowrap">
                {t('common.getUniswapWallet')}
              </Text>
              <Text variant="body4" color="$white" whiteSpace="nowrap">
                {t('common.availableOnIOSAndroidChrome')}
              </Text>
            </Flex>
          </Flex>
        </OptionContainer>
      </Flex>
    </Trace>
  )
}
