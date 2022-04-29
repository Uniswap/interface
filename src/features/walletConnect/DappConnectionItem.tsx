import React from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import X from 'src/assets/icons/x.svg'
import { Button } from 'src/components/buttons/Button'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { Chevron } from 'src/components/icons/Chevron'
import { RemoteImage } from 'src/components/images/RemoteImage'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { CHAIN_INFO } from 'src/constants/chains'
import { ElementName } from 'src/features/telemetry/constants'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { disconnectFromApp } from 'src/features/walletConnect/WalletConnect'
import { WalletConnectSession } from 'src/features/walletConnect/walletConnectSlice'
import { dimensions, spacing } from 'src/styles/sizing'
import { toSupportedChainId } from 'src/utils/chainId'
import { openUri } from 'src/utils/linking'

const HORIZONTAL_MARGIN = spacing.sm * 2
const ITEM_HORIZONTAL_MARGIN = spacing.xs * 2
const NUM_COLUMNS = 2
const ITEM_WIDTH =
  (dimensions.fullWidth - HORIZONTAL_MARGIN - ITEM_HORIZONTAL_MARGIN * NUM_COLUMNS) / NUM_COLUMNS

export function DappConnectionItem({
  wrapped,
  onPressChangeNetwork,
}: {
  wrapped: ListRenderItemInfo<WalletConnectSession>
  onPressChangeNetwork: () => void
}) {
  const theme = useAppTheme()
  const activeAccount = useActiveAccount()
  const { t } = useTranslation()

  const { dapp } = wrapped.item
  const chainId = toSupportedChainId(dapp.chain_id)

  return (
    <Flex
      bg="gray50"
      borderRadius="md"
      gap="none"
      justifyContent="space-between"
      m="xs"
      width={ITEM_WIDTH}>
      <Flex row justifyContent="space-between" pt="md" px="md">
        {dapp.icon && (
          <Flex>
            <RemoteImage
              borderRadius={theme.borderRadii.full}
              height={40}
              imageUrl={dapp.icon}
              width={40}
            />
          </Flex>
        )}
        <Button
          onPress={() => {
            // TODO handle UX around disconnection (notification? ensure hidden from list?)
            if (activeAccount) disconnectFromApp(wrapped.item.id, activeAccount.address)
          }}>
          <X
            height={16}
            stroke={theme.colors.textColor}
            strokeLinecap="round"
            strokeWidth="2.5"
            width={16}
          />
        </Button>
      </Flex>
      <Flex flex={1} gap="none">
        <Flex flex={1} gap="xs" px="md" py="md">
          <Button name={ElementName.WCOpenDapp} onPress={() => openUri(dapp.url)}>
            <Flex gap="xs">
              <Text variant="h4">{dapp.name}</Text>
              <Text color="blue" numberOfLines={1} variant="bodySm">
                {dapp.url}
              </Text>
            </Flex>
          </Button>
        </Flex>
        <Box bg="gray200" height={0.5} width="100%" />
        <Button name={ElementName.WCDappSwitchNetwork} onPress={onPressChangeNetwork}>
          <Flex row justifyContent="space-between" px="md" py="sm">
            {chainId ? (
              <Flex row alignItems="center" gap="xxs">
                <NetworkLogo chainId={chainId} mr="xs" size={25} />
                <Text color="gray600" variant="h6">
                  {CHAIN_INFO[chainId].label}
                </Text>
              </Flex>
            ) : (
              <Text color="gray600" variant="h6">
                {t('Unsupported chain')}
              </Text>
            )}
            <Chevron color={theme.colors.gray600} direction="s" height="10" width="13" />
          </Flex>
        </Button>
      </Flex>
    </Flex>
  )
}
