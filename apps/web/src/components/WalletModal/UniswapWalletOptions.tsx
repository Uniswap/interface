import { isMobileWeb } from '@universe/environment'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { iconSizes } from 'ui/src/theme'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useEvent } from 'utilities/src/react/hooks'
import { MenuStateVariant, useSetMenu } from '~/components/AccountDrawer/menuState'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { DetectedBadge } from '~/components/WalletModal/shared'
import { UniswapBrandedIcon } from '~/components/WalletModal/UniswapBrandedIcon'
import { useWalletWithId } from '~/features/accounts/store/hooks'
import { useConnectWallet } from '~/features/wallet/connection/hooks/useConnectWallet'
import { useSignInWithPasskey } from '~/hooks/useSignInWithPasskey'

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
      backgroundColor={!hideBackground ? '$surface2' : '$transparent'}
      hoverStyle={{ backgroundColor: '$surface3' }}
      onPress={onPress}
      data-testid={testID}
    >
      {children}
    </Flex>
  )
}

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
        ) : null}
        {/* HookSwap: removed the "Get Uniswap Wallet" download promo (unicorn CTA). */}
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

        {/* HookSwap: removed the mobile-web "Get Uniswap Wallet" app-store download promo. */}
      </Flex>
    </Flex>
  )
}
