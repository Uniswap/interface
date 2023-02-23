import React from 'react'
import { useTranslation } from 'react-i18next'
import { useColorScheme } from 'react-native'
import 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { Chevron } from 'src/components/icons/Chevron'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { DappHeaderIcon } from 'src/components/WalletConnect/DappHeaderIcon'
import { CHAIN_INFO } from 'src/constants/chains'
import { ElementName } from 'src/features/telemetry/constants'
import {
  WalletConnectSession,
  WalletConnectSessionV1,
} from 'src/features/walletConnect/walletConnectSlice'
import { toSupportedChainId } from 'src/utils/chainId'
import { openUri } from 'src/utils/linking'

export function DappConnectionItem({
  session,
  onPressChangeNetwork,
}: {
  session: WalletConnectSession
  onPressChangeNetwork: (session: WalletConnectSessionV1) => void
}): JSX.Element {
  const theme = useAppTheme()
  const { dapp } = session

  return (
    <Flex
      bg="background2"
      borderRadius="rounded16"
      gap="spacing16"
      justifyContent="space-between"
      mb="spacing12"
      px="spacing12"
      py="spacing16"
      width="48%">
      <TouchableArea
        flex={1}
        name={ElementName.WCOpenDapp}
        onPress={(): Promise<void> => openUri(dapp.url)}>
        <Flex centered grow gap="spacing8">
          <Flex fill>
            <DappHeaderIcon dapp={dapp} showChain={false} />
          </Flex>
          <Text numberOfLines={2} textAlign="center" variant="buttonLabelMedium">
            {dapp.name || dapp.url}
          </Text>
          <Text
            color="accentActive"
            numberOfLines={1}
            textAlign="center"
            variant="buttonLabelMicro">
            {dapp.url}
          </Text>
        </Flex>
      </TouchableArea>
      {session.version === '1' ? (
        <ChangeNetworkButton session={session} onPressChangeNetwork={onPressChangeNetwork} />
      ) : (
        <Flex centered>
          <Box
            flexDirection="row"
            height={theme.iconSizes.icon28}
            width={
              theme.iconSizes.icon28 +
              (session.chains.length - 1) * theme.iconSizes.icon28 * (2 / 3)
            }>
            {session.chains.map((chainId, index) => (
              <Box
                key={chainId}
                left={index * theme.iconSizes.icon28 * (2 / 3)}
                position="absolute">
                <NetworkLogo chainId={chainId} size={theme.iconSizes.icon28} />
              </Box>
            ))}
          </Box>
        </Flex>
      )}
    </Flex>
  )
}

function ChangeNetworkButton({
  session,
  onPressChangeNetwork,
}: {
  session: WalletConnectSessionV1
  onPressChangeNetwork: (session: WalletConnectSessionV1) => void
}): JSX.Element {
  const theme = useAppTheme()
  const { t } = useTranslation()

  // Only WC v1.0 connections have a current chain_id
  const supportedChainId = toSupportedChainId(session.dapp.chain_id)
  const isDarkMode = useColorScheme() === 'dark'

  return (
    <TouchableArea
      name={ElementName.WCDappSwitchNetwork}
      onPress={(): void => onPressChangeNetwork(session)}>
      <Flex
        row
        shrink
        backgroundColor={isDarkMode ? 'background3' : 'background3'}
        borderRadius="roundedFull"
        gap="none"
        justifyContent="space-between"
        p="spacing8">
        {supportedChainId ? (
          <Flex fill row shrink gap="spacing8">
            <NetworkLogo chainId={supportedChainId} />
            <Flex shrink>
              <Text
                color="textSecondary"
                numberOfLines={1}
                textAlign="center"
                variant="buttonLabelSmall">
                {CHAIN_INFO[supportedChainId].label}
              </Text>
            </Flex>
          </Flex>
        ) : (
          <Text color="textSecondary" textAlign="center" variant="buttonLabelSmall">
            {t('Unsupported chain')}
          </Text>
        )}
        <Chevron
          color={theme.colors.textTertiary}
          direction="s"
          height={theme.iconSizes.icon20}
          width={theme.iconSizes.icon20}
        />
      </Flex>
    </TouchableArea>
  )
}
