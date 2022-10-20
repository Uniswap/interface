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
import { toSupportedChainId } from 'src/utils/chainId'
import { openUri } from 'src/utils/linking'

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
      mb="sm"
      p="md"
      width="48%">
      <Button name={ElementName.WCOpenDapp} onPress={() => openUri(dapp.url)}>
        <Flex centered gap="xs">
          {dapp.icon ? (
            <Flex>
              <RemoteImage
                borderRadius={theme.borderRadii.none}
                height={40}
                uri={dapp.icon}
                width={40}
              />
            </Flex>
          ) : null}
          <Text numberOfLines={2} textAlign="center" variant="buttonLabelMedium">
            {dapp.name}
          </Text>
          <Text
            color="accentActive"
            numberOfLines={1}
            textAlign="center"
            variant="buttonLabelMicro">
            {dapp.url}
          </Text>
        </Flex>
      </Button>
      <Button name={ElementName.WCDappSwitchNetwork} onPress={onPressChangeNetwork}>
        <Flex
          row
          shrink
          borderColor="backgroundOutline"
          borderRadius="lg"
          borderWidth={1}
          gap="none"
          justifyContent="space-between"
          p="xs">
          {chainId ? (
            <Flex fill row shrink gap="xs">
              <NetworkLogo chainId={chainId} size={20} />
              <Flex shrink>
                <Text color="textSecondary" numberOfLines={1} variant="bodySmall">
                  {CHAIN_INFO[chainId].label}
                </Text>
              </Flex>
            </Flex>
          ) : (
            <Text color="textSecondary" style={flex.shrink} variant="bodySmall">
              {t('Unsupported chain')}
            </Text>
          )}
          <Chevron color={theme.colors.textTertiary} direction="s" height="20" width="20" />
        </Flex>
      </Button>
    </Flex>
  )
}
