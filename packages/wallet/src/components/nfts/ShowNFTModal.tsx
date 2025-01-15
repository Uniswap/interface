import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { ShieldCheck } from 'ui/src/components/icons'
import { InfoLinkModal } from 'uniswap/src/components/modals/InfoLinkModal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName, WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { isExtension } from 'utilities/src/platform'
import { InformationBanner } from 'wallet/src/components/banners/InformationBanner'

export function ShowNFTModal(): JSX.Element {
  const { t } = useTranslation()
  const [isModalVisible, setModalVisible] = useState(false)

  const handlePressToken = (): void => {
    setModalVisible(true)
  }

  const closeModal = (): void => {
    setModalVisible(false)
  }

  const handleAnalytics = (): void => {
    sendAnalyticsEvent(WalletEventName.ExternalLinkOpened, {
      url: uniswapUrls.helpArticleUrls.hiddenNFTInfo,
    })
  }

  return (
    <>
      <Flex>
        <InformationBanner infoText={t('hidden.nfts.info.banner.text')} onPress={handlePressToken} />
      </Flex>

      <InfoLinkModal
        showCloseButton
        buttonText={t('common.button.close')}
        buttonTheme="tertiary"
        description={isExtension ? t('hidden.nfts.info.text.extension') : t('hidden.nfts.info.text.mobile')}
        icon={
          <Flex centered backgroundColor="$surface3" borderRadius="$rounded12" p="$spacing12">
            <ShieldCheck color="$neutral1" size="$icon.24" />
          </Flex>
        }
        isOpen={isModalVisible}
        linkText={t('common.button.learn')}
        linkUrl={uniswapUrls.helpArticleUrls.hiddenNFTInfo}
        name={ModalName.HiddenNFTInfoModal}
        title={t('hidden.nfts.info.text.title')}
        onAnalyticsEvent={handleAnalytics}
        onButtonPress={closeModal}
        onDismiss={closeModal}
      />
    </>
  )
}
