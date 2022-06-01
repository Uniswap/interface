import React from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { Button } from 'src/components/buttons/Button'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { Chevron } from 'src/components/icons/Chevron'
import { RemoteImage } from 'src/components/images/RemoteImage'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { CHAIN_INFO } from 'src/constants/chains'
import { ElementName } from 'src/features/telemetry/constants'
import { WalletConnectSession } from 'src/features/walletConnect/walletConnectSlice'
import { flex } from 'src/styles/flex'
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
  const { t } = useTranslation()

  const { dapp } = wrapped.item
  const chainId = toSupportedChainId(dapp.chain_id)

  return (
    <Flex
      bg="translucentBackground"
      borderRadius="md"
      gap="md"
      justifyContent="space-between"
      m="xs"
      p="md"
      width={ITEM_WIDTH}>
      <Button name={ElementName.WCOpenDapp} onPress={() => openUri(dapp.url)}>
        <Flex centered gap="xs">
          {dapp.icon && (
            <Flex>
              <RemoteImage
                borderRadius={theme.borderRadii.none}
                height={40}
                imageUrl={dapp.icon}
                width={40}
              />
            </Flex>
          )}
          <Text numberOfLines={2} textAlign="center" variant="mediumLabel">
            {dapp.name}
          </Text>
          <Text color="deprecated_blue" numberOfLines={1} textAlign="center" variant="caption">
            {dapp.url}
          </Text>
        </Flex>
      </Button>
      <Button name={ElementName.WCDappSwitchNetwork} onPress={onPressChangeNetwork}>
        <Flex
          row
          shrink
          borderColor="lightBorder"
          borderRadius="lg"
          borderWidth={1}
          gap="sm"
          justifyContent="space-between"
          p="xs">
          {chainId ? (
            <Flex row shrink gap="xs">
              <NetworkLogo chainId={chainId} size={20} />
              <Text color="deprecated_gray600" variant="body2">
                {CHAIN_INFO[chainId].label}
              </Text>
            </Flex>
          ) : (
            <Text color="deprecated_gray600" style={flex.shrink} variant="body2">
              {t('Unsupported chain')}
            </Text>
          )}
          <Chevron color={theme.colors.neutralTextTertiary} direction="s" height="10" width="13" />
        </Flex>
      </Button>
    </Flex>
  )
}
