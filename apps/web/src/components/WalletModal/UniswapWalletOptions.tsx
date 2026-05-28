import { DetectedBadge } from 'components/WalletModal/shared'
import { useConnectorWithId } from 'components/WalletModal/useOrderedConnections'
import { uniswapWalletConnect } from 'components/Web3Provider/walletConnect'
import { useConnect } from 'hooks/useConnect'
import { useAtom } from 'jotai'
import { PropsWithChildren } from 'react'
import { Trans } from 'react-i18next'
import { persistHideMobileAppPromoBannerAtom } from 'state/application/atoms'
import { Flex, Image, Text } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { ScanQr } from 'ui/src/components/icons/ScanQr'
import { iconSizes } from 'ui/src/theme'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { isMobileWeb } from 'utilities/src/platform'

interface OptionContainerProps extends PropsWithChildren {
  hideBackground?: boolean
  recent?: boolean
  onPress?: () => void
  testID?: string
}

export function OptionContainer({ hideBackground, recent, children, onPress, testID }: OptionContainerProps) {
  return (
    <Flex
      row
      p="$spacing16"
      gap="$gap12"
      alignItems="center"
      borderRadius="$rounded16"
      borderWidth={recent ? 2 : 0}
      borderColor="$accent2"
      overflow="hidden"
      maxHeight={72}
      cursor="pointer"
      zIndex="$default"
      backgroundColor={!hideBackground ? '$surface2' : undefined}
      hoverStyle={{ backgroundColor: '$surface3' }}
      onPress={onPress}
      data-testid={testID}
    >
      {children}
    </Flex>
  )
}

export function UniswapWalletOptions() {
  const uniswapExtensionConnector = useConnectorWithId(CONNECTION_PROVIDER_IDS.UNISWAP_EXTENSION_RDNS)
  const [, setPersistHideMobileAppPromoBanner] = useAtom(persistHideMobileAppPromoBannerAtom)
  const { connect } = useConnect()

  return (
    <Flex gap={16}>
      <Flex gap={8}>
        {uniswapExtensionConnector ? (
          // If the extension is detected, show the option to connect
          <OptionContainer
            onPress={() => connect({ connector: uniswapExtensionConnector })}
            testID="connect-uniswap-extension"
          >
            <Image height={iconSizes.icon40} source={UNISWAP_LOGO} width={iconSizes.icon40} />
            <Flex row gap={4}>
              <Text variant="buttonLabel2" color="$neutral1" whiteSpace="nowrap">
                <Trans i18nKey="common.extension" />
              </Text>
            </Flex>
            <DetectedBadge />
          </OptionContainer>
        ) : null}
        <OptionContainer
          onPress={() => {
            setPersistHideMobileAppPromoBanner(true)
            connect({
              // Initialize Ring Wallet on click instead of in wagmi config
              // to avoid multiple wallet connect sockets being opened
              // and causing issues with messages getting dropped
              connector: uniswapWalletConnect(),
            })
          }}
        >
          {isMobileWeb ? (
            <Image height={iconSizes.icon40} source={UNISWAP_LOGO} width={iconSizes.icon40} />
          ) : (
            <ScanQr
              size={iconSizes.icon40}
              minWidth={iconSizes.icon40}
              color="$accent1"
              backgroundColor="$accent2"
              borderRadius={8}
              p={7}
            />
          )}
          <Flex row justifyContent="space-between">
            <Flex>
              <Text variant="buttonLabel2" color="$neutral1" whiteSpace="nowrap">
                <Trans i18nKey="common.uniswapMobile" />
              </Text>
              <Text variant="body4" color="$neutral2" whiteSpace="nowrap">
                {isMobileWeb ? <Trans i18nKey="wallet.appSignIn" /> : <Trans i18nKey="wallet.scanToConnect" />}
              </Text>
            </Flex>
          </Flex>
        </OptionContainer>
      </Flex>
    </Flex>
  )
}
