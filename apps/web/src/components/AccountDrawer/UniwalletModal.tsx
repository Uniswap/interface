import MobileAppLogo from 'assets/svg/uniswap_app_logo.svg'
import { useConnectWallet } from 'features/wallet/connection/hooks/useConnectWallet'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Image, QRCodeDisplay, Separator, Text, useSporeColors } from 'ui/src'
import { CloseIconWithHover } from 'ui/src/components/icons/CloseIconWithHover'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ElementName, InterfaceEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { isWebAndroid, isWebIOS } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'
import { openDownloadApp } from 'utils/openDownloadApp'

export default function UniwalletModal() {
  const { t } = useTranslation()
  const [uri, setUri] = useState<string>()

  const { isConnecting, reset } = useConnectWallet()

  // Displays the modal if not on iOS/Android, a Uniswap Wallet Connection is pending, & qrcode URI is available
  const onLaunchedMobilePlatform = isWebIOS || isWebAndroid
  const open = !onLaunchedMobilePlatform && !!uri && isConnecting

  useEffect(() => {
    function listener({ type, data }: { type: string; data?: unknown }) {
      if (type === 'display_uniswap_uri' && typeof data === 'string') {
        setUri(data)
      }
    }

    window.addEventListener('display_uniswap_uri', listener)

    return () => {
      window.removeEventListener('display_uniswap_uri', listener)
    }
  }, [])

  const close = useEvent(() => {
    reset()
    setUri(undefined)
  })

  useEffect(() => {
    if (open) {
      sendAnalyticsEvent(InterfaceEventName.UniswapWalletConnectModalOpened)
    } else {
      setUri(undefined)
    }
  }, [open])

  const colors = useSporeColors()
  return (
    <Modal name={ModalName.UniWalletConnect} isModalOpen={open} onClose={close} padding={0}>
      <Flex shrink grow p="$spacing20">
        <Flex row justifyContent="space-between">
          <Text variant="subheading1">{t('account.drawer.modal.scan')}</Text>
          <CloseIconWithHover onClose={close} />
        </Flex>

        <Flex row my="$spacing24" centered>
          {uri && (
            <QRCodeDisplay
              ecl="M"
              color={colors.accent1.val}
              containerBackgroundColor={colors.surface1.val}
              encodedValue={uri}
              size={370}
            >
              <Flex borderRadius="$rounded32" borderWidth="$spacing8" borderColor="$surface2">
                <Image src={MobileAppLogo} width={81} height={81} />
              </Flex>
            </QRCodeDisplay>
          )}
        </Flex>
        <Separator />
        <Flex centered row pt="$spacing20" justifyContent="space-between" gap="$spacing20">
          <Flex shrink>
            <Text variant="subheading2">{t('account.drawer.modal.dont')}</Text>
            <Text variant="body3" color="$neutral2">
              {t('account.drawer.modal.body')}
            </Text>
          </Flex>
          <Flex row>
            <Button
              size="small"
              emphasis="primary"
              variant="branded"
              onPress={() => openDownloadApp({ element: ElementName.UniswapWalletModalDownloadButton })}
            >
              {t('common.download')}
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Modal>
  )
}
