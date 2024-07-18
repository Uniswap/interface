import { useTranslation } from 'react-i18next'
import { useDappContext } from 'src/app/features/dapp/DappContext'
import { removeDappConnection, saveDappChain } from 'src/app/features/dapp/actions'
import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import { extractUrlHost } from 'src/app/features/dappRequests/utils'
import { PopupName, closePopup } from 'src/app/features/popups/slice'
import { useAppDispatch } from 'src/store/store'
import { Anchor, Button, Flex, Popover, Separator, Text, getTokenValue } from 'ui/src'
import { Check, Power } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { WALLET_SUPPORTED_CHAIN_IDS, WalletChainId } from 'uniswap/src/types/chains'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

export function SwitchNetworksModal(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { dappUrl, dappIconUrl } = useDappContext()
  const activeWalletAccount = useActiveAccountWithThrow()
  const activeChain = useDappLastChainId(dappUrl)

  const onNetworkClicked = async (chainId: WalletChainId): Promise<void> => {
    await saveDappChain(dappUrl, chainId)
    sendAnalyticsEvent(ExtensionEventName.SidebarSwitchChain, {
      previousChainId: activeChain,
      newChainId: chainId,
    })
  }

  const onDisconnect = async (): Promise<void> => {
    await removeDappConnection(dappUrl, activeWalletAccount)
    dispatch(pushNotification({ type: AppNotificationType.DappDisconnected, dappIconUrl }))
    dispatch(closePopup(PopupName.Connect))
    sendAnalyticsEvent(ExtensionEventName.SidebarDisconnect)
  }

  return (
    <Flex
      alignContent="center"
      // TODO:  update background color to blurry scrim when available
      backgroundColor="$surface1"
      borderRadius="$rounded24"
      pt="$spacing8"
      width={220}
    >
      <Flex px="$spacing8">
        <Text variant="subheading2">{t('extension.connection.titleConnected')}</Text>
        {dappUrl ? (
          <Anchor color="$accent1" href={dappUrl} textDecorationLine="none">
            <Flex>
              <Text color="$accent1" numberOfLines={1} variant="buttonLabel4">
                {extractUrlHost(dappUrl)}
              </Text>
            </Flex>
          </Anchor>
        ) : null}
      </Flex>

      <Separator mb="$spacing4" mt="$spacing8" />

      {WALLET_SUPPORTED_CHAIN_IDS.map((chain: WalletChainId) => {
        return (
          <Popover.Close asChild>
            <Button
              key={chain}
              borderRadius="$rounded12"
              justifyContent="space-between"
              px="$spacing8"
              py="$spacing8"
              theme={null}
              onPress={async (): Promise<void> => onNetworkClicked(chain)}
            >
              <Flex grow row alignItems="center" justifyContent="flex-start">
                <Flex grow row alignItems="center" gap="$spacing8">
                  <NetworkLogo chainId={chain} size={iconSizes.icon20} />
                  <Text color="$neutral1" variant="subheading2">
                    {UNIVERSE_CHAIN_INFO[chain]?.label}
                  </Text>
                </Flex>
                {activeChain === chain ? (
                  <Flex row>
                    <Check color="$neutral2" size={iconSizes.icon20} />
                  </Flex>
                ) : null}
              </Flex>
            </Button>
          </Popover.Close>
        )
      })}

      <Popover.Close asChild>
        <Button mt="$spacing8" size="small" theme="tertiary" onPress={onDisconnect}>
          <Flex centered row gap="$spacing8">
            <Power color="$neutral1" size={getTokenValue('$icon.16')} />
            {/* TODO(EXT-207 / EXT-208): fix button component styling and derive text color from theme */}{' '}
            <Text color="$neutral1" variant="buttonLabel3">
              {t('common.button.disconnect')}
            </Text>
          </Flex>
        </Button>
      </Popover.Close>
    </Flex>
  )
}
