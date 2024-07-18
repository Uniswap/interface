import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { saveDappConnection } from 'src/app/features/dapp/actions'
import { useDappContext } from 'src/app/features/dapp/DappContext'
import { extractUrlHost } from 'src/app/features/dappRequests/utils'
import { Anchor, Button, Flex, Popover, Separator, Text, TouchableArea } from 'ui/src'
import { X } from 'ui/src/components/icons'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

export function ConnectPopupContent({
  onClose,
  asPopover = false,
  showConnectButton = false,
}: {
  onClose?: () => void
  asPopover?: boolean
  showConnectButton?: boolean
}): JSX.Element {
  const { t } = useTranslation()

  const { dappUrl } = useDappContext()
  const activeAccount = useActiveAccountWithThrow()

  const onConnect = async (): Promise<void> => {
    await saveDappConnection(dappUrl, activeAccount)
    onClose?.()
  }

  return (
    <Flex px="$spacing8" py="$spacing4" width={220}>
      <Flex row gap="$spacing16">
        <Flex fill>
          <Text variant="subheading2">{t('extension.connection.titleNotConnected')}</Text>
          <Anchor href={dappUrl} textDecorationLine="none">
            <Flex>
              <Text color="$neutral2" numberOfLines={1} variant="buttonLabel4">
                {extractUrlHost(dappUrl)}
              </Text>
            </Flex>
          </Anchor>
        </Flex>
        {!asPopover && (
          <TouchableArea onPress={onClose}>
            <X color="$neutral3" size="$icon.20" />
          </TouchableArea>
        )}
      </Flex>
      <Separator my="$spacing8" />
      <Flex gap="$spacing8">
        <Text color="$neutral2" variant="body4">
          {showConnectButton ? t('extension.connection.popupWithButton') : t('extension.connection.popup')}
        </Text>
        {showConnectButton ? (
          asPopover ? (
            <Popover.Close onPress={onConnect}>
              <Button mt="$spacing8" size="small" theme="tertiary">
                {t('common.button.connect')}
              </Button>
            </Popover.Close>
          ) : (
            <Button mt="$spacing8" size="small" theme="tertiary" onPress={onConnect}>
              {t('common.button.connect')}
            </Button>
          )
        ) : (
          <Link
            style={{ textDecoration: 'none' }}
            target="_blank"
            to={uniswapUrls.helpArticleUrls.extensionDappTroubleshooting}
            onClick={() =>
              sendAnalyticsEvent(ExtensionEventName.DappTroubleConnecting, {
                dappUrl,
              })
            }
          >
            <Text color="$accent1" variant="buttonLabel4">
              {t('extension.connection.popup.trouble')}
            </Text>
          </Link>
        )}
      </Flex>
    </Flex>
  )
}
