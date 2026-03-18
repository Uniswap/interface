import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { ShieldCheck } from 'ui/src/components/icons/ShieldCheck'
import { InformationBanner } from 'uniswap/src/components/banners/InformationBanner'
import { InfoLinkModal } from 'uniswap/src/components/modals/InfoLinkModal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName, WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { isMobileApp } from 'utilities/src/platform'

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
        description={isMobileApp ? t('hidden.nfts.info.text.mobile') : t('hidden.nfts.info.text.web')}
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
