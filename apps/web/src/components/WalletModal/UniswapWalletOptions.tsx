import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { MenuStateVariant, useSetMenu } from 'components/AccountDrawer/menuState'
import { GooglePlayStoreLogo } from 'components/Icons/GooglePlayStoreLogo'
import { DownloadWalletOption } from 'components/WalletModal/DownloadWalletOption'
import { DetectedBadge } from 'components/WalletModal/shared'
import { useWalletWithId } from 'features/accounts/store/hooks'
import { useConnectWallet } from 'features/wallet/connection/hooks/useConnectWallet'
import { useAtom } from 'jotai'
import { PropsWithChildren } from 'react'
import { Trans } from 'react-i18next'
import { persistHideMobileAppPromoBannerAtom } from 'state/application/atoms'
import { Flex, Image, Text } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { AppStoreLogo } from 'ui/src/components/icons/AppStoreLogo'
import { PhoneDownload } from 'ui/src/components/icons/PhoneDownload'
import { ScanQr } from 'ui/src/components/icons/ScanQr'
import { iconSizes } from 'ui/src/theme'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { isMobileWeb, isWebIOS } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'
import { openDownloadApp } from 'utils/openDownloadApp'

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
  const [, setPersistHideMobileAppPromoBanner] = useAtom(persistHideMobileAppPromoBannerAtom)

  const uniswapExtensionWallet = useWalletWithId(CONNECTION_PROVIDER_IDS.UNISWAP_EXTENSION_RDNS)
  const uniswapMobileWallet = useWalletWithId(CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID)

  const accountDrawer = useAccountDrawer()
  const setMenu = useSetMenu()

  const onSuccess = useEvent(() => {
    accountDrawer.close()
    setMenu({ variant: MenuStateVariant.MAIN })
  })

  const { connectWallet } = useConnectWallet()

  return (
    <Flex gap={16}>
      <Flex gap={8}>
        {uniswapExtensionWallet ? (
          // If the extension is detected, show the option to connect
          <OptionContainer
            onPress={() => connectWallet({ wallet: uniswapExtensionWallet, onSuccess })}
            testID="connect-uniswap-extension"
          >
            <Flex row grow justifyContent="space-between" alignItems="center">
              <Flex row gap="$gap12" alignItems="center">
                <Image height={iconSizes.icon40} source={UNISWAP_LOGO} width={iconSizes.icon40} />
                <Text variant="buttonLabel2" color="$neutral1" whiteSpace="nowrap">
                  <Trans i18nKey="common.extension" />
                </Text>
              </Flex>
              <DetectedBadge />
            </Flex>
          </OptionContainer>
        ) : !isMobileWeb ? (
          <DownloadWalletOption />
        ) : null}
        <OptionContainer
          onPress={() => (uniswapMobileWallet ? connectWallet({ wallet: uniswapMobileWallet, onSuccess }) : undefined)}
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

        {isMobileWeb && (
          // If on a mobile web browser show the relevant app store download link
          <OptionContainer
            onPress={() => {
              setPersistHideMobileAppPromoBanner(true)
              openDownloadApp({ element: ElementName.UniswapWalletModalDownloadButton })
            }}
          >
            <PhoneDownload size="$icon.40" minWidth={40} color="$accent1" backgroundColor="$accent2" borderRadius={8} />
            <Flex row grow alignItems="center">
              <Flex grow>
                <Text variant="buttonLabel3" color="$neutral1" whiteSpace="nowrap">
                  <Trans i18nKey="common.getUniswapWallet" />
                </Text>
                <Text variant="body4" color="$neutral2" whiteSpace="nowrap">
                  {isWebIOS ? (
                    <Trans i18nKey="common.downloadAppStore" />
                  ) : (
                    <Trans i18nKey="common.downloadPlayStore" />
                  )}
                </Text>
              </Flex>
              {isWebIOS ? (
                <AppStoreLogo size="$icon.24" />
              ) : (
                <Flex p="$padding6" borderRadius="$rounded8" backgroundColor="$neutral1">
                  <GooglePlayStoreLogo />
                </Flex>
              )}
            </Flex>
          </OptionContainer>
        )}
      </Flex>
    </Flex>
  )
}
