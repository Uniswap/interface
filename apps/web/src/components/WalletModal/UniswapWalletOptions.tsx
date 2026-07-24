import { isMobileWeb, isWebIOS } from '@universe/environment'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useAtom } from 'jotai'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { AppStoreLogo } from 'ui/src/components/icons/AppStoreLogo'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { PhoneDownload } from 'ui/src/components/icons/PhoneDownload'
import { iconSizes } from 'ui/src/theme'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useEvent } from 'utilities/src/react/hooks'
import { MenuStateVariant, useSetMenu } from '~/components/AccountDrawer/menuState'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { GooglePlayStoreLogo } from '~/components/Icons/GooglePlayStoreLogo'
import { DownloadWalletOption } from '~/components/WalletModal/DownloadWalletOption'
import { OptionContainer } from '~/components/WalletModal/OptionContainer'
import { DetectedBadge } from '~/components/WalletModal/shared'
import { UniswapBrandedIcon } from '~/components/WalletModal/UniswapBrandedIcon'
import { useWalletWithId } from '~/features/accounts/store/hooks'
import { useConnectWallet } from '~/features/wallet/connection/hooks/useConnectWallet'
import { useSignInWithPasskey } from '~/hooks/useSignInWithPasskey'
import { persistHideMobileAppPromoBannerAtom } from '~/state/application/atoms'
import { openDownloadApp } from '~/utils/openDownloadApp'

function PasskeyLoginOption({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation()
  const { signInWithPasskey: handlePasskeyLogin } = useSignInWithPasskey({ onSuccess })

  return (
    <OptionContainer onPress={handlePasskeyLogin} testID={TestID.LogIn}>
      <Flex
        width={iconSizes.icon32}
        height={iconSizes.icon32}
        minWidth={iconSizes.icon32}
        alignItems="center"
        justifyContent="center"
        backgroundColor="$accent2"
        borderRadius="$rounded8"
      >
        <Passkey color="$accent1" size="$icon.24" />
      </Flex>
      <Text variant="buttonLabel2" color="$neutral1" whiteSpace="nowrap">
        {t('nav.logIn.button')}
      </Text>
    </OptionContainer>
  )
}

export function UniswapWalletOptions() {
  const { t } = useTranslation()
  const [, setPersistHideMobileAppPromoBanner] = useAtom(persistHideMobileAppPromoBannerAtom)
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)

  const uniswapExtensionWallet = useWalletWithId(CONNECTION_PROVIDER_IDS.UNISWAP_EXTENSION_RDNS)
  const uniswapMobileWallet = useWalletWithId(CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID)
  const embeddedWallet = useWalletWithId(CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID)

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
                <UniswapBrandedIcon withChromeBadge />
                <Text variant="buttonLabel2" color="$neutral1" whiteSpace="nowrap">
                  {t('common.extension')}
                </Text>
              </Flex>
              <DetectedBadge />
            </Flex>
          </OptionContainer>
        ) : !isMobileWeb ? (
          <DownloadWalletOption />
        ) : null}
        {isEmbeddedWalletEnabled && embeddedWallet ? <PasskeyLoginOption onSuccess={onSuccess} /> : null}
        <OptionContainer
          onPress={() => (uniswapMobileWallet ? connectWallet({ wallet: uniswapMobileWallet, onSuccess }) : undefined)}
        >
          <UniswapBrandedIcon />
          <Flex row justifyContent="space-between">
            <Flex>
              <Text variant="buttonLabel2" color="$neutral1" whiteSpace="nowrap">
                {t('common.uniswapMobile')}
              </Text>
              <Text variant="body4" color="$neutral2" whiteSpace="nowrap">
                {isMobileWeb ? t('wallet.appSignIn') : t('wallet.scanToConnect')}
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
                  {t('common.getUniswapWallet')}
                </Text>
                <Text variant="body4" color="$neutral2" whiteSpace="nowrap">
                  {isWebIOS ? t('common.downloadAppStore') : t('common.downloadPlayStore')}
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
