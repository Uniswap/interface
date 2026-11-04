import { Platform } from '@universe/chains'
import { isMobileWeb } from '@universe/environment'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex, Separator } from '@universe/mycelium'
import { Fragment } from 'react'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { ExternalWallet } from '~/connection/accounts/types'
import { useRecentConnectorId } from '~/connection/constants'
import { useOrderedWallets } from '~/connection/hooks/useOrderedWalletConnectors'
import { NoSolanaWalletConnectedView } from '~/features/wallet/components/WalletModal/NoSolanaWalletConnectedView'
import { UniswapMobileWalletConnectorOption } from '~/features/wallet/components/WalletModal/UniswapMobileWalletConnectorOption'
import {
  OtherWalletsOption,
  WalletConnectorOption,
} from '~/features/wallet/components/WalletModal/WalletConnectorOption'
import { MenuStateVariant, useSetMenuCallback } from '~/state/accountDrawer/menuState'
import { transitions } from '~/theme/styles'

interface WalletOptionsGridProps {
  connectOnPlatform?: Platform | 'any'
  showMobileConnector?: boolean
  showOtherWallets?: boolean
  onShowOtherWallets?: () => void
  showSeparators?: boolean
  maxHeight?: string
  opacity?: number
}

/**
 * Finds the wallet tagged "Recent" within `wallets`, which `useOrderedWallets` has already sorted to the front.
 * Uniswap Mobile is excluded because it is rendered as its own row rather than as part of `wallets`.
 */
function findRecentWallet({
  wallets,
  recentConnectorId,
}: {
  wallets: ExternalWallet[]
  recentConnectorId?: string
}): ExternalWallet | undefined {
  if (!recentConnectorId || recentConnectorId === CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID) {
    return undefined
  }
  return wallets.find((wallet) => wallet.id === recentConnectorId)
}

export function WalletOptionsGrid({
  connectOnPlatform,
  showMobileConnector = false,
  showOtherWallets = false,
  onShowOtherWallets,
  showSeparators = true,
  maxHeight = '100vh',
  opacity = 1,
}: WalletOptionsGridProps): JSX.Element {
  const defaultShowOtherWalletsCallback = useSetMenuCallback(MenuStateVariant.OTHER_WALLETS)
  const showOtherWalletsCallback = onShowOtherWallets ?? defaultShowOtherWalletsCallback
  const wallets = useOrderedWallets({ showSecondaryConnectors: isMobileWeb, platformFilter: connectOnPlatform })
  const recentConnectorId = useRecentConnectorId()
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)

  const shouldShowMobileConnector =
    showMobileConnector &&
    (recentConnectorId === CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID ||
      isMobileWeb ||
      isEmbeddedWalletEnabled)
  // Mobile web already inlines the secondary connectors (showSecondaryConnectors: isMobileWeb above),
  // so the "Other wallets" row would open an empty list there.
  const shouldShowOtherWallets = showOtherWallets && !isMobileWeb

  // The Uniswap Mobile row sits above `wallets`, which would bury the wallet tagged "Recent" a slot down;
  // lift that wallet above the Uniswap Mobile row so returning users still see their last-used wallet first.
  const recentWallet = shouldShowMobileConnector ? findRecentWallet({ wallets, recentConnectorId }) : undefined
  const remainingWallets = recentWallet ? wallets.filter((wallet) => wallet !== recentWallet) : wallets
  const rowSeparator = isEmbeddedWalletEnabled ? <Flex height={2} backgroundColor="$surface1" /> : <Separator />

  if (connectOnPlatform === Platform.SVM && wallets.length === 0) {
    return <NoSolanaWalletConnectedView />
  }

  return (
    <Flex row alignItems="flex-start">
      <Flex
        borderRadius="$rounded16"
        overflow="hidden"
        width="100%"
        maxHeight={maxHeight}
        opacity={opacity}
        transition={`${transitions.duration.medium} ${transitions.timing.inOut}`}
        testID="option-grid"
      >
        {recentWallet && (
          <>
            <WalletConnectorOption wallet={recentWallet} connectOnPlatform={connectOnPlatform} />
            {showSeparators && rowSeparator}
          </>
        )}
        {shouldShowMobileConnector && (
          <>
            <UniswapMobileWalletConnectorOption />
            {rowSeparator}
          </>
        )}
        {remainingWallets.map((wallet, index) => (
          <Fragment key={wallet.name}>
            <WalletConnectorOption wallet={wallet} connectOnPlatform={connectOnPlatform} />
            {showSeparators && (index < remainingWallets.length - 1 || shouldShowOtherWallets) && rowSeparator}
          </Fragment>
        ))}
        {shouldShowOtherWallets && <OtherWalletsOption onPress={showOtherWalletsCallback} />}
      </Flex>
    </Flex>
  )
}
