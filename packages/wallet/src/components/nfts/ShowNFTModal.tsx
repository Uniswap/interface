import { t } from 'i18next'
import { useState } from 'react'
import { Flex } from 'ui/src'
import { ShieldCheck } from 'ui/src/components/icons'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName, WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { InformationBanner } from 'wallet/src/components/banners/InformationBanner'
import { InfoLinkModal } from 'wallet/src/components/modals/InfoLinkModal'

export function ShowNFTModal(): JSX.Element {
  const [isModalVisible, setModalVisible] = useState(false)

  const handlePressToken = (): void => {
    setModalVisible(true)
  }

  const closeModal = (): void => {
    setModalVisible(false)
  }

  const handleAnalytics = (): void => {
    sendAnalyticsEvent(WalletEventName.ExternalLinkOpened, {
      url: uniswapUrls.helpArticleUrls.hiddenTokenInfo,
    })
  }

  return (
    <>
      <Flex mx="$spacing12">
        <InformationBanner infoText={t('hidden.tokens.info.banner.text')} onPress={handlePressToken} />
      </Flex>

      <InfoLinkModal
        showCloseButton
        buttonText={t('common.button.close')}
        buttonTheme="tertiary"
        description={t('hidden.nfts.info.text.info')}
        icon={
          <Flex centered backgroundColor="$surface3" borderRadius="$rounded12" p="$spacing12">
            <ShieldCheck color="$neutral1" size="$icon.24" />
          </Flex>
        }
        isOpen={isModalVisible}
        linkText={t('common.button.learn')}
        linkUrl={uniswapUrls.helpArticleUrls.hiddenTokenInfo}
        name={ModalName.HiddenNFTInfoModal}
        title={t('hidden.nfts.info.text.title')}
        onAnalyticsEvent={handleAnalytics}
        onButtonPress={closeModal}
        onDismiss={closeModal}
      />
    </>
  )
}
